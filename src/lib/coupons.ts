import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Cupones de descuento. Se guardan en Supabase (config/coupons.json).
export interface Coupon {
  code: string; // en mayúsculas
  percent: number; // 1-100
  validUntil?: number; // unix seg (opcional)
  createdAt: number;
}

const PATH = "config/coupons.json";

export async function listCoupons(): Promise<Coupon[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).download(PATH);
  if (error || !data) return [];
  try {
    const arr = JSON.parse(await data.text());
    return Array.isArray(arr) ? (arr as Coupon[]) : [];
  } catch {
    return [];
  }
}

export async function saveCoupons(list: Coupon[]): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase no configurado.");
  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(PATH, Buffer.from(JSON.stringify(list, null, 2)), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

// Devuelve el cupón si existe y no está vencido.
export async function findValidCoupon(code: string): Promise<Coupon | null> {
  const norm = (code || "").toUpperCase().trim();
  if (!norm) return null;
  const c = (await listCoupons()).find((x) => x.code === norm);
  if (!c) return null;
  if (c.validUntil && c.validUntil < Math.floor(Date.now() / 1000)) return null;
  return c;
}
