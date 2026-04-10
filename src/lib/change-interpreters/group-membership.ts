import type { ChangeInterpreter, InterpretedFieldChange } from './types';

type GroupSummary = {
  group_code: string;
  group_name: string;
};

type UserSummary = {
  username: string;
  display_name: string;
  email: string | null;
};

type GroupMembershipChangedFields = {
  user_group?: {
    before: GroupSummary | null;
    after: GroupSummary | null;
  };
  added_users?: {
    before: null;
    after: UserSummary[];
  };
  removed_users?: {
    before: UserSummary[];
    after: null;
  };
};

function formatGroup(value: GroupSummary | null | undefined) {
  if (!value) {
    return null;
  }

  return `${value.group_name} (${value.group_code})`;
}

function formatUsers(value: UserSummary[] | null | undefined) {
  if (!value || value.length === 0) {
    return null;
  }

  return value
    .map((user) => {
      const email = user.email?.trim();

      return email
        ? `${user.display_name} (${user.username}) - ${email}`
        : `${user.display_name} (${user.username})`;
    })
    .join('; ');
}

export const groupMembershipInterpreter: ChangeInterpreter = {
  interpret(_actionType, changedFields) {
    const fields: InterpretedFieldChange[] = [];
    const parsed =
      changedFields && typeof changedFields === 'object'
        ? (changedFields as GroupMembershipChangedFields)
        : null;

    if (parsed?.user_group) {
      fields.push({
        label: 'User Group',
        before: formatGroup(parsed.user_group.before),
        after: formatGroup(parsed.user_group.after),
      });
    }

    if (parsed?.added_users) {
      fields.push({
        label: 'Added Users',
        before: null,
        after: formatUsers(parsed.added_users.after),
      });
    }

    if (parsed?.removed_users) {
      fields.push({
        label: 'Removed Users',
        before: formatUsers(parsed.removed_users.before),
        after: null,
      });
    }

    return {
      resourceTypeLabel: 'User Group Membership',
      fields,
    };
  },
};