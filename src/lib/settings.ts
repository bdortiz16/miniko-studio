import { VARIANTS, SHIPPING } from "@/data/catalog";
import { Costs, defaultCosts } from "@/lib/accounting";

// Configuración editable desde el panel admin (precios y envío).
// Se guarda como JSON en Supabase Storage: config/settings.json
export interface Settings {
  prices: Record<string, number>; // variantId -> precio en COP
  shippingCop: number; // costo de envío en COP
  freeFromPeople: number; // envío gratis desde N personajes
  whatsapp: string; // número de WhatsApp de soporte (solo el número)
  adminEmail: string; // correo donde llegan los avisos de pedidos nuevos
  whatsappIcon: string; // URL del Funko (camiseta WhatsApp) generado con IA
  supportIcon: string; // URL del Funko de soporte/asistente generado con IA
  tiendaShippingCop: number; // costo de envío de los productos de la Tienda
  costs: Costs; // costos para la contabilidad
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
    whatsappIcon: "",
    supportIcon: "",
    tiendaShippingCop: SHIPPING.flatCop,
    costs: defaultCosts(),
  };
}

// Merge profundo de costos (para no perder claves nuevas).
function mergeCosts(data: Partial<Costs> | undefined, def: Costs): Costs {
  if (!data || typeof data !== "object") return def;
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const production = { ...def.production };
  if (data.production && typeof data.production === "object") {
    for (const k of Object.keys(def.production)) {
      const p = data.production[k];
      production[k] = {
        persona: num(p?.persona, def.production[k].persona),
        mascota: num(p?.mascota, def.production[k].mascota),
      };
    }
  }
  return {
    production,
    paints: num(data.paints, def.paints),
    brush: num(data.brush, def.brush),
    paper: num(data.paper, def.paper),
    box: num(data.box, def.box),
    wrapping: num(data.wrapping, def.wrapping),
    cards: num(data.cards, def.cards),
    shippingCost: num(data.shippingCost, def.shippingCost),
    ivaRate: num(data.ivaRate, def.ivaRate),
    wompiPct: num(data.wompiPct, def.wompiPct),
    wompiFixed: num(data.wompiFixed, def.wompiFixed),
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
      whatsappIcon: typeof data.whatsappIcon === "string" ? data.whatsappIcon : def.whatsappIcon,
      supportIcon: typeof data.supportIcon === "string" ? data.supportIcon : def.supportIcon,
      tiendaShippingCop:
        typeof data.tiendaShippingCop === "number" ? data.tiendaShippingCop : def.tiendaShippingCop,
      costs: mergeCosts(data.costs, def.costs),
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
export function tiendaShipOf(settings: Settings): number {
  return typeof settings.tiendaShippingCop === "number" ? settings.tiendaShippingCop : settings.shippingCop;
}
