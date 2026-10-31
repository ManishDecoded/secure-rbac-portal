import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { hasPermission } from "@/lib/rbac";

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "Please log in." }, { status: 401 });

  const approved = await hasPermission(user.id, "profile:view");
  if (!approved) return NextResponse.json({ message: "Account is not approved or is inactive." }, { status: 403 });

  return NextResponse.json({ user });
}
