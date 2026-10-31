import { NextResponse } from "next/server";
import oracledb from "oracledb";
import bcrypt from "bcryptjs";
import { withOracleConnection } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const role = String(body.role ?? "EMPLOYEE").toUpperCase();

    if (!fullName || !email || !password) {
      return NextResponse.json({ message: "Please fill in every field." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ message: "Password must be at least 8 characters." }, { status: 400 });
    }
    if (!["HR", "MANAGER", "EMPLOYEE"].includes(role)) {
      return NextResponse.json({ message: "Choose a valid role." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await withOracleConnection(async (connection) => {
      await connection.execute(
        `BEGIN RBAC_PACKAGE.REGISTER_USER(:fullName, :email, :passwordHash, :roleName, :userId, :status); END;`,
        {
          fullName: { val: fullName, type: oracledb.STRING, dir: oracledb.BIND_IN },
          email: { val: email, type: oracledb.STRING, dir: oracledb.BIND_IN },
          passwordHash: { val: passwordHash, type: oracledb.STRING, dir: oracledb.BIND_IN },
          roleName: { val: role, type: oracledb.STRING, dir: oracledb.BIND_IN },
          userId: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT },
          status: { type: oracledb.STRING, dir: oracledb.BIND_OUT, maxSize: 20 },
        }
      );
      await connection.commit();
    });

    return NextResponse.json({ message: "Registration successful. Your account is pending admin approval." }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed.";
    if (message.includes("already registered") || message.includes("ORA-00001")) {
      return NextResponse.json({ message: "This email is already registered." }, { status: 409 });
    }
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Could not register. Check the server terminal and Oracle package." }, { status: 500 });
  }
}
