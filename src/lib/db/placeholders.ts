import type { QueryParameters } from '@/lib/db/types';

type SqlState =
  | 'default'
  | 'single-quote'
  | 'double-quote'
  | 'line-comment'
  | 'block-comment';

export function convertQuestionMarksToPostgresPlaceholders(sql: string) {
  let state: SqlState = 'default';
  let placeholderIndex = 1;
  let placeholderCount = 0;
  let convertedSql = '';

  for (let index = 0; index < sql.length; index += 1) {
    const currentCharacter = sql[index];
    const nextCharacter = sql[index + 1];

    if (state === 'default') {
      if (currentCharacter === "'") {
        state = 'single-quote';
        convertedSql += currentCharacter;
        continue;
      }

      if (currentCharacter === '"') {
        state = 'double-quote';
        convertedSql += currentCharacter;
        continue;
      }

      if (currentCharacter === '-' && nextCharacter === '-') {
        state = 'line-comment';
        convertedSql += '--';
        index += 1;
        continue;
      }

      if (currentCharacter === '/' && nextCharacter === '*') {
        state = 'block-comment';
        convertedSql += '/*';
        index += 1;
        continue;
      }

      if (currentCharacter === '?') {
        convertedSql += `$${placeholderIndex}`;
        placeholderIndex += 1;
        placeholderCount += 1;
        continue;
      }

      convertedSql += currentCharacter;
      continue;
    }

    if (state === 'single-quote') {
      if (currentCharacter === "'" && nextCharacter === "'") {
        convertedSql += "''";
        index += 1;
        continue;
      }

      convertedSql += currentCharacter;

      if (currentCharacter === "'") {
        state = 'default';
      }

      continue;
    }

    if (state === 'double-quote') {
      if (currentCharacter === '"' && nextCharacter === '"') {
        convertedSql += '""';
        index += 1;
        continue;
      }

      convertedSql += currentCharacter;

      if (currentCharacter === '"') {
        state = 'default';
      }

      continue;
    }

    if (state === 'line-comment') {
      convertedSql += currentCharacter;

      if (currentCharacter === '\n') {
        state = 'default';
      }

      continue;
    }

    convertedSql += currentCharacter;

    if (currentCharacter === '*' && nextCharacter === '/') {
      convertedSql += '/';
      index += 1;
      state = 'default';
    }
  }

  return {
    sql: convertedSql,
    placeholderCount,
  };
}

export function preparePostgresStatement(
  sql: string,
  params: QueryParameters = []
) {
  const prepared = convertQuestionMarksToPostgresPlaceholders(sql);

  if (prepared.placeholderCount !== params.length) {
    throw new Error(
      `PostgreSQL placeholder count mismatch. Expected ${prepared.placeholderCount} parameters but received ${params.length}.`
    );
  }

  return {
    sql: prepared.sql,
    params: Array.from(params),
  };
}
