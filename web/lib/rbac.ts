import "server-only";
import oracledb from "oracledb";
import { withOracleConnection } from "@/lib/db";

export async function hasPermission(userId: number, permissionKey: string) {
  return withOracleConnection(async (connection) => {
    const result = await connection.execute(
      `BEGIN RBAC_PACKAGE.HAS_PERMISSION(:userId, :permissionKey, :allowed); END;`,
      {
        userId: { val: userId, type: oracledb.NUMBER, dir: oracledb.BIND_IN },
        permissionKey: { val: permissionKey, type: oracledb.STRING, dir: oracledb.BIND_IN },
        allowed: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
      }
    );
    return Number(result.outBinds?.allowed) === 1;
  });
}
