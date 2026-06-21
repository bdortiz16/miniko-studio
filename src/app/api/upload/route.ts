import { NextResponse } from "next/server";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

export const maxDuration = 60;

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      {
        error:
          "La subida de fotos no está configurada (faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY).",
      },
      { status: 500 }
    );
  }

  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibió ninguna imagen." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen supera los 10 MB." }, { status: 400 });
  }
  if (file.type && !ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato no admitido. Usa JPG, PNG o WEBP." },
      { status: 400 }
    );
  }

  try {
    const safeName = (file.name || "foto").replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `pedidos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const bytes = new Uint8Array(await file.arrayBuffer());

    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(path, bytes, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });
    if (error) throw new Error(error.message);

    const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al subir la imagen.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
