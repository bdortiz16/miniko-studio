import { createClient } from "@supabase/supabase-js";

// Cliente de Supabase del lado servidor (usa la service role key para subir
// archivos). Si no hay configuración, queda null y la API responde con un
// error claro en vez de romperse.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Acepta tanto la clave secreta nueva (sb_secret_...) como la legacy service_role.
const serviceKey =
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseAdmin =
  url && serviceKey
    ? createClient(url, serviceKey, {
        auth: { persistSession: false },
      })
    : null;

export const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "pedidos";
