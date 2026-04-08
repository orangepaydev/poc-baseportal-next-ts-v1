import type { ChangeInterpreter, InterpretedChange } from './types';
import { userGroupInterpreter } from './user-group';

export type { InterpretedChange, InterpretedFieldChange } from './types';

const interpreters: Record<string, ChangeInterpreter> = {
  USER_GROUP: userGroupInterpreter,
};

export function interpretChange(
  resourceType: string,
  actionType: string,
  changedFields: unknown,
  beforeState: unknown,
  afterState: unknown
): InterpretedChange | null {
  const interpreter = interpreters[resourceType];

  if (!interpreter) {
    return null;
  }

  return interpreter.interpret(actionType, changedFields, beforeState, afterState);
}
