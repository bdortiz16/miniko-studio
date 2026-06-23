import { NextResponse } from "next/server";
import { findValidCoupon } from "@/lib/coupons";

// Validación pública de cupón (para el checkout). No expone la lista.
export async function POST(request: Request) {
  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false });
  }
  const c = await findValidCoupon(body.code || "");
  if (!c) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, code: c.code, percent: c.percent });
}
