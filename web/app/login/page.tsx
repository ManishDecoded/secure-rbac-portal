"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!response.ok) setMessage(data.message ?? "Login failed.");
      else router.push(data.role === "ADMIN" ? "/admin" : "/dashboard");
    } catch {
      setMessage("Could not reach the server. Is npm run dev running?");
    } finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-100 px-5 py-16 text-slate-900"><section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-bold">Log in</h1><p className="mt-2 text-sm text-slate-600">Use your approved account.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Email<input name="email" type="email" required autoComplete="email" className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Password<input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-lg border p-3" /></label>
      <button disabled={busy} className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-60">{busy ? "Logging in…" : "Log in"}</button>
    </form>
    {message && <p role="alert" className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{message}</p>}
    <p className="mt-5 text-sm text-slate-600">No account? <Link className="font-semibold text-blue-700" href="/register">Register</Link></p>
    <Link className="mt-4 inline-block text-sm text-slate-600 underline" href="/">Home</Link>
  </section></main>;
}
