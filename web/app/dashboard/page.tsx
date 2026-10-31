"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: number; fullName: string; role: string };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("Loading your dashboard…");

  useEffect(() => {
    fetch("/api/auth/me").then(async (response) => {
      const data = await response.json();
      if (!response.ok) { router.replace("/login"); return; }
      setUser(data.user); setMessage("");
    }).catch(() => setMessage("Could not load your account."));
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return <main className="min-h-screen bg-slate-100 px-5 py-12 text-slate-900"><section className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-blue-700">User Dashboard</p><h1 className="mt-2 text-3xl font-bold">Welcome{user ? `, ${user.fullName}` : ""}</h1></div><button onClick={logout} className="rounded-lg border px-4 py-2">Log out</button></div>
    {message && <p className="mt-6 text-slate-600">{message}</p>}
    {user && <div className="mt-6 rounded-xl bg-slate-50 p-5"><p><strong>Role:</strong> {user.role}</p><p className="mt-2"><strong>Account status:</strong> Approved</p>
      <h2 className="mt-6 text-lg font-semibold">Available section</h2>
      {user.role === "HR" && <p className="mt-2">HR can access employee-related functions.</p>}
      {user.role === "MANAGER" && <p className="mt-2">Managers can access team-related functions.</p>}
      {user.role === "EMPLOYEE" && <p className="mt-2">Employees can access their personal dashboard.</p>}
      {user.role === "ADMIN" && <p className="mt-2">Administrator account detected. <Link className="font-semibold text-blue-700 underline" href="/admin">Open admin dashboard</Link></p>}
    </div>}
    <Link className="mt-6 inline-block text-sm text-slate-600 underline" href="/">Home</Link>
  </section></main>;
}
