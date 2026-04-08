import 'server-only';

import { createPool, type Pool, type PoolConfig } from 'mariadb';

import type {
  DatabaseAdapter,
  DatabaseConnectionConfig,
  DatabaseExecuteResult,
  DatabaseRecord,
  QueryParameters,
} from '@/lib/db/types';

type MariaDbMutationResult = {
  affectedRows?: number;
  insertId?: number | bigint | null;
};

export class MariaDbAdapter implements DatabaseAdapter {
  private readonly pool: Pool;

  constructor(config: DatabaseConnectionConfig) {
    if (config.url) {
      this.pool = createPool(config.url);
    } else {
      const poolConfig: PoolConfig = {
        connectionLimit: config.connectionLimit,
        idleTimeout: config.idleTimeoutMs,
        connectTimeout: config.connectionTimeoutMs,
      };

      poolConfig.host = config.host;
      poolConfig.port = config.port;
      poolConfig.database = config.database;
      poolConfig.user = config.user;
      poolConfig.password = config.password;
      poolConfig.ssl = config.ssl;

      this.pool = createPool(poolConfig);
    }
  }

  async query<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params: QueryParameters = []
  ) {
    const result = await this.pool.query(sql, Array.from(params));

    if (!Array.isArray(result)) {
      return [] as T[];
    }

    return result as T[];
  }

  async execute(sql: string, params: QueryParameters = []) {
    const result = await this.pool.query(sql, Array.from(params));

    if (Array.isArray(result)) {
      return {
        affectedRows: result.length,
        rows: result as DatabaseRecord[],
      } satisfies DatabaseExecuteResult;
    }

    const mutationResult = result as MariaDbMutationResult;

    return {
      affectedRows: mutationResult.affectedRows ?? 0,
      insertId:
        typeof mutationResult.insertId === 'bigint'
          ? Number(mutationResult.insertId)
          : (mutationResult.insertId ?? null),
    } satisfies DatabaseExecuteResult;
  }

  async close() {
    await this.pool.end();
  }
}

export function createMariaDbAdapter(config: DatabaseConnectionConfig) {
  return new MariaDbAdapter(config);
}
