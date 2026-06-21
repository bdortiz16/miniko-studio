import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

export const maxDuration = 300;

// Cada estilo define el look completo (no fuerza Funko siempre).
const STYLE_PROMPT: Record<string, string> = {
  kawaii:
    "Turn the person in this photo into a classic FUNKO POP collectible vinyl figurine: very large oversized head, small short slim body, big round solid black dot eyes, simplified matte vinyl.",
  caricatura:
    "Turn the person in this photo into a DISNEY / PIXAR style 3D animated character figure: full-body stylized cartoon with friendly proportions, large expressive cartoon eyes, smooth polished 3D animation render.",
  realista:
    "Turn the person in this photo into a PHOTOREALISTIC lifelike collectible statue figure with realistic human proportions, highly detailed and refined. NOT a Funko, NOT a cartoon, NOT a big-head toy.",
};

const COMMON_PROMPT =
  "Keep the SAME face and exact likeness of the person in the photo: same face shape, eyes, nose, mouth, eyebrows and hairstyle — it must clearly look like the SAME person. " +
  "Keep the person's REAL body type, build and weight from the photo (if slim, keep slim; do NOT make them chubby or heavier). " +
  "Keep the person's outfit if it is normal everyday clothing; but if they are wearing swimwear, a bikini, underwear or very revealing clothing, dress the figure in tasteful casual everyday clothes instead. Never depict swimwear or revealing outfits. " +
  "The figurine stands on a round display base, on a clean pure WHITE studio background. " +
  "Tall vertical frame, zoomed out: the whole figure is small and centered with generous margin on all sides, fully visible from head to the base, never cropped. " +
  "High quality product photo, soft studio lighting.";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "La IA no está configurada (falta OPENAI_API_KEY)." },
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
    const imgRes = await fetch(photoUrl);
    if (!imgRes.ok) throw new Error("No se pudo leer la foto subida.");
    const inputMime = imgRes.headers.get("content-type") || "image/png";
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const ext = inputMime.includes("png") ? "png" : inputMime.includes("webp") ? "webp" : "jpg";
    const file = await toFile(buffer, `foto.${ext}`, { type: inputMime });

    const prompt = `${STYLE_PROMPT[styleId] ?? STYLE_PROMPT.kawaii} ${COMMON_PROMPT}`;
    const openai = new OpenAI({ apiKey });
    const result = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt,
      size: "1024x1536",
      // moderation "low" reduce rechazos en fotos al límite; el SDK aún no lo tipa.
      ...({ moderation: "low" } as object),
    });

    const outB64 = result.data?.[0]?.b64_json;
    if (!outB64) {
      throw new Error("La IA no devolvió una imagen. Prueba con otra foto.");
    }

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

    return NextResponse.json({ url: `data:image/png;base64,${outB64}` });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar la figura.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
