"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo entrar.");
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line p-7">
        <h1 className="font-display text-2xl font-extrabold">Panel de administración</h1>
        <div className="mt-2 h-px w-12 bg-brand/70" />
        <p className="mt-3 text-sm text-ink/60">Introduce la contraseña para entrar.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoFocus
          className="mt-5 w-full rounded-full border border-line px-4 py-2.5 outline-none focus:border-ink"
        />
        {error && (
          <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary mt-5 w-full disabled:opacity-50">
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="section container-x">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
