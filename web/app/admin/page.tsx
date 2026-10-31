"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type PendingUser = { USER_ID: number; FULL_NAME: string; EMAIL: string; ROLE_NAME: string; CREATED_AT: string };

export default function AdminPage() {
  const router = useRouter();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [message, setMessage] = useState("Loading pending registrations…");
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/pending");
      const data = await response.json();
      if (response.status === 403) { setMessage(data.message ?? "Administrator access required."); return; }
      if (!response.ok) { setMessage(data.message ?? "Could not load users."); return; }
      setUsers(data.users ?? []);
      setMessage(data.users?.length ? "" : "There are no pending registrations.");
    } catch { setMessage("Could not connect to the server."); }
  }, []);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  async function decide(userId: number, action: "APPROVED" | "REJECTED") {
    setBusyId(userId); setMessage("");
    try {
      const response = await fetch("/api/admin/approval", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      const data = await response.json();
      setMessage(data.message ?? (response.ok ? "Updated." : "Could not update user."));
      if (response.ok) await loadUsers();
    } catch { setMessage("Could not connect to the server."); }
    finally { setBusyId(null); }
  }

  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); router.replace("/login"); }

  return <main className="min-h-screen bg-slate-100 px-5 py-12 text-slate-900"><section className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Admin</p><h1 className="mt-2 text-3xl font-bold">Pending registrations</h1></div><button onClick={logout} className="rounded-lg border px-4 py-2">Log out</button></div>
    {message && <p role="status" className="mt-5 rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{message}</p>}
    {users.length > 0 && <div className="mt-6 overflow-x-auto"><table className="w-full border-collapse text-left text-sm"><thead><tr className="border-b bg-slate-50"><th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Action</th></tr></thead><tbody>{users.map((user) => <tr key={user.USER_ID} className="border-b"><td className="p-3">{user.FULL_NAME}</td><td className="p-3">{user.EMAIL}</td><td className="p-3">{user.ROLE_NAME}</td><td className="p-3"><div className="flex gap-2"><button disabled={busyId === user.USER_ID} onClick={() => decide(user.USER_ID, "APPROVED")} className="rounded bg-green-700 px-3 py-2 text-white disabled:opacity-50">Approve</button><button disabled={busyId === user.USER_ID} onClick={() => decide(user.USER_ID, "REJECTED")} className="rounded bg-red-700 px-3 py-2 text-white disabled:opacity-50">Reject</button></div></td></tr>)}</tbody></table></div>}
    <div className="mt-6 flex gap-4 text-sm"><button onClick={() => void loadUsers()} className="font-semibold text-blue-700 underline">Refresh list</button><Link href="/" className="text-slate-600 underline">Home</Link></div>
  </section></main>;
}
