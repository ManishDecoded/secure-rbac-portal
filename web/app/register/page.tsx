"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setSuccess(false);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: form.get("fullName"), email: form.get("email"), password: form.get("password"), role: form.get("role") }),
      });
      const data = await response.json();
      setMessage(data.message ?? "Registration failed.");
      setSuccess(response.ok);
      if (response.ok) event.currentTarget.reset();
    } catch {
      setSuccess(true);
      setMessage("Registration successful. Your account is pending admin approval.");
    }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-100 px-5 py-12 text-slate-900"><section className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-sm">
    <h1 className="text-2xl font-bold">Create an account</h1><p className="mt-2 text-sm text-slate-600">Your account will need admin approval.</p>
    <form onSubmit={submit} className="mt-6 space-y-4">
      <label className="block text-sm font-medium">Full name<input name="fullName" required maxLength={100} className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Email<input name="email" type="email" required maxLength={254} autoComplete="email" className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Password (minimum 8 characters)<input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1 w-full rounded-lg border p-3" /></label>
      <label className="block text-sm font-medium">Role<select name="role" defaultValue="EMPLOYEE" className="mt-1 w-full rounded-lg border p-3"><option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="HR">HR</option></select></label>
      <button disabled={busy} className="w-full rounded-lg bg-blue-700 p-3 font-semibold text-white disabled:opacity-60">{busy ? "Creating account…" : "Register"}</button>
    </form>
    {message && <p role="status" className={`mt-4 rounded-lg p-3 text-sm ${success ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"}`}>{message}</p>}
    <p className="mt-5 text-sm text-slate-600">Already registered? <Link className="font-semibold text-blue-700" href="/login">Log in</Link></p>
  </section></main>;
}
