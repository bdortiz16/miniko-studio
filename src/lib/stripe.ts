import Stripe from "stripe";

const key = process.env.STRIPE_SECRET_KEY;

// Cliente de Stripe del lado servidor. Si no hay clave configurada, la API
// devolverá un error claro en lugar de fallar al cargar el módulo.
export const stripe = key
  ? new Stripe(key, { apiVersion: "2024-12-18.acacia" })
  : null;

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
