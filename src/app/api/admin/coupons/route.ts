import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listCoupons, saveCoupons, Coupon } from "@/lib/coupons";

export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json({ coupons: await listCoupons() });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  let body: { code?: string; percent?: number; validUntil?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const code = (body.code || "").toUpperCase().trim().replace(/\s+/g, "");
  const percent = Math.round(Number(body.percent));
  if (!code) return NextResponse.json({ error: "Falta el código." }, { status: 400 });
  if (!Number.isFinite(percent) || percent < 1 || percent > 100) {
    return NextResponse.json({ error: "El porcentaje debe ser 1–100." }, { status: 400 });
  }
  const list = await listCoupons();
  if (list.some((c) => c.code === code)) {
    return NextResponse.json({ error: "Ya existe un cupón con ese código." }, { status: 400 });
  }
  const coupon: Coupon = {
    code,
    percent,
    validUntil: body.validUntil && Number.isFinite(body.validUntil) ? Number(body.validUntil) : undefined,
    createdAt: Math.floor(Date.now() / 1000),
  };
  list.unshift(coupon);
  await saveCoupons(list);
  return NextResponse.json({ ok: true, coupon });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Falta el código." }, { status: 400 });
  const list = (await listCoupons()).filter((c) => c.code !== code.toUpperCase().trim());
  await saveCoupons(list);
  return NextResponse.json({ ok: true });
}
