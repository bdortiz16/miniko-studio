// Integración con Envia.com (multitransportadora Colombia).
// Flujo: cotizar (/ship/rate/) -> elegir la opción más barata -> generar guía
// (/ship/generate/) -> obtener número de guía (trackingNumber) y etiqueta (PDF).
//
// Variables de entorno necesarias en Vercel:
//   ENVIA_API_TOKEN        -> token Bearer de tu cuenta Envia.com
//   ENVIA_SANDBOX=true     -> usa el ambiente de pruebas (por defecto: producción)
// Remitente (tu bodega/origen):
//   ENVIA_FROM_NAME, ENVIA_FROM_COMPANY, ENVIA_FROM_PHONE, ENVIA_FROM_EMAIL,
//   ENVIA_FROM_STREET, ENVIA_FROM_CITY, ENVIA_FROM_STATE, ENVIA_FROM_POSTALCODE
//   (país fijo: CO)
// Paquete por defecto (opcional, hay valores por defecto):
//   ENVIA_PKG_WEIGHT (kg), ENVIA_PKG_LENGTH, ENVIA_PKG_WIDTH, ENVIA_PKG_HEIGHT (cm)

const TOKEN = process.env.ENVIA_API_TOKEN || "";
// Envia exige una transportadora en el envío. Probamos varias y usamos la que
// funcione (la más barata primero). Configurable con ENVIA_CARRIER (lista
// separada por comas). Slugs: servientrega, interrapidisimo, coordinadora, tcc, envia.
const CARRIERS = (process.env.ENVIA_CARRIER || "servientrega,interrapidisimo,coordinadora,envia")
  .split(",")
  .map((s) => s.toLowerCase().trim())
  .filter(Boolean);

export function enviaConfigured(): boolean {
  return !!TOKEN;
}

// Envia.com exige el departamento como CÓDIGO corto (ISO 3166-2:CO), no el
// nombre completo. Mapeamos nombre -> código.
const CO_STATES: Record<string, string> = {
  amazonas: "AMA", antioquia: "ANT", arauca: "ARA", atlantico: "ATL",
  bogota: "DC", "bogota dc": "DC", "distrito capital": "DC",
  bolivar: "BOL", boyaca: "BOY", caldas: "CAL", caqueta: "CAQ", casanare: "CAS",
  cauca: "CAU", cesar: "CES", choco: "CHO", cordoba: "COR", cundinamarca: "CUN",
  guainia: "GUA", guaviare: "GUV", huila: "HUI", "la guajira": "LAG", guajira: "LAG",
  magdalena: "MAG", meta: "MET", narino: "NAR", "norte de santander": "NSA",
  putumayo: "PUT", quindio: "QUI", risaralda: "RIS",
  "san andres y providencia": "SAP", "san andres": "SAP", santander: "SAN",
  sucre: "SUC", tolima: "TOL", "valle del cauca": "VAC", valle: "VAC",
  vaupes: "VAU", vichada: "VID",
};

