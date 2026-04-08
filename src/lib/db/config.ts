import 'server-only';

import type {
  DatabaseConnectionConfig,
  DatabaseRuntimeConfig,
  DatabaseType,
} from '@/lib/db/types';

const DEFAULT_CONNECTION_NAME = 'default';
const SUPPORTED_DATABASE_TYPES: DatabaseType[] = ['mariadb', 'postgresql'];

type GlobalDatabaseConfigLogState = typeof globalThis & {
  __databaseConfigurationLogKey?: string;
};

export function loadDatabaseConfig(
  env: NodeJS.ProcessEnv = process.env
): DatabaseRuntimeConfig {
  const connectionNames = resolveConnectionNames(env);

  if (connectionNames.length === 0) {
    return {
      defaultConnectionName: DEFAULT_CONNECTION_NAME,
      connections: {},
    };
  }

  const connections = Object.fromEntries(
    connectionNames.map((connectionName) => [
      connectionName,
      readConnectionConfig(connectionName, env),
    ])
  );

  const defaultConnectionName =
    env.DB_DEFAULT_CONNECTION?.trim() ||
    connectionNames[0] ||
    DEFAULT_CONNECTION_NAME;

  if (!connections[defaultConnectionName]) {
    throw new Error(
      `DB_DEFAULT_CONNECTION points to "${defaultConnectionName}", but that connection is not configured.`
    );
  }

  logDatabaseConfigured({
    defaultConnectionName,
    connections,
  });

  return {
    defaultConnectionName,
    connections,
  };
}

function logDatabaseConfigured(runtimeConfig: DatabaseRuntimeConfig) {
  const globalDatabaseState = globalThis as GlobalDatabaseConfigLogState;
  const connectionSummary = Object.values(runtimeConfig.connections)
    .map((connection) => `${connection.name}:${connection.type}`)
    .sort()
    .join(', ');
  const logKey = `${runtimeConfig.defaultConnectionName}|${connectionSummary}`;

  if (globalDatabaseState.__databaseConfigurationLogKey === logKey) {
    return;
  }

  globalDatabaseState.__databaseConfigurationLogKey = logKey;

  console.info(
    `[db] Database configured. default=${runtimeConfig.defaultConnectionName}; connections=${connectionSummary}`
  );
}

function resolveConnectionNames(env: NodeJS.ProcessEnv) {
  const names = parseCommaSeparatedList(env.DB_CONNECTION_NAMES);

  if (names.length > 0) {
    return names;
  }

  if (hasConfiguredConnection(DEFAULT_CONNECTION_NAME, env)) {
    return [DEFAULT_CONNECTION_NAME];
  }

  return [];
}

function hasConfiguredConnection(
  connectionName: string,
  env: NodeJS.ProcessEnv
) {
  return [
    readConnectionSetting(connectionName, env, 'TYPE'),
    readConnectionSetting(connectionName, env, 'URL'),
    readConnectionSetting(connectionName, env, 'HOST'),
  ].some((value) => value !== undefined);
}

function readConnectionConfig(
  connectionName: string,
  env: NodeJS.ProcessEnv
): DatabaseConnectionConfig {
  const rawType = readRequiredConnectionSetting(connectionName, env, 'TYPE');
  const type = parseDatabaseType(rawType, connectionName);
  const url = readConnectionSetting(connectionName, env, 'URL');

  const config: DatabaseConnectionConfig = {
    name: connectionName,
    type,
    url,
    ssl: parseOptionalBoolean(
      readConnectionSetting(connectionName, env, 'SSL'),
      connectionName,
      'SSL'
    ),
    connectionLimit: parseOptionalNumber(
      readConnectionSetting(connectionName, env, 'CONNECTION_LIMIT'),
      connectionName,
      'CONNECTION_LIMIT'
    ),
    idleTimeoutMs: parseOptionalNumber(
      readConnectionSetting(connectionName, env, 'IDLE_TIMEOUT_MS'),
      connectionName,
      'IDLE_TIMEOUT_MS'
    ),
    connectionTimeoutMs: parseOptionalNumber(
      readConnectionSetting(connectionName, env, 'CONNECTION_TIMEOUT_MS'),
      connectionName,
      'CONNECTION_TIMEOUT_MS'
    ),
  };

  if (url) {
    return config;
  }

  config.host = readRequiredConnectionSetting(connectionName, env, 'HOST');
  config.port = parseOptionalNumber(
    readConnectionSetting(connectionName, env, 'PORT'),
    connectionName,
    'PORT'
  );
  config.database = readRequiredConnectionSetting(
    connectionName,
    env,
    'DATABASE'
  );
  config.user = readRequiredConnectionSetting(connectionName, env, 'USER');
  config.password = readRequiredConnectionSetting(
    connectionName,
    env,
    'PASSWORD'
  );

  return config;
}

function parseDatabaseType(
  value: string,
  connectionName: string
): DatabaseType {
  if (SUPPORTED_DATABASE_TYPES.includes(value as DatabaseType)) {
    return value as DatabaseType;
  }

  throw new Error(
    `Unsupported database type "${value}" for connection "${connectionName}". Supported types: ${SUPPORTED_DATABASE_TYPES.join(', ')}.`
  );
}

function readRequiredConnectionSetting(
  connectionName: string,
  env: NodeJS.ProcessEnv,
  fieldName: string
) {
  const value = readConnectionSetting(connectionName, env, fieldName);

  if (!value) {
    throw new Error(
      `Missing database setting ${resolveConnectionKeys(connectionName, fieldName)[0]}.`
    );
  }

  return value;
}

function readConnectionSetting(
  connectionName: string,
  env: NodeJS.ProcessEnv,
  fieldName: string
) {
  const keys = resolveConnectionKeys(connectionName, fieldName);

  for (const key of keys) {
    const value = env[key]?.trim();

    if (value) {
      return value;
    }
  }

  return undefined;
}

function resolveConnectionKeys(connectionName: string, fieldName: string) {
  const normalizedConnectionName = normalizeConnectionName(connectionName);

  if (connectionName === DEFAULT_CONNECTION_NAME) {
    return [`DB_DEFAULT_${fieldName}`, `DB_${fieldName}`];
  }

  return [`DB_${normalizedConnectionName}_${fieldName}`];
}

function normalizeConnectionName(connectionName: string) {
  return connectionName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .toUpperCase();
}

function parseCommaSeparatedList(value?: string) {
  return Array.from(
    new Set(
      value
        ?.split(',')
        .map((entry) => entry.trim())
        .filter(Boolean) ?? []
    )
  );
}

function parseOptionalBoolean(
  value: string | undefined,
  connectionName: string,
  fieldName: string
) {
  if (value === undefined) {
    return undefined;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  throw new Error(
    `Invalid boolean value "${value}" for connection "${connectionName}" field "${fieldName}".`
  );
}

function parseOptionalNumber(
  value: string | undefined,
  connectionName: string,
  fieldName: string
) {
  if (value === undefined) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (Number.isFinite(parsedValue)) {
    return parsedValue;
  }

  throw new Error(
    `Invalid numeric value "${value}" for connection "${connectionName}" field "${fieldName}".`
  );
}
