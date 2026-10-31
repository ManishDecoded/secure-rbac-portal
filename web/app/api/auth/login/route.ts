import { NextResponse } from "next/server";
import oracledb from "oracledb";
import bcrypt from "bcryptjs";
import { withOracleConnection } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) {
      return NextResponse.json({ message: "Enter your email and password." }, { status: 400 });
    }

    const user = await withOracleConnection(async (connection) => {
      const result = await connection.execute(
        `BEGIN RBAC_PACKAGE.GET_USER_FOR_LOGIN(:email, :userId, :fullName, :passwordHash, :roleName, :accountStatus, :found); END;`,
        {
          email: { val: email, type: oracledb.STRING, dir: oracledb.BIND_IN },
          userId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          fullName: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 100 },
          passwordHash: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 255 },
          roleName: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 20 },
          accountStatus: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 20 },
          found: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
        }
      );
      const out = result.outBinds as {
        userId: number; fullName: string; passwordHash: string;
        roleName: string; accountStatus: string; found: number;
      };
      return Number(out.found) === 1 ? out : null;
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return NextResponse.json({ message: "Invalid email or password." }, { status: 401 });
    }
    if (user.accountStatus === "PENDING") {
      return NextResponse.json({ message: "Your account is waiting for admin approval." }, { status: 403 });
    }
    if (user.accountStatus !== "APPROVED") {
      return NextResponse.json({ message: "This account has not been approved." }, { status: 403 });
    }

    await createSession({ id: Number(user.userId), fullName: user.fullName, role: user.roleName });
    return NextResponse.json({ message: "Login successful.", role: user.roleName });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ message: "Could not log in. Check the server terminal." }, { status: 500 });
  }
}
