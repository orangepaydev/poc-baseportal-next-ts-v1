import type { ChangeInterpreter, InterpretedFieldChange } from './types';

type SystemPropertyChangedFields = Record<string, { before: unknown; after: unknown }>;

const FIELD_LABELS: Record<string, string> = {
  property_code: 'System Property',
  description: 'Description',
  property_item_code: 'System Property Value Code',
  property_value: 'System Property Value',
};

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  return String(value);
}

function interpretChangedFields(
  changedFields: SystemPropertyChangedFields
): InterpretedFieldChange[] {
  return Object.entries(changedFields).map(([field, change]) => ({
    label: FIELD_LABELS[field] ?? field,
    before: displayValue(change.before),
    after: displayValue(change.after),
  }));
}

export const systemPropertyInterpreter: ChangeInterpreter = {
  interpret(_actionType, changedFields) {
    const fields =
      changedFields &&
      typeof changedFields === 'object' &&
      Object.keys(changedFields).length > 0
        ? interpretChangedFields(changedFields as SystemPropertyChangedFields)
        : [];

    return {
      resourceTypeLabel: 'System Property',
      fields,
    };
  },
};