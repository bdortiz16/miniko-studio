import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Almacén de pedidos en Supabase Storage (un JSON por pedido en orders/).
// Reemplaza la lectura de pedidos desde la pasarela: ahora la fuente de la
// verdad es nuestro propio almacén, que se actualiza con el webhook de Wompi.

export type OrderStatus = "PENDING" | "APPROVED" | "DECLINED" | "VOIDED" | "ERROR";

export interface Order {
  reference: string;
  status: OrderStatus;
  createdAt: number; // unix segundos
  paidAt?: number;
  email: string;
  amount: number; // en centavos
  currency: string;
  styleId: string;
  estilo: string;
  composicion: string;
  tipo: string;
  personas: number;
  mascotas: number;
  photoUrls: string[];
  previewUrl?: string | null;
  shipping: {
    name?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
  };
  transactionId?: string;
}

const DIR = "orders";

function path(reference: string): string {
  return `${DIR}/${reference}.json`;
}

export async function saveOrder(order: Order): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase no está configurado.");
  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(path(order.reference), Buffer.from(JSON.stringify(order, null, 2)), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

export async function getOrder(reference: string): Promise<Order | null> {
  if (!supabaseAdmin) return null;
  const { data, error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .download(path(reference));
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as Order;
  } catch {
    return null;
  }
}

export async function updateOrderStatus(
  reference: string,
  status: OrderStatus,
  transactionId?: string
): Promise<Order | null> {
  const order = await getOrder(reference);
  if (!order) return null;
  order.status = status;
  if (transactionId) order.transactionId = transactionId;
  if (status === "APPROVED" && !order.paidAt) order.paidAt = Math.floor(Date.now() / 1000);
  await saveOrder(order);
  return order;
}

export async function listOrders(): Promise<Order[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .list(DIR, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
  if (error || !data) return [];
  const files = data.filter((f) => f.name.endsWith(".json"));
  const orders = await Promise.all(
    files.map(async (f) => {
      const { data: blob } = await supabaseAdmin!.storage
        .from(SUPABASE_BUCKET)
        .download(`${DIR}/${f.name}`);
      if (!blob) return null;
      try {
        return JSON.parse(await blob.text()) as Order;
      } catch {
        return null;
      }
    })
  );
  return orders
    .filter((o): o is Order => o !== null)
    .sort((a, b) => b.createdAt - a.createdAt);
}
