# Permission, Approval, and Audit Requirements

## Purpose

This document restates the original requirements in a cleaner, implementation-ready form for the authorization, maker-checker, and audit features.

## Core Domain

- The platform is multi-tenant.
- Each tenant is an organization.
- Users belong to exactly one organization.
- Login requires three fields:
  - organization
  - user
  - password

## Authentication Requirements

- Users authenticate with the combination of organization code, username, and password.
- The system must resolve the organization first, then resolve the user within that organization.
- Passwords stored in the database are SHA-based hashes.
- For this design, the stored password format is `SHA-256` represented as a 64-character hexadecimal string.

## Authorization Requirements

- Users do not receive permissions directly.
- Users can belong to multiple user groups.
- User groups receive one or more permissions.
- Effective user access is the union of permissions granted through all groups assigned to the user.

## Permission Model

The permission model must support at least the following access patterns:

- menu item access
- read access
- write access
- approver access

Permissions must be data-driven so they can be defined for multiple secured resources, including but not limited to:

- organizations
- users
- user groups
- group permission assignments
- group membership assignments
- menu items
- approval queues
- audit log views

## Maker-Checker Requirements

The system must support approval before the following changes become active:

- creating an organization
- creating a user
- adding a permission to a user group
- adding a user to a user group

The schema also supports the same approval workflow for:

- updating an organization
- updating a user
- removing a permission from a user group
- removing a user from a user group
- deleting approved records when the business flow allows it

## Approval Workflow Rules

- A requested change is created as a pending approval request.
- Pending changes do not immediately modify the live approved tables.
- Each pending request stores enough information for the approver to see the proposed action:
  - add
  - remove
  - update
- Each pending request stores before and after snapshots so the approver can review exactly what changed.
- When a pending change exists for a resource, that resource is locked from receiving another pending change.
- The lock is released only when the request is approved, rejected, or cancelled.

## Audit Requirements

- All submitted changes must be auditable.
- All approval decisions must be auditable.
- Audit data must support at least:
  - who performed the action
  - when it happened
  - which organization it belongs to
  - which resource was affected
  - which approval request it belongs to, if any
  - the change payload or workflow context needed for later review

## Recommended Application Rules

These rules are not explicitly stated in the original requirement, but the schema supports them and they are recommended:

- the approver should be different from the maker
- rejected requests should keep their history
- cancelled requests should keep their history
- only approved records should appear in the live business tables
- login attempts can also be written to the audit trail

## UI Implications

The follow-up UI should expect at least these workflows:

- login by organization, username, and password
- maintain organizations
- maintain users
- maintain user groups
- assign permissions to groups
- assign users to groups
- review pending approval requests
- review audit trail entries