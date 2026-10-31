import "server-only";

import oracledb from "oracledb";

const globalForOracle = globalThis as typeof globalThis & {
  oraclePoolPromise?: Promise<oracledb.Pool>;
};

export async function getOraclePool(): Promise<oracledb.Pool> {
  const user = process.env.ORACLE_USER;
  const password = process.env.ORACLE_PASSWORD;
  const connectString = process.env.ORACLE_CONNECT_STRING;

  if (!user || !password || !connectString) {
    throw new Error("Oracle database environment variables are missing.");
  }

  if (!globalForOracle.oraclePoolPromise) {
    globalForOracle.oraclePoolPromise = oracledb.createPool({
      user,
      password,
      connectString,
      poolMin: 1,
      poolMax: 4,
      poolIncrement: 1,
    });
  }

  return globalForOracle.oraclePoolPromise;
}

export async function withOracleConnection<T>(
  callback: (connection: oracledb.Connection) => Promise<T>
): Promise<T> {
  const pool = await getOraclePool();
  const connection = await pool.getConnection();

  try {
    return await callback(connection);
  } finally {
    await connection.close();
  }
}