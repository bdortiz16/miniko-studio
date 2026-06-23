import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listOrders, approvedSeqMap, shortRef } from "@/lib/orders";

// Lista los pedidos pagados (APPROVED) desde nuestro almacén para el panel.
export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  try {
    const all = await listOrders();
    const seqMap = approvedSeqMap(all);
    const orders = all
      .filter((o) => o.status === "APPROVED")
      .map((o) => ({
        id: o.reference,
        numero: shortRef(seqMap.get(o.reference)),
        created: o.paidAt || o.createdAt,
        email: o.email,
        amount: o.amount,
        currency: o.currency,
        tipo: o.tipo,
        composicion: o.composicion,
        estilo: o.estilo,
        styleId: o.styleId,
        tamano: o.composicion,
        personas: String(o.personas),
        personasNum: o.personas || 0,
        mascotasNum: o.mascotas || 0,
        envio_nombre: o.shipping?.name || "",
        envio_telefono: o.shipping?.phone || "",
        envio_departamento: o.shipping?.department || "",
        envio_direccion: [
          o.shipping?.address,
          o.shipping?.reference,
          o.shipping?.city,
          o.shipping?.department,
          o.shipping?.zip,
          o.shipping?.country,
        ]
          .filter(Boolean)
          .join(", "),
        fotos: o.photoUrls || [],
        figuras_ia: o.previewUrls || [],
        fulfillment: o.fulfillment || "RECIBIDO",
        carrier: o.carrier || "",
        tracking: o.tracking || "",
        labelUrl: o.labelUrl || "",
        adminNote: o.adminNote || "",
      }));
    return NextResponse.json({ orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al listar pedidos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
