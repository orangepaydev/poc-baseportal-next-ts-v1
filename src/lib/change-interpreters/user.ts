import type { ChangeInterpreter, InterpretedFieldChange } from './types';

type UserSnapshot = {
  id?: number;
  username: string;
  display_name: string;
  email: string | null;
  user_type: string;
  status: string;
};

type UserChangedFields = Record<
  string,
  { before: unknown; after: unknown }
>;

const FIELD_LABELS: Record<string, string> = {
  username: 'Username',
  display_name: 'Display Name',
  email: 'Email',
  user_type: 'User Type',
  status: 'Status',
  password_reset: 'Password Reset',
};

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function interpretChangedFields(
  changedFields: UserChangedFields
): InterpretedFieldChange[] {
  return Object.entries(changedFields).map(([field, change]) => ({
    label: FIELD_LABELS[field] ?? field,
    before: displayValue(change.before),
    after: displayValue(change.after),
  }));
}

function interpretFromSnapshots(
  actionType: string,
  beforeState: UserSnapshot | null,
  afterState: UserSnapshot | null
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

export const userInterpreter: ChangeInterpreter = {
  interpret(actionType, changedFields, beforeState, afterState) {
    let fields: InterpretedFieldChange[];

    if (
      changedFields &&
      typeof changedFields === 'object' &&
      Object.keys(changedFields).length > 0
    ) {
      fields = interpretChangedFields(changedFields as UserChangedFields);
    } else {
      fields = interpretFromSnapshots(
        actionType,
        beforeState as UserSnapshot | null,
        afterState as UserSnapshot | null
      );
    }

    return {
      resourceTypeLabel: 'User',
      fields,
    };
  },
};
