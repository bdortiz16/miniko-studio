import { NextResponse } from "next/server";
import { isAdmin, makeSession, ADMIN_COOKIE, adminConfigured, SESSION_TTL_MS } from "@/lib/admin-auth";

// Renueva el vencimiento de la sesión (sliding) cuando el usuario tiene
// actividad real en el panel. El cliente lo llama de forma moderada.
export async function POST(request: Request) {
  if (!adminConfigured()) return NextResponse.json({ ok: true });
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Sesión vencida." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  const session = makeSession(SESSION_TTL_MS);
  res.cookies.set(ADMIN_COOKIE, session.value, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: session.maxAge,
  });
  return res;
}
