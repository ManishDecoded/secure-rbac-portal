import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "rbac_session";

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret === "YOUR_GENERATED_SECRET") {
    throw new Error("Set a real AUTH_SECRET in .env.local first.");
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: number;
  fullName: string;
  role: string;
};

export async function createSession(user: SessionUser) {
  const token = await new SignJWT({ fullName: user.fullName, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, getSecret());
    const id = Number(payload.sub);
    if (!Number.isFinite(id) || !payload.fullName || !payload.role) return null;

    return {
      id,
      fullName: String(payload.fullName),
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
