import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Billetera: movimientos manuales (egresos/ingresos) para calcular el saldo real
// junto con el neto que entra por Wompi. Se guarda en Supabase (config/wallet.json).

export interface WalletMovement {
  id: string;
  date: number; // unix seg
  type: "egreso" | "ingreso";
  concept: string;
  amount: number; // pesos
}

const PATH = "config/wallet.json";

export async function listMovements(): Promise<WalletMovement[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).download(PATH);
  if (error || !data) return [];
  try {
    const arr = JSON.parse(await data.text());
    return Array.isArray(arr) ? (arr as WalletMovement[]) : [];
  } catch {
    return [];
  }
}

export async function saveMovements(list: WalletMovement[]): Promise<void> {
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
