import type { ChangeInterpreter, InterpretedFieldChange } from './types';

type UserGroupSnapshot = {
  id?: number;
  group_code: string;
  group_name: string;
  description: string | null;
  status: string;
};

type UserGroupChangedFields = Record<
  string,
  { before: unknown; after: unknown }
>;

const FIELD_LABELS: Record<string, string> = {
  group_code: 'Group Code',
  group_name: 'Group Name',
  description: 'Description',
  status: 'Status',
};

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function interpretChangedFields(
  changedFields: UserGroupChangedFields
): InterpretedFieldChange[] {
  return Object.entries(changedFields).map(([field, change]) => ({
    label: FIELD_LABELS[field] ?? field,
    before: displayValue(change.before),
    after: displayValue(change.after),
  }));
}

function interpretFromSnapshots(
  actionType: string,
  beforeState: UserGroupSnapshot | null,
  afterState: UserGroupSnapshot | null
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

export const userGroupInterpreter: ChangeInterpreter = {
  interpret(actionType, changedFields, beforeState, afterState) {
    let fields: InterpretedFieldChange[];

    if (
      changedFields &&
      typeof changedFields === 'object' &&
      Object.keys(changedFields).length > 0
    ) {
      fields = interpretChangedFields(
        changedFields as UserGroupChangedFields
      );
    } else {
      fields = interpretFromSnapshots(
        actionType,
        beforeState as UserGroupSnapshot | null,
        afterState as UserGroupSnapshot | null
      );
    }

    return {
      resourceTypeLabel: 'User Group',
      fields,
    };
  },
};
