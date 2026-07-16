import { NextResponse } from "next/server";
import { verifyToken, isValidEmail } from "@/lib/verify";
import { listOrders, approvedSeqMap } from "@/lib/orders";
import { findPetByOrder, savePet, makePetToken, newPetId, Pet } from "@/lib/pets";

// Verifica correo + código + número de orden y abre (o crea) el perfil de la
// mascota ligado a ese pedido. Devuelve la mascota y un token de edición.
export async function POST(request: Request) {
  let body: { email?: string; code?: string; exp?: number; token?: string; orderNumber?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const email = (body.email || "").toLowerCase().trim();
  if (!isValidEmail(email)) return NextResponse.json({ error: "Correo no válido." }, { status: 400 });
  if (!verifyToken(email, body.code || "", body.exp || 0, body.token || "")) {
    return NextResponse.json({ error: "Código incorrecto o caducado." }, { status: 401 });
  }

  const num = (body.orderNumber || "").replace(/\D/g, "");
  if (!num) return NextResponse.json({ error: "Escribe tu número de orden (ej. 001)." }, { status: 400 });

  const all = await listOrders();
  const seqMap = approvedSeqMap(all);
  const order = all.find(
    (o) =>
      o.status === "APPROVED" &&
      (o.email || "").toLowerCase() === email &&
      String(seqMap.get(o.reference) || 0) === String(Number(num))
  );
  if (!order) {
    return NextResponse.json(
      { error: "No encontramos ese número de orden con tu correo. Revisa el número." },
      { status: 404 }
    );
  }

  // Busca la mascota ligada a ese pedido; si no existe, la crea vacía.
  let pet = await findPetByOrder(order.reference);
  if (!pet) {
    const now = Math.floor(Date.now() / 1000);
    pet = {
      id: newPetId(),
      ownerEmail: email,
      orderReference: order.reference,
      name: "",
      photo: "",
      species: "Perro",
      breed: "",
      ownerName: order.shipping?.name || "",
      ownerPhone: order.shipping?.phone || "",
      whatsapp: order.shipping?.phone || "",
      address: [order.shipping?.address, order.shipping?.city].filter(Boolean).join(", "),
      notes: "",
      reward: "",
      lost: false,
      createdAt: now,
      updatedAt: now,
    } as Pet;
    await savePet(pet);
  }

  const { token, exp } = makePetToken(pet.id);
  return NextResponse.json({ pet, editToken: token, editExp: exp });
}
