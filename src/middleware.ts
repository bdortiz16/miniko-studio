import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protege /admin/* con la cookie de sesión de admin. El token es `${exp}.${firma}`
// con firma = HMAC(ADMIN_PASSWORD, "miniko-admin-v2:exp"). La sesión vence a las
// 2 horas; aquí la renovamos (sliding) en cada navegación del panel.

const SESSION_PREFIX = "miniko-admin-v2";
const TTL_MS = 2 * 60 * 60 * 1000;

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

async function valid(value: string, pw: string): Promise<boolean> {
  const dot = value.indexOf(".");
  if (dot < 0) return false;
  const exp = Number(value.slice(0, dot));
  const sig = value.slice(dot + 1);
  if (!exp || Number.isNaN(exp) || Date.now() > exp) return false;
  const expected = await hmacHex(pw, `${SESSION_PREFIX}:${exp}`);
  return sig === expected;
}

export async function middleware(req: NextRequest) {
  const pw = process.env.ADMIN_PASSWORD;
  // Sin contraseña configurada => panel abierto (avisamos en la UI).
  if (!pw) return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (pathname === "/panel-mk9z3/login") return NextResponse.next();

  const cookie = req.cookies.get("miniko_admin")?.value || "";

  if (!(await valid(cookie, pw))) {
    const url = req.nextUrl.clone();
    url.pathname = "/panel-mk9z3/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Sesión válida: renovamos el vencimiento (sliding) en cada navegación.
  const res = NextResponse.next();
  const exp = Date.now() + TTL_MS;
  res.cookies.set("miniko_admin", `${exp}.${await hmacHex(pw, `${SESSION_PREFIX}:${exp}`)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: Math.floor(TTL_MS / 1000),
  });
  return res;
}

export const config = {
  matcher: ["/panel-mk9z3", "/panel-mk9z3/:path*"],
};
