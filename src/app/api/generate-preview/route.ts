import { NextResponse } from "next/server";
import Replicate from "replicate";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// PhotoMaker (Replicate) preserva la identidad/cara de la persona mucho mejor.
export const maxDuration = 300;

const STYLE: Record<string, { style_name: string; desc: string }> = {
  // Funko Pop
  kawaii: {
    style_name: "(No style)",
    desc: "as an adorable Funko Pop style collectible vinyl figurine with a big oversized head and big round solid black eyes",
  },
  // Disney
  caricatura: {
    style_name: "Disney Character",
    desc: "as a Disney Pixar style 3D animated character figure",
  },
  // Realista
  realista: {
    style_name: "Photographic (Default)",
    desc: "as a realistic detailed premium collectible figure",
  },
};

export async function POST(request: Request) {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "La IA no está configurada (falta REPLICATE_API_TOKEN)." },
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

  const cfg = STYLE[styleId] ?? STYLE.kawaii;

  try {
    const replicate = new Replicate({ auth: token, useFileOutput: false });

    // Obtenemos la última versión del modelo para no fijar un hash que caduca.
    const model = await replicate.models.get("tencentarc", "photomaker");
    const version = model.latest_version?.id;
    if (!version) throw new Error("No se pudo cargar el modelo de IA.");

    const output = (await replicate.run(`tencentarc/photomaker:${version}`, {
      input: {
        input_image: photoUrl,
        prompt: `a person img ${cfg.desc}, wearing the same outfit and clothing as in the reference photo, keep the same slim body shape and build as the reference, full body, clean soft studio background, high quality`,
        negative_prompt:
          "nude, naked, topless, explicit, nsfw, lowres, deformed, bad anatomy, extra limbs, obese, overweight, watermark, text",
        style_name: cfg.style_name,
        num_steps: 40,
        style_strength_ratio: 25,
        num_outputs: 1,
        guidance_scale: 5,
      },
    })) as unknown;

    const first = Array.isArray(output) ? output[0] : output;
    const url = first ? String(first) : "";
    if (!url || !url.startsWith("http")) {
      throw new Error("La IA no devolvió una imagen. Prueba con otra foto.");
    }

    // Guardamos el resultado en Supabase (las URLs de Replicate caducan).
    try {
      const imgRes = await fetch(url);
      if (imgRes.ok && supabaseAdmin) {
        const buf = Buffer.from(await imgRes.arrayBuffer());
        const path = `previews/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const { error } = await supabaseAdmin.storage
          .from(SUPABASE_BUCKET)
          .upload(path, buf, { contentType: "image/png", upsert: false });
        if (!error) {
          const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
          return NextResponse.json({ url: data.publicUrl });
        }
      }
    } catch {
      /* si falla el guardado, devolvemos la URL temporal de Replicate */
    }

    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar la figura.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
