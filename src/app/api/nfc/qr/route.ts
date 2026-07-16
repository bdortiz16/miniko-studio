import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { getPet } from "@/lib/pets";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://miniko.com.co";

// Devuelve el QR (PNG en base64) que apunta a la página pública de la mascota.
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const pet = await getPet(id);
  if (!pet) return NextResponse.json({ error: "Mascota no encontrada." }, { status: 404 });

  const url = `${SITE_URL}/p/${pet.id}`;
  try {
    const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2, color: { dark: "#111111", light: "#ffffff" } });
    return NextResponse.json({ url, dataUrl });
  } catch {
    return NextResponse.json({ error: "No se pudo generar el QR." }, { status: 500 });
  }
}
