import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { withOracleConnection } from "@/lib/db";

type PendingUser = { USER_ID: number; FULL_NAME: string; EMAIL: string; ROLE_NAME: string; CREATED_AT: Date | string };

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  }
  if (!(await hasPermission(session.id, "users:view"))) {
    return NextResponse.json({ message: "You do not have permission to view users." }, { status: 403 });
  }

  try {
    const users = await withOracleConnection(async (connection) => {
      const result = await connection.execute(
        `BEGIN RBAC_PACKAGE.LIST_PENDING_USERS(:users); END;`,
        { users: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      const cursor = (result.outBinds as { users: oracledb.ResultSet<PendingUser> }).users;
      try {
        return await cursor.getRows(100) as PendingUser[];
      } finally {
        await cursor.close();
      }
    });
    return NextResponse.json({ users });
  } catch (error) {
    console.error("Pending users error:", error);
    return NextResponse.json({ message: "Could not load pending users." }, { status: 500 });
  }
}