function norm(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function coStateCode(name: string): string {
  const n = norm(name);
  if (CO_STATES[n]) return CO_STATES[n];
  if (/^[a-z]{2,3}$/i.test((name || "").trim())) return name.trim().toUpperCase();
  return name; // se envía tal cual; Envia validará
}

function withStateCode(a: Address): Address {
  return { ...a, state: coStateCode(a.state) };
}

function base(): string {
  return process.env.ENVIA_SANDBOX === "true"
    ? "https://api-test.envia.com"
    : "https://api.envia.com";
}

export interface Address {
  name: string;
  company?: string;
  phone: string;
  email?: string;
  street: string;
  city: string;
  state: string;
  country: string; // "CO"
  postalCode?: string;
}

export interface RateOption {
  carrier: string;
  service: string;
  serviceDescription?: string;
  totalPrice: number;
  deliveryEstimate?: string;
}

export interface GeneratedGuide {
  trackingNumber: string;
  labelUrl: string;
  carrier: string;
  service: string;
  totalPrice?: number;
}

// Remitente desde variables de entorno. Devuelve null si falta lo esencial.
export function originFromEnv(): Address | null {
  const name = process.env.ENVIA_FROM_NAME;
  const street = process.env.ENVIA_FROM_STREET;
  const city = process.env.ENVIA_FROM_CITY;
  const state = process.env.ENVIA_FROM_STATE;
  const phone = process.env.ENVIA_FROM_PHONE;
  if (!name || !street || !city || !state || !phone) return null;
  return {
    name,
    company: process.env.ENVIA_FROM_COMPANY || "Miniko",
    phone,
    email: process.env.ENVIA_FROM_EMAIL || undefined,
    street,
    city,
    state,
    country: "CO",
    postalCode: process.env.ENVIA_FROM_POSTALCODE || undefined,
  };
}

function defaultPackage(declaredValue: number) {
  const num = (v: string | undefined, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    type: "box",
    content: "Figura coleccionable",
    amount: 1,
    declaredValue: Math.max(1, Math.round(declaredValue)),
    weight: num(process.env.ENVIA_PKG_WEIGHT, 0.5),
    weightUnit: "KG",
    lengthUnit: "CM",
    dimensions: {
      length: num(process.env.ENVIA_PKG_LENGTH, 20),
      width: num(process.env.ENVIA_PKG_WIDTH, 15),
      height: num(process.env.ENVIA_PKG_HEIGHT, 15),
    },
  };
}

async function call(path: string, body: unknown): Promise<{ meta?: string; data?: unknown[]; error?: unknown }> {
  const res = await fetch(`${base()}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.meta === "error") {
    const msg =
      json?.error?.message ||
      (typeof json?.error === "string" ? json.error : null) ||
      json?.message ||
      `Envia respondió ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// Cotiza UNA transportadora. No lanza: si falla, devuelve [].
export async function quote(
  origin: Address,
  destination: Address,
  declaredValue: number,
  carrier: string
): Promise<RateOption[]> {
  try {
    const json = await call("/ship/rate/", {
      origin: withStateCode(origin),
      destination: withStateCode(destination),
      packages: [defaultPackage(declaredValue)],
      shipment: { type: 1, carrier },
    });
    const data = Array.isArray(json.data) ? (json.data as Record<string, unknown>[]) : [];
    return data
      .map((d) => ({
        carrier: String(d.carrier ?? carrier),
        service: String(d.service ?? ""),
        serviceDescription: d.serviceDescription ? String(d.serviceDescription) : undefined,
        totalPrice: Number(d.totalPrice ?? d.basePrice ?? 0),
        deliveryEstimate: d.deliveryEstimate ? String(d.deliveryEstimate) : undefined,
      }))
      .filter((o) => o.carrier && o.service);
  } catch {
    return [];
  }
}

// Genera la guía con un carrier/service concreto.
export async function generate(
  origin: Address,
  destination: Address,
  declaredValue: number,
  carrier: string,
  service: string
): Promise<GeneratedGuide> {
  const json = await call("/ship/generate/", {
    origin: withStateCode(origin),
    destination: withStateCode(destination),
    packages: [defaultPackage(declaredValue)],
    shipment: { type: 1, carrier, service },
  });
  const d = (Array.isArray(json.data) ? json.data[0] : json.data) as Record<string, unknown> | undefined;
  if (!d) throw new Error("Envia no devolvió la guía.");
  const trackingNumber = String(d.trackingNumber ?? d.tracking_number ?? "");
  const labelUrl = String(d.label ?? d.labelUrl ?? "");
  if (!trackingNumber) throw new Error("Envia no devolvió número de guía.");
  return {
    trackingNumber,
    labelUrl,
    carrier,
    service,
    totalPrice: d.totalPrice ? Number(d.totalPrice) : undefined,
  };
}

// Orquesta: cotiza, elige la más barata y genera la guía.
export async function generateBestGuide(
  destination: Address,
  declaredValue: number
): Promise<GeneratedGuide> {
  const origin = originFromEnv();
  if (!origin) {
    throw new Error(
      "Falta configurar la dirección de origen (ENVIA_FROM_*) en Vercel."
    );
  }
  // Cotiza todas las transportadoras configuradas y junta las opciones.
  const all: RateOption[] = [];
  for (const c of CARRIERS) {
    const opts = await quote(origin, destination, declaredValue, c);
    all.push(...opts);
  }
  all.sort((a, b) => a.totalPrice - b.totalPrice);
  if (all.length === 0) {
    throw new Error(
      "Envia no devolvió tarifas. Revisa el saldo de tu cuenta, que la información de facturación esté validada, y la ciudad/departamento."
    );
  }
  // Intenta generar con cada opción (más barata primero) hasta que una funcione.
  let lastErr = "";
  for (const opt of all.slice(0, 6)) {
    try {
      return await generate(origin, destination, declaredValue, opt.carrier, opt.service);
    } catch (e) {
      lastErr = e instanceof Error ? e.message : String(e);
    }
  }
  throw new Error(
    `No se pudo generar la guía con ninguna transportadora. Último error: ${lastErr}. Suele ser por falta de SALDO en Envia o por la información de facturación sin validar.`
  );
}
