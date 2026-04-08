import 'server-only';

import { Pool, type PoolConfig } from 'pg';

import { preparePostgresStatement } from '@/lib/db/placeholders';
import type {
  DatabaseAdapter,
  DatabaseConnectionConfig,
  DatabaseExecuteResult,
  DatabaseRecord,
  QueryParameters,
} from '@/lib/db/types';

export class PostgresAdapter implements DatabaseAdapter {
  private readonly pool: Pool;

  constructor(config: DatabaseConnectionConfig) {
    const poolConfig: PoolConfig = {
      max: config.connectionLimit,
      idleTimeoutMillis: config.idleTimeoutMs,
      connectionTimeoutMillis: config.connectionTimeoutMs,
    };

    if (config.url) {
      poolConfig.connectionString = config.url;
    } else {
      poolConfig.host = config.host;
      poolConfig.port = config.port;
      poolConfig.database = config.database;
      poolConfig.user = config.user;
      poolConfig.password = config.password;
    }

    if (config.ssl !== undefined) {
      poolConfig.ssl = config.ssl;
    }

    this.pool = new Pool(poolConfig);
  }

  async query<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params: QueryParameters = []
  ) {
    const statement = preparePostgresStatement(sql, params);
    const result = await this.pool.query<T>(statement.sql, statement.params);

    return result.rows;
  }

  async execute(sql: string, params: QueryParameters = []) {
    const statement = preparePostgresStatement(sql, params);
    const result = await this.pool.query(statement.sql, statement.params);

    return {
      affectedRows: result.rowCount ?? 0,
      command: result.command,
      rows: result.rows as DatabaseRecord[],
    } satisfies DatabaseExecuteResult;
  }

  async close() {
    await this.pool.end();
  }
}

export function createPostgresAdapter(config: DatabaseConnectionConfig) {
  return new PostgresAdapter(config);
}
