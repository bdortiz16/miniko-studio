import { NextResponse } from "next/server";
import { verifyToken } from "@/lib/verify";

export async function POST(request: Request) {
  try {
    const { email, code, exp, token } = await request.json();
    const ok = verifyToken(email, String(code), Number(exp), token);
    if (!ok) {
      return NextResponse.json(
        { error: "Código incorrecto o caducado." },
        { status: 400 }
      );
    }
    return NextResponse.json({ verified: true });
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
}
