import { NextResponse } from "next/server";
import { adminToken, ADMIN_COOKIE, adminConfigured } from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: "Configura ADMIN_PASSWORD en Vercel para activar el login." },
      { status: 500 }
    );
  }
  let password = "";
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return res;
}
