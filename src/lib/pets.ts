import crypto from "crypto";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Perfil de mascota para la placa NFC/QR. El dueño lo edita (zona privada) y,
// si se pierde, quien encuentre al animal escanea el QR/NFC y ve el contacto.
export interface Pet {
  id: string; // slug corto para la URL pública /p/{id} (no adivinable)
  ownerEmail: string;
  orderReference: string;
  name: string;
  photo: string;
  species: string; // Perro, Gato…
  breed: string;
  ownerName: string;
  ownerPhone: string; // para llamar
  whatsapp: string; // para escribir por WhatsApp
  address: string;
  notes: string; // salud, alergias, carácter
  reward: string; // recompensa opcional
  lost: boolean; // el dueño lo marca si se pierde
  createdAt: number;
  updatedAt: number;
}

const DIR = "pets";
const path = (id: string) => `${DIR}/${id}.json`;

function secret(): string {
  return process.env.AUTH_SECRET || process.env.WOMPI_INTEGRITY_SECRET || "miniko-dev-secret";
}

// Datos que ve el PÚBLICO al escanear (sin el correo del dueño).
export type PublicPet = Omit<Pet, "ownerEmail" | "orderReference">;
export function toPublic(p: Pet): PublicPet {
  const { ownerEmail: _e, orderReference: _o, ...rest } = p;
  void _e; void _o;
  return rest;
}

export function newPetId(): string {
  return `mk${crypto.randomBytes(5).toString("hex")}`;
}

export async function getPet(id: string): Promise<Pet | null> {
  if (!supabaseAdmin || !id) return null;
  const { data, error } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).download(path(id));
  if (error || !data) return null;
  try {
    return JSON.parse(await data.text()) as Pet;
  } catch {
    return null;
  }
}

export async function savePet(pet: Pet): Promise<void> {
  if (!supabaseAdmin) throw new Error("Supabase no configurado.");
  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(path(pet.id), Buffer.from(JSON.stringify(pet, null, 2)), {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });
  if (error) throw new Error(error.message);
}

export async function listPets(): Promise<Pet[]> {
  if (!supabaseAdmin) return [];
  const { data } = await supabaseAdmin.storage.from(SUPABASE_BUCKET).list(DIR, { limit: 1000 });
  if (!data) return [];
  const files = data.filter((f) => f.name.endsWith(".json"));
  const pets = await Promise.all(
    files.map(async (f) => {
      const { data: blob } = await supabaseAdmin!.storage.from(SUPABASE_BUCKET).download(`${DIR}/${f.name}`);
      if (!blob) return null;
      try { return JSON.parse(await blob.text()) as Pet; } catch { return null; }
    })
  );
  return pets.filter((p): p is Pet => p !== null).sort((a, b) => b.createdAt - a.createdAt);
}

// Busca la mascota ligada a un pedido concreto (para no duplicar).
export async function findPetByOrder(reference: string): Promise<Pet | null> {
  return (await listPets()).find((p) => p.orderReference === reference) || null;
}

// Crea (si no existe) la mascota vacía ligada a un pedido, para que el admin
// tenga la URL desde que entra el pedido y pueda grabar el NFC antes de enviar.
export async function ensurePetForOrder(order: {
  reference: string;
  email?: string;
  shipping?: { name?: string; phone?: string; address?: string; city?: string };
}): Promise<Pet> {
  const existing = await findPetByOrder(order.reference);
  if (existing) return existing;
  const now = Math.floor(Date.now() / 1000);
  const pet: Pet = {
    id: newPetId(),
    ownerEmail: (order.email || "").toLowerCase(),
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
  };
  await savePet(pet);
  return pet;
}

export async function deletePet(id: string): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.storage.from(SUPABASE_BUCKET).remove([path(id)]);
}

// Token de edición firmado, emitido tras verificar correo + código + orden.
function sign(petId: string, exp: number): string {
  return crypto.createHmac("sha256", secret()).update(`pet:${petId}:${exp}`).digest("hex");
}
export function makePetToken(petId: string): { token: string; exp: number } {
  const exp = Date.now() + 2 * 60 * 60 * 1000; // 2 horas para editar
  return { token: sign(petId, exp), exp };
}
export function verifyPetToken(petId: string, exp: number, token: string): boolean {
  if (!petId || !exp || !token || Date.now() > exp) return false;
  const expected = sign(petId, exp);
  if (expected.length !== token.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token)); } catch { return false; }
}
