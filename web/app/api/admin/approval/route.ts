import { NextResponse } from "next/server";
import oracledb from "oracledb";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";
import { withOracleConnection } from "@/lib/db";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ message: "Administrator access required." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const userId = Number(body.userId);
    const action = String(body.action ?? "").toUpperCase();
    if (!Number.isInteger(userId) || userId < 1 || !["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json({ message: "Invalid user or action." }, { status: 400 });
    }

    const permission = action === "APPROVED" ? "users:approve" : "users:reject";
    if (!(await hasPermission(session.id, permission))) {
      return NextResponse.json({ message: "You do not have permission to perform this action." }, { status: 403 });
    }

    const message = await withOracleConnection(async (connection) => {
      const result = await connection.execute(
        `BEGIN RBAC_PACKAGE.APPROVE_USER(:adminId, :targetId, :action, :message); END;`,
        {
          adminId: { val: session.id, type: oracledb.NUMBER, dir: oracledb.BIND_IN },
          targetId: { val: userId, type: oracledb.NUMBER, dir: oracledb.BIND_IN },
          action: { val: action, type: oracledb.STRING, dir: oracledb.BIND_IN },
          message: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 200 },
        }
      );
      await connection.commit();
      return String((result.outBinds as { message: string }).message);
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ message: "Could not update the account. It may no longer be pending." }, { status: 500 });
  }
}
