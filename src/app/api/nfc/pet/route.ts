import { NextResponse } from "next/server";
import { getPet, savePet, verifyPetToken } from "@/lib/pets";

// El dueño guarda los cambios de su mascota (autorizado con el token de edición).
export async function POST(request: Request) {
  let body: {
    id?: string;
    editToken?: string;
    editExp?: number;
    name?: string;
    photo?: string;
    species?: string;
    breed?: string;
    ownerName?: string;
    ownerPhone?: string;
    whatsapp?: string;
    address?: string;
    notes?: string;
    reward?: string;
    lost?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const id = body.id || "";
  if (!verifyPetToken(id, body.editExp || 0, body.editToken || "")) {
    return NextResponse.json({ error: "Sesión de edición vencida. Vuelve a entrar." }, { status: 401 });
  }

  const pet = await getPet(id);
  if (!pet) return NextResponse.json({ error: "Mascota no encontrada." }, { status: 404 });

  const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
  pet.name = str(body.name, 40);
  pet.photo = str(body.photo, 500);
  pet.species = str(body.species, 20) || "Perro";
  pet.breed = str(body.breed, 40);
  pet.ownerName = str(body.ownerName, 60);
  pet.ownerPhone = str(body.ownerPhone, 20);
  pet.whatsapp = str(body.whatsapp, 20);
  pet.address = str(body.address, 120);
  pet.notes = str(body.notes, 400);
  pet.reward = str(body.reward, 60);
  pet.lost = !!body.lost;
  pet.updatedAt = Math.floor(Date.now() / 1000);

  await savePet(pet);
  return NextResponse.json({ ok: true, pet });
}
