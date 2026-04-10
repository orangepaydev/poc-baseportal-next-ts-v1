import type { ChangeInterpreter, InterpretedFieldChange } from './types';

type SystemCodeValueSnapshot = {
  system_code_value: string;
  description: string;
  status: string;
  sort_order: number;
};

type SystemCodeSnapshot = {
  id?: number;
  system_code: string;
  description: string;
  status: string;
  values?: SystemCodeValueSnapshot[];
};

type SystemCodeChangedFields = Record<string, { before: unknown; after: unknown }>;

const FIELD_LABELS: Record<string, string> = {
  system_code: 'System Code',
  description: 'Description',
  status: 'Status',
  added_values: 'Added Values',
  removed_values: 'Removed Values',
};

function formatSystemCodeValue(value: SystemCodeValueSnapshot) {
  return `${value.system_code_value} (${value.description}, ${value.status}, sort ${value.sort_order})`;
}

function displayValue(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return 'None';
    }

    return value
      .map((entry) => {
        if (
          entry &&
          typeof entry === 'object' &&
          'system_code_value' in entry &&
          'description' in entry &&
          'status' in entry &&
          'sort_order' in entry
        ) {
          return formatSystemCodeValue(entry as SystemCodeValueSnapshot);
        }

        return String(entry);
      })
      .join(' | ');
  }

  return String(value);
}

function interpretChangedFields(
  changedFields: SystemCodeChangedFields
): InterpretedFieldChange[] {
  return Object.entries(changedFields).map(([field, change]) => ({
    label: FIELD_LABELS[field] ?? field,
    before: displayValue(change.before),
    after: displayValue(change.after),
  }));
}

function interpretFromSnapshots(
  actionType: string,
  beforeState: SystemCodeSnapshot | null,
  afterState: SystemCodeSnapshot | null
): InterpretedFieldChange[] {
  if (actionType === 'CREATE' && afterState) {
    return [
      {
        label: 'System Code',
        before: null,
        after: displayValue(afterState.system_code),
      },
      {
        label: 'Description',
        before: null,
        after: displayValue(afterState.description),
      },
      {
        label: 'Status',
        before: null,
        after: displayValue(afterState.status),
      },
    ];
  }

  if (actionType === 'DELETE' && beforeState) {
    return [
      {
        label: 'System Code',
        before: displayValue(beforeState.system_code),
        after: null,
      },
      {
        label: 'Description',
        before: displayValue(beforeState.description),
        after: null,
      },
      {
        label: 'Status',
        before: displayValue(beforeState.status),
        after: null,
      },
    ];
  }

  return [];
}

export const systemCodeInterpreter: ChangeInterpreter = {
  interpret(actionType, changedFields, beforeState, afterState) {
    const fields =
      changedFields &&
      typeof changedFields === 'object' &&
      Object.keys(changedFields).length > 0
        ? interpretChangedFields(changedFields as SystemCodeChangedFields)
        : interpretFromSnapshots(
            actionType,
            beforeState as SystemCodeSnapshot | null,
            afterState as SystemCodeSnapshot | null
          );

    return {
      resourceTypeLabel: 'System Code',
      fields,
    };
  },
};