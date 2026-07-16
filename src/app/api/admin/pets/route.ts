import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin-auth";
import { listPets, deletePet } from "@/lib/pets";

export async function GET(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  return NextResponse.json({ pets: await listPets() });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  const id = new URL(request.url).searchParams.get("id") || "";
  await deletePet(id);
  return NextResponse.json({ ok: true });
}
