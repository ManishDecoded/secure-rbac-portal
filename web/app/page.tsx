import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-100 px-6 py-20 text-slate-900">
      <section className="mx-auto max-w-3xl rounded-2xl bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">Secure RBAC Portal</p>
        <h1 className="mt-3 text-4xl font-bold">Role-Based Access Control</h1>
        <p className="mt-4 max-w-xl text-slate-600">A simple authentication portal using Next.js, TypeScript, Oracle Database and PL/SQL.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white" href="/login">Log in</Link>
          <Link className="rounded-lg border border-slate-300 px-5 py-3 font-semibold" href="/register">Create account</Link>
        </div>
      </section>
    </main>
  );
}
