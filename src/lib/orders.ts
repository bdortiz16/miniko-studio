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
  previewUrls?: string[]; // una vista previa IA por figura
  shipping: {
    name?: string;
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
  };
  transactionId?: string;
  // Seguimiento (lo edita el admin):
  fulfillment?: FulfillmentStatus; // estado de preparación/envío
  carrier?: string; // transportadora (Servientrega, Coordinadora…)
  tracking?: string; // número de guía
  adminNote?: string; // nota opcional visible al cliente
}

// Estado de preparación del pedido (independiente del estado de pago).
export type FulfillmentStatus = "RECIBIDO" | "EN_PRODUCCION" | "ENVIADO" | "ENTREGADO";
export const FULFILLMENT_LABELS: Record<FulfillmentStatus, string> = {
  RECIBIDO: "Pedido recibido",
  EN_PRODUCCION: "En producción",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
};

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

// Pedidos pagados (APPROVED) de un correo, para la zona "Mis pedidos".
export async function listOrdersByEmail(email: string): Promise<Order[]> {
  const e = email.toLowerCase().trim();
  const all = await listOrders();
  return all.filter((o) => o.status === "APPROVED" && (o.email || "").toLowerCase() === e);
}

// Actualiza los campos de seguimiento de un pedido (lo usa el admin).
export async function updateOrderFulfillment(
  reference: string,
  fields: { fulfillment?: FulfillmentStatus; carrier?: string; tracking?: string; adminNote?: string }
): Promise<Order | null> {
  const order = await getOrder(reference);
  if (!order) return null;
  if (fields.fulfillment) order.fulfillment = fields.fulfillment;
  if (fields.carrier !== undefined) order.carrier = fields.carrier;
  if (fields.tracking !== undefined) order.tracking = fields.tracking;
  if (fields.adminNote !== undefined) order.adminNote = fields.adminNote;
  await saveOrder(order);
  return order;
}
