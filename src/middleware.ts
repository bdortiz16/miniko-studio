import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protege /admin/* con la cookie de sesión de admin (HMAC de ADMIN_PASSWORD).
// Edge runtime: usamos Web Crypto para recomputar el HMAC.

const SESSION_MSG = "miniko-admin-session-v1";

async function hmacHex(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  const pw = process.env.ADMIN_PASSWORD;
  // Sin contraseña configurada => panel abierto (avisamos en la UI).
  if (!pw) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/admin/login") return NextResponse.next();

  const cookie = req.cookies.get("miniko_admin")?.value || "";
  const expected = await hmacHex(pw, SESSION_MSG);

  if (cookie !== expected) {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
