import crypto from "crypto";

// Integración con Wompi (pasarela de pagos de Colombia).
// Funciona con llaves de prueba (pub_test_/prv_test_) y de producción
// (pub_prod_/prv_prod_). El entorno se deduce del prefijo de la llave pública.

export const WOMPI_PUBLIC_KEY = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY || "";
const PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || "";
const INTEGRITY_SECRET = process.env.WOMPI_INTEGRITY_SECRET || "";
const EVENTS_SECRET = process.env.WOMPI_EVENTS_SECRET || "";

export function wompiConfigured(): boolean {
  return !!(WOMPI_PUBLIC_KEY && INTEGRITY_SECRET);
}

// Sandbox si la llave es de prueba; si no, producción.
function isSandbox(): boolean {
  return WOMPI_PUBLIC_KEY.includes("_test_") || WOMPI_PUBLIC_KEY.startsWith("pub_stagtest");
}

export function wompiApiBase(): string {
  return isSandbox() ? "https://sandbox.wompi.co/v1" : "https://production.wompi.co/v1";
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

// Firma de integridad: SHA256(reference + amountInCents + currency + secret).
export function integritySignature(
  reference: string,
  amountInCents: number,
  currency = "COP"
): string {
  return crypto
    .createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${INTEGRITY_SECRET}`)
    .digest("hex");
}

// URL del Checkout Web de Wompi (redirección).
export function buildCheckoutUrl(opts: {
  reference: string;
  amountInCents: number;
  currency?: string;
  redirectUrl: string;
  customerEmail?: string;
}): string {
  const currency = opts.currency || "COP";
  const signature = integritySignature(opts.reference, opts.amountInCents, currency);
  // Construimos la query a mano: las llaves con dos puntos (signature:integrity,
  // customer-data:email) deben ir literales, no codificadas, como pide Wompi.
  const parts = [
    `public-key=${encodeURIComponent(WOMPI_PUBLIC_KEY)}`,
    `currency=${currency}`,
    `amount-in-cents=${opts.amountInCents}`,
    `reference=${encodeURIComponent(opts.reference)}`,
    `redirect-url=${encodeURIComponent(opts.redirectUrl)}`,
    `signature:integrity=${signature}`,
  ];
  if (opts.customerEmail) {
    parts.push(`customer-data:email=${encodeURIComponent(opts.customerEmail)}`);
  }
  return `https://checkout.wompi.co/p/?${parts.join("&")}`;
}

export interface WompiTransaction {
  id: string;
  status: "APPROVED" | "DECLINED" | "VOIDED" | "ERROR" | "PENDING";
  reference: string;
  amount_in_cents: number;
  currency: string;
  customer_email?: string;
}

// Consulta el estado de una transacción por su id.
export async function getTransaction(id: string): Promise<WompiTransaction | null> {
  try {
    const res = await fetch(`${wompiApiBase()}/transactions/${id}`, {
      headers: PRIVATE_KEY ? { Authorization: `Bearer ${PRIVATE_KEY}` } : {},
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as WompiTransaction;
  } catch {
    return null;
  }
}

// Verifica la firma del webhook de eventos de Wompi.
export function verifyEventSignature(event: {
  signature?: { checksum?: string; properties?: string[] };
  timestamp?: number;
  data?: Record<string, unknown>;
}): boolean {
  if (!EVENTS_SECRET) return true; // sin secreto configurado, no bloquea (sandbox)
  const checksum = event.signature?.checksum;
  const properties = event.signature?.properties || [];
  if (!checksum) return false;
  let concatenated = "";
  for (const path of properties) {
    concatenated += getByPath(event.data, path) ?? "";
  }
  concatenated += String(event.timestamp ?? "");
  const computed = crypto
    .createHash("sha256")
    .update(concatenated + EVENTS_SECRET)
    .digest("hex");
  return computed.toLowerCase() === checksum.toLowerCase();
}

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, k) => {
    if (acc && typeof acc === "object" && k in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[k];
    }
    return undefined;
  }, obj);
}
