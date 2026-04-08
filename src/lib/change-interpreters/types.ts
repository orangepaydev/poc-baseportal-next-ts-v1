export type InterpretedFieldChange = {
  label: string;
  before: string | null;
  after: string | null;
};

export type InterpretedChange = {
  resourceTypeLabel: string;
  fields: InterpretedFieldChange[];
};

export type ChangeInterpreter = {
  interpret(
    actionType: string,
    changedFields: unknown,
    beforeState: unknown,
    afterState: unknown
  ): InterpretedChange;
};
