# Change Review Payloads

## Purpose

This document defines how approval requests can carry both review-oriented and execution-oriented change metadata.

The base schema already stores:

- `before_state`
- `after_state`

Those snapshots are useful, but they leave two pieces of work to the application:

- calculating a user-friendly view of what changed
- determining the exact operation to execute when the request is approved

To reduce that repeated logic, `approval_requests` also supports:

- `changed_fields`
- `change_patch`

## Field Roles

### `before_state`

Canonical JSON snapshot of the approved state before the request.

### `after_state`

Canonical JSON snapshot of the proposed state after the request.

### `changed_fields`

Review-oriented JSON payload.

Use it to describe the meaningful business differences in a shape that a UI can render directly without recalculating the diff.

Typical uses:

- showing field-by-field changes for entity updates
- showing relationship add or remove details for join tables
- attaching resolved display data such as codes or names that are easier for approvers to read than numeric IDs alone

### `change_patch`

Execution-oriented JSON payload.

Use it to describe the exact operation the application should validate and execute after approval.

Typical uses:

- insert a row into a join table
- delete a row from a join table
- update a specific approved record using known target keys and values

`change_patch` is not intended to replace validation. The application should still confirm that:

- the target resource is still valid
- the approved change does not violate unique constraints
- the patch is compatible with the request `resource_type` and `action_type`

## Recommended Rules

- Generate `changed_fields` and `change_patch` when the approval request is created.
- Treat `before_state` and `after_state` as the canonical audit snapshots.
- Treat `changed_fields` as a convenience payload for review and presentation.
- Treat `change_patch` as a convenience payload for execution.
- Keep the payload shape stable per `resource_type` so the application can render and process requests consistently.

## Payload Patterns

### Entity Update Pattern

Use this pattern for resources such as organizations, users, or user groups.

- `before_state` contains the approved row values
- `after_state` contains the proposed row values
- `changed_fields` lists only the fields that changed
- `change_patch` identifies the row and the values to update

Example `changed_fields` for a user update:

```json
{
  "display_name": {
    "before": "Jane Doe",
    "after": "Jane A. Doe"
  },
  "email": {
    "before": "jane.old@example.com",
    "after": "jane.new@example.com"
  }
}
```

### Relationship Change Pattern

Use this pattern for resources such as:

- `user_group_permissions`
- `user_group_memberships`

These changes are better understood as adding or removing a relationship than as updating a conventional entity row.

Recommended shape:

- `before_state` is `null` for `ADD` and populated for `REMOVE`
- `after_state` is populated for `ADD` and `null` for `REMOVE`
- `changed_fields` describes the relationship in business terms
- `change_patch` describes the database operation in execution terms

## Example: Add Permission To User Group

Goal:

- add permission `USER_APPROVE` to user group `OPS_REVIEWERS`

Assumed resolved IDs:

- `user_group_id = 12`
- `permission_id = 45`

Request metadata:

- `resource_type = 'GROUP_PERMISSION'`
- `resource_key = 'GROUP:12:PERMISSION:USER_APPROVE'`
- `action_type = 'ADD'`

### `before_state`

For an add operation, the relationship does not exist yet.

```json
null
```

### `after_state`

```json
{
  "user_group_id": 12,
  "permission_id": 45,
  "group_code": "OPS_REVIEWERS",
  "group_name": "Operations Reviewers",
  "permission_code": "USER_APPROVE",
  "permission_name": "Approve User Changes"
}
```

### `changed_fields`

```json
{
  "relationship": {
    "type": "GROUP_PERMISSION",
    "operation": "ADD"
  },
  "group": {
    "before": null,
    "after": {
      "id": 12,
      "code": "OPS_REVIEWERS",
      "name": "Operations Reviewers"
    }
  },
  "permission": {
    "before": null,
    "after": {
      "id": 45,
      "code": "USER_APPROVE",
      "name": "Approve User Changes"
    }
  }
}
```

This payload is meant for review screens. A UI can render it directly as:

- Operation: add permission
- Group: OPS_REVIEWERS
- Permission: USER_APPROVE

### `change_patch`

```json
{
  "op": "ADD_RELATION",
  "table": "user_group_permissions",
  "values": {
    "user_group_id": 12,
    "permission_id": 45
  }
}
```

This payload is meant for approval execution. After approval, the application can validate the request and execute the equivalent business operation:

```sql
INSERT INTO user_group_permissions (
  user_group_id,
  permission_id
)
VALUES (
  12,
  45
);
```

## Approval Execution Flow

For a `GROUP_PERMISSION` add request:

1. Resolve the request from `approval_requests`.
2. Confirm the request is still `PENDING`.
3. Validate the `change_patch` payload for the expected `resource_type` and `action_type`.
4. Confirm the target relationship does not already exist.
5. Insert the approved row into `user_group_permissions`.
6. Mark the request as approved.
7. Insert a row into `approval_request_actions`.
8. Insert a row into `audit_events`.
9. Remove the corresponding row from `approval_locks`.

## Why Keep Both Payloads

Keeping both payloads avoids two common problems:

- review consumers each implementing their own diff logic
- approval handlers inferring execution behavior from arbitrary snapshots

The intended separation is:

- `before_state` and `after_state` are authoritative snapshots
- `changed_fields` is optimized for human review
- `change_patch` is optimized for deterministic execution