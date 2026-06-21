import { NextResponse } from "next/server";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin-auth";
import { getSettings, defaultSettings, SETTINGS_PATH, Settings } from "@/lib/settings";
import { VARIANTS } from "@/data/catalog";

// Configuración editable (precios y envío) desde el panel admin.
// GET  -> devuelve la configuración actual (con valores por defecto si falta).
// POST -> guarda la configuración como JSON en Supabase Storage.

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Falta configurar Supabase (SUPABASE_SECRET_KEY)." },
      { status: 500 }
    );
  }

  let body: Partial<Settings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const def = defaultSettings();

  // Validación: solo aceptamos precios de variantes conocidas y números válidos.
  const prices: Record<string, number> = { ...def.prices };
  if (body.prices && typeof body.prices === "object") {
    for (const v of VARIANTS) {
      const raw = body.prices[v.id];
      const n = typeof raw === "number" ? raw : Number(raw);
      if (Number.isFinite(n) && n >= 0) prices[v.id] = Math.round(n);
    }
  }

  const shippingCop =
    Number.isFinite(Number(body.shippingCop)) && Number(body.shippingCop) >= 0
      ? Math.round(Number(body.shippingCop))
      : def.shippingCop;

  const freeFromPeople =
    Number.isFinite(Number(body.freeFromPeople)) && Number(body.freeFromPeople) >= 1
      ? Math.round(Number(body.freeFromPeople))
      : def.freeFromPeople;

  const settings: Settings = { prices, shippingCop, freeFromPeople };

  try {
    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(SETTINGS_PATH, Buffer.from(JSON.stringify(settings, null, 2)), {
        contentType: "application/json",
        upsert: true,
        cacheControl: "0",
      });
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al guardar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
