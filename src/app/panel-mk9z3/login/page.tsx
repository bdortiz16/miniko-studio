"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/panel-mk9z3";

  const [step, setStep] = useState<"password" | "code">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [exp, setExp] = useState(0);
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function resend() {
    setError(null);
    setInfo(null);
    try {
      const res = await fetch("/api/admin/login/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo reenviar.");
      setToken(data.token);
      setExp(data.exp);
      setHint(data.hint || hint);
      setCode("");
      setCooldown(30);
      setInfo("✓ Te enviamos un código nuevo.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo entrar.");
      if (data.step === "code") {
        setToken(data.token);
        setExp(data.exp);
        setHint(data.hint || "");
        setStep("code");
        setCooldown(30);
        setLoading(false);
      } else {
        router.replace(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
      setLoading(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, token, exp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto.");
      router.replace(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      {step === "password" ? (
        <form onSubmit={submitPassword} className="w-full max-w-sm rounded-2xl border border-line bg-white p-7">
          <h1 className="font-display text-2xl font-extrabold">Panel de administración</h1>
          <div className="mt-2 h-px w-12 bg-brand/70" />
          <p className="mt-3 text-sm text-ink/60">Introduce tu correo y contraseña para entrar.</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            autoComplete="username"
            autoFocus
            className="mt-5 w-full rounded-full border border-line px-4 py-2.5 outline-none focus:border-ink"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete="current-password"
            className="mt-3 w-full rounded-full border border-line px-4 py-2.5 outline-none focus:border-ink"
          />
          {error && (
            <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{error}</p>
          )}
          <button type="submit" disabled={loading || !email || !password} className="btn-primary mt-5 w-full disabled:opacity-50">
            {loading ? "Verificando…" : "Continuar"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="w-full max-w-sm rounded-2xl border border-line bg-white p-7">
          <h1 className="font-display text-2xl font-extrabold">Código de acceso</h1>
          <div className="mt-2 h-px w-12 bg-brand/70" />
          <p className="mt-3 text-sm text-ink/60">
            Te enviamos un código de 6 dígitos {hint ? <>a <b className="text-ink">{hint}</b></> : "a tu correo"}.
            Escríbelo para entrar.
          </p>
          <input
            inputMode="numeric"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="••••••"
            autoFocus
            className="mt-5 w-full rounded-full border border-line px-4 py-2.5 text-center text-lg tracking-[0.5em] outline-none focus:border-ink"
          />
          {info && (
            <p className="mt-3 rounded-lg border border-green-300 px-3 py-2 text-sm text-green-600">{info}</p>
          )}
          {error && (
            <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{error}</p>
          )}
          <button type="submit" disabled={loading || code.length < 6} className="btn-primary mt-5 w-full disabled:opacity-50">
            {loading ? "Entrando…" : "Entrar"}
          </button>
          <div className="mt-4 flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => { setStep("password"); setCode(""); setError(null); setInfo(null); }}
              className="font-semibold text-ink/60 underline underline-offset-2 hover:text-ink"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={resend}
              disabled={cooldown > 0}
              className="font-semibold text-brand underline underline-offset-2 disabled:text-ink/40 disabled:no-underline"
            >
              {cooldown > 0 ? `Reenviar en ${cooldown}s` : "¿No llegó? Reenviar código"}
            </button>
          </div>
        </form>
      )}
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
