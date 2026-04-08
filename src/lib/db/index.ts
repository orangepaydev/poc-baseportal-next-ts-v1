import 'server-only';

import { loadDatabaseConfig } from '@/lib/db/config';
import { createMariaDbAdapter } from '@/lib/db/adapters/mariadb';
import { createPostgresAdapter } from '@/lib/db/adapters/postgresql';
import type {
  DatabaseAdapter,
  DatabaseConnectionConfig,
  DatabaseQueryOptions,
  DatabaseRecord,
  DatabaseRuntimeConfig,
  QueryParameters,
} from '@/lib/db/types';

type GlobalDatabaseState = typeof globalThis & {
  __databaseManager?: DatabaseManager;
  __databaseStartedConnections?: Set<string>;
};

function logDatabaseStarted(config: DatabaseConnectionConfig) {
  const globalDatabaseState = globalThis as GlobalDatabaseState;

  if (!globalDatabaseState.__databaseStartedConnections) {
    globalDatabaseState.__databaseStartedConnections = new Set<string>();
  }

  const logKey = `${config.name}:${config.type}`;

  if (globalDatabaseState.__databaseStartedConnections.has(logKey)) {
    return;
  }

  globalDatabaseState.__databaseStartedConnections.add(logKey);

  console.info(
    `[db] Database started. connection=${config.name}; type=${config.type}`
  );
}

class DatabaseConnection {
  private readonly adapter: DatabaseAdapter;

  constructor(private readonly config: DatabaseConnectionConfig) {
    this.adapter = createAdapter(config);
  }

  query<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params: QueryParameters = []
  ) {
    return this.adapter.query<T>(sql, params);
  }

  async queryOne<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params: QueryParameters = []
  ) {
    const rows = await this.query<T>(sql, params);

    if (rows.length > 1) {
      throw new Error(
        `Expected a single row from connection "${this.config.name}", but received ${rows.length} rows.`
      );
    }

    return rows[0] ?? null;
  }

  execute(sql: string, params: QueryParameters = []) {
    return this.adapter.execute(sql, params);
  }

  close() {
    return this.adapter.close();
  }
}

export class DatabaseManager {
  private readonly connections = new Map<string, DatabaseConnection>();

  constructor(private readonly runtimeConfig: DatabaseRuntimeConfig) {}

  getConnection(connectionName = this.runtimeConfig.defaultConnectionName) {
    const existingConnection = this.connections.get(connectionName);

    if (existingConnection) {
      return existingConnection;
    }

    const connectionConfig = this.runtimeConfig.connections[connectionName];

    if (!connectionConfig) {
      const configuredNames = Object.keys(this.runtimeConfig.connections);

      throw new Error(
        `Database connection "${connectionName}" is not configured. Available connections: ${configuredNames.join(', ') || 'none'}.`
      );
    }

    const connection = new DatabaseConnection(connectionConfig);
    this.connections.set(connectionName, connection);
    logDatabaseStarted(connectionConfig);

    return connection;
  }

  query<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params: QueryParameters = [],
    options?: DatabaseQueryOptions
  ) {
    return this.getConnection(options?.connectionName).query<T>(sql, params);
  }

  queryOne<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params: QueryParameters = [],
    options?: DatabaseQueryOptions
  ) {
    return this.getConnection(options?.connectionName).queryOne<T>(sql, params);
  }

  execute(
    sql: string,
    params: QueryParameters = [],
    options?: DatabaseQueryOptions
  ) {
    return this.getConnection(options?.connectionName).execute(sql, params);
  }

  async closeAll() {
    await Promise.all(
      Array.from(this.connections.values(), (connection) => connection.close())
    );

    this.connections.clear();
  }
}

function createAdapter(config: DatabaseConnectionConfig) {
  switch (config.type) {
    case 'mariadb':
      return createMariaDbAdapter(config);
    case 'postgresql':
      return createPostgresAdapter(config);
    default:
      throw new Error(`Unsupported database type: ${config.type}`);
  }
}

export function createDatabaseManager(runtimeConfig = loadDatabaseConfig()) {
  if (Object.keys(runtimeConfig.connections).length === 0) {
    throw new Error(
      'No database connections are configured. Populate .env using .env.example before using the database library.'
    );
  }

  return new DatabaseManager(runtimeConfig);
}

export function getDatabaseManager() {
  const globalDatabaseState = globalThis as GlobalDatabaseState;

  if (!globalDatabaseState.__databaseManager) {
    globalDatabaseState.__databaseManager = createDatabaseManager();
  }

  return globalDatabaseState.__databaseManager;
}

export async function query<T extends DatabaseRecord = DatabaseRecord>(
  sql: string,
  params: QueryParameters = [],
  options?: DatabaseQueryOptions
) {
  return getDatabaseManager().query<T>(sql, params, options);
}

export async function queryOne<T extends DatabaseRecord = DatabaseRecord>(
  sql: string,
  params: QueryParameters = [],
  options?: DatabaseQueryOptions
) {
  return getDatabaseManager().queryOne<T>(sql, params, options);
}

export async function execute(
  sql: string,
  params: QueryParameters = [],
  options?: DatabaseQueryOptions
) {
  return getDatabaseManager().execute(sql, params, options);
}

export const db = {
  getConnection(connectionName?: string) {
    return getDatabaseManager().getConnection(connectionName);
  },
  query,
  queryOne,
  execute,
  async closeAll() {
    return getDatabaseManager().closeAll();
  },
};

export type {
  DatabaseConnectionConfig,
  DatabaseExecuteResult,
  DatabaseQueryOptions,
  DatabaseRecord,
  DatabaseRuntimeConfig,
  QueryParameter,
  QueryParameters,
} from '@/lib/db/types';
