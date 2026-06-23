import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listMovements, saveMovements, WalletMovement } from "@/lib/wallet";

export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json({ movements: await listMovements() });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let body: { type?: string; concept?: string; amount?: number; date?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
  }
  const mov: WalletMovement = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    date: body.date && Number.isFinite(body.date) ? Number(body.date) : Math.floor(Date.now() / 1000),
    type: body.type === "ingreso" ? "ingreso" : "egreso",
    concept: (body.concept || "").slice(0, 120),
    amount: Math.round(amount),
  };
  const list = await listMovements();
  list.unshift(mov);
  await saveMovements(list);
  return NextResponse.json({ ok: true, movement: mov });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  const list = (await listMovements()).filter((m) => m.id !== id);
  await saveMovements(list);
  return NextResponse.json({ ok: true });
}
