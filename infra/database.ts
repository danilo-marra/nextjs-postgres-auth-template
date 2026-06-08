import { Pool, PoolClient, QueryConfig, QueryResult, QueryResultRow } from "pg";
import { ServiceError } from "./errors";

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT
    ? Number(process.env.POSTGRES_PORT)
    : undefined,
  user: process.env.POSTGRES_USER,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  ssl: getSSLValues(),
});

async function query<T extends QueryResultRow = QueryResultRow>(
  queryObject: string | QueryConfig,
): Promise<QueryResult<T>> {
  try {
    const result = await pool.query<T>(queryObject as QueryConfig);
    return result;
  } catch (error) {
    const serviceErrorObject = new ServiceError({
      message: "Database connection or query error.",
      cause: error,
    });
    throw serviceErrorObject;
  }
}

async function getNewClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

async function end(): Promise<void> {
  await pool.end();
}

const database = {
  query,
  getNewClient,
  end,
};

export default database;

function getSSLValues(): boolean | { ca: string } {
  if (process.env.POSTGRES_CA) {
    return {
      ca: process.env.POSTGRES_CA,
    };
  }

  return process.env.NODE_ENV === "production" ? true : false;
}
