import type { ChangeInterpreter, InterpretedFieldChange } from './types';

type OrganizationSnapshot = {
  id?: number;
  organization_code: string;
  organization_name: string;
  status: string;
  admin_user_1_username?: string;
  admin_user_1_email?: string;
  admin_user_2_username?: string;
  admin_user_2_email?: string;
};

type OrganizationChangedFields = Record<
  string,
  { before: unknown; after: unknown }
>;

const FIELD_LABELS: Record<string, string> = {
  organization_code: 'Organization Code',
  organization_name: 'Organization Name',
  status: 'Status',
  admin_user_1_username: 'Admin User 1 Username',
  admin_user_1_email: 'Admin User 1 Email',
  admin_user_2_username: 'Admin User 2 Username',
  admin_user_2_email: 'Admin User 2 Email',
};

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function interpretChangedFields(
  changedFields: OrganizationChangedFields
): InterpretedFieldChange[] {
  return Object.entries(changedFields).map(([field, change]) => ({
    label: FIELD_LABELS[field] ?? field,
    before: displayValue(change.before),
    after: displayValue(change.after),
  }));
}

function interpretFromSnapshots(
  actionType: string,
  beforeState: OrganizationSnapshot | null,
  afterState: OrganizationSnapshot | null
): InterpretedFieldChange[] {
  if (actionType === 'CREATE' && afterState) {
    return Object.entries(FIELD_LABELS).map(([field, label]) => ({
      label,
      before: null,
      after: displayValue((afterState as Record<string, unknown>)[field]),
    }));
  }

  if (actionType === 'DELETE' && beforeState) {
    return Object.entries(FIELD_LABELS).map(([field, label]) => ({
      label,
      before: displayValue((beforeState as Record<string, unknown>)[field]),
      after: null,
    }));
  }

  return [];
}

export const organizationInterpreter: ChangeInterpreter = {
  interpret(actionType, changedFields, beforeState, afterState) {
    let fields: InterpretedFieldChange[];

    if (
      changedFields &&
      typeof changedFields === 'object' &&
      Object.keys(changedFields).length > 0
    ) {
      fields = interpretChangedFields(
        changedFields as OrganizationChangedFields
      );
    } else {
      fields = interpretFromSnapshots(
        actionType,
        beforeState as OrganizationSnapshot | null,
        afterState as OrganizationSnapshot | null
      );
    }

    return {
      resourceTypeLabel: 'Organization',
      fields,
    };
  },
};
