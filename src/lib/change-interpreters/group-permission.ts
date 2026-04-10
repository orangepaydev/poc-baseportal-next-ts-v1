import type { ChangeInterpreter, InterpretedFieldChange } from './types';

type GroupSummary = {
  group_code: string;
  group_name: string;
};

type PermissionSummary = {
  permission_code: string;
  action_code: string;
  description: string | null;
};

type GroupPermissionChangedFields = {
  user_group?: {
    before: GroupSummary | null;
    after: GroupSummary | null;
  };
  added_permissions?: {
    before: null;
    after: PermissionSummary[];
  };
  removed_permissions?: {
    before: PermissionSummary[];
    after: null;
  };
};

function formatGroup(value: GroupSummary | null | undefined) {
  if (!value) {
    return null;
  }

  return `${value.group_name} (${value.group_code})`;
}

function formatPermissions(value: PermissionSummary[] | null | undefined) {
  if (!value || value.length === 0) {
    return null;
  }

  return value
    .map((permission) => {
      const description = permission.description?.trim();

      return description
        ? `${permission.permission_code} (${permission.action_code}) - ${description}`
        : `${permission.permission_code} (${permission.action_code})`;
    })
    .join('; ');
}

export const groupPermissionInterpreter: ChangeInterpreter = {
  interpret(_actionType, changedFields) {
    const fields: InterpretedFieldChange[] = [];
    const parsed =
      changedFields && typeof changedFields === 'object'
        ? (changedFields as GroupPermissionChangedFields)
        : null;

    if (parsed?.user_group) {
      fields.push({
        label: 'User Group',
        before: formatGroup(parsed.user_group.before),
        after: formatGroup(parsed.user_group.after),
      });
    }

    if (parsed?.added_permissions) {
      fields.push({
        label: 'Added Permissions',
        before: null,
        after: formatPermissions(parsed.added_permissions.after),
      });
    }

    if (parsed?.removed_permissions) {
      fields.push({
        label: 'Removed Permissions',
        before: formatPermissions(parsed.removed_permissions.before),
        after: null,
      });
    }

    return {
      resourceTypeLabel: 'User Group Permission',
      fields,
    };
  },
};