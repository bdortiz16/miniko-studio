import { VARIANTS, SHIPPING } from "@/data/catalog";

// Configuración editable desde el panel admin (precios y envío).
// Se guarda como JSON en Supabase Storage: config/settings.json
export interface Settings {
  prices: Record<string, number>; // variantId -> precio en COP
  shippingCop: number; // costo de envío en COP
  freeFromPeople: number; // envío gratis desde N personajes
  whatsapp: string; // número de WhatsApp de soporte (solo el número)
  adminEmail: string; // correo donde llegan los avisos de pedidos nuevos
}

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SETTINGS_PATH = "config/settings.json";

export function defaultSettings(): Settings {
  return {
    prices: Object.fromEntries(VARIANTS.map((v) => [v.id, v.priceCop])),
    shippingCop: SHIPPING.flatCop,
    freeFromPeople: SHIPPING.freeFromPeople,
    whatsapp: "",
    adminEmail: "",
  };
}

export async function getSettings(): Promise<Settings> {
  const def = defaultSettings();
  if (!SUPA) return def;
  try {
    const res = await fetch(
      `${SUPA}/storage/v1/object/public/pedidos/${SETTINGS_PATH}?t=${Date.now()}`,
      { cache: "no-store" }
    );
    if (!res.ok) return def;
    const data = (await res.json()) as Partial<Settings>;
    return {
      prices: { ...def.prices, ...(data.prices || {}) },
      shippingCop: typeof data.shippingCop === "number" ? data.shippingCop : def.shippingCop,
      freeFromPeople:
        typeof data.freeFromPeople === "number" ? data.freeFromPeople : def.freeFromPeople,
      whatsapp: typeof data.whatsapp === "string" ? data.whatsapp : def.whatsapp,
      adminEmail: typeof data.adminEmail === "string" ? data.adminEmail : def.adminEmail,
    };
  } catch {
    return def;
  }
}

// Helpers que usan la configuración dinámica.
export function priceOf(settings: Settings, variantId: string, fallback: number): number {
  return settings.prices[variantId] ?? fallback;
}
export function shipOf(settings: Settings, people: number): number {
  return people >= settings.freeFromPeople ? 0 : settings.shippingCop;
}
