import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// La generación de imagen puede tardar; ampliamos el límite (requiere plan Pro).
export const maxDuration = 60;

const BASE_PROMPT =
  "Create a clean studio product photo of a Funko Pop style collectible vinyl figurine based on the person in the provided photo. " +
  "The figurine has an oversized head and a small stylized body, standing on a round display base, on a soft neutral white background. " +
  "Preserve the person's recognizable features: hairstyle and hair color, skin tone, facial hair, glasses if any, and the colors and style of their clothing. " +
  "Dress the figurine in tasteful everyday clothing. A single figurine, centered, high quality, soft studio lighting.";

const STYLE_PROMPT: Record<string, string> = {
  kawaii:
    "Style: cute kawaii chibi — extra-large head, big glossy sparkling eyes, tiny simplified nose, soft rounded shapes, gentle pastel tones, adorable expression.",
  realista:
    "Style: realistic premium collectible — finely detailed, accurate proportions, lifelike face sculpt and refined paintwork.",
  caricatura:
    "Style: fun exaggerated cartoon caricature — big expressive features, playful proportions, bold vibrant colors, full of personality.",
};

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "La IA no está configurada (falta GEMINI_API_KEY)." },
      { status: 500 }
    );
  }

  let photoUrl = "";
  let styleId = "";
  try {
    ({ photoUrl, styleId } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  if (!photoUrl) {
    return NextResponse.json({ error: "Falta la foto." }, { status: 400 });
  }

  try {
    // 1) Descargar la foto subida por el cliente.
    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) throw new Error("No se pudo leer la foto subida.");
    const inputMime = imgRes.headers.get("content-type") || "image/jpeg";
    const inputB64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");

    // 2) Generar la figura con Gemini 2.5 Flash Image (Nano Banana).
    const prompt = `${BASE_PROMPT} ${STYLE_PROMPT[styleId] ?? ""}`;
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: [
        { text: prompt },
        { inlineData: { mimeType: inputMime, data: inputB64 } },
      ],
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      throw new Error("La IA no devolvió una imagen. Prueba con otra foto.");
    }
    const outB64 = imagePart.inlineData.data;

    // 3) Guardar el resultado en Supabase y devolver su URL pública.
    if (supabaseAdmin) {
      const path = `previews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      const { error } = await supabaseAdmin.storage
        .from(SUPABASE_BUCKET)
        .upload(path, Buffer.from(outB64, "base64"), {
          contentType: "image/png",
          upsert: false,
        });
      if (!error) {
        const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
        return NextResponse.json({ url: data.publicUrl });
      }
    }

    // Fallback: devolver la imagen embebida si Supabase no está disponible.
    return NextResponse.json({ url: `data:image/png;base64,${outB64}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar la figura.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
