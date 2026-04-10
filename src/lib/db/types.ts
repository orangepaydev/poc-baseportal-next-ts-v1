export type DatabaseType = 'mariadb' | 'postgresql';

export type QueryParameter =
  | string
  | number
  | boolean
  | bigint
  | Date
  | Buffer
  | Uint8Array
  | null;

export type QueryParameters = readonly QueryParameter[];

export type DatabaseRecord = Record<string, unknown>;

export type DatabaseQueryOptions = {
  connectionName?: string;
};

export type DatabaseExecuteResult = {
  affectedRows: number;
  command?: string;
  insertId?: number | string | null;
  rows?: DatabaseRecord[];
};

export type DatabaseConnectionConfig = {
  name: string;
  type: DatabaseType;
  url?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean;
  connectionLimit?: number;
  idleTimeoutMs?: number;
  connectionTimeoutMs?: number;
};

export type DatabaseRuntimeConfig = {
  defaultConnectionName: string;
  connections: Record<string, DatabaseConnectionConfig>;
  queryResultLimit: number;
};

export interface DatabaseAdapter {
  query<T extends DatabaseRecord = DatabaseRecord>(
    sql: string,
    params?: QueryParameters
  ): Promise<T[]>;
  execute(
    sql: string,
    params?: QueryParameters
  ): Promise<DatabaseExecuteResult>;
  close(): Promise<void>;
}
