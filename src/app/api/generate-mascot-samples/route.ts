import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin-auth";

// Genera las figuras de ejemplo de MASCOTAS y las guarda en Supabase:
// mascots/dog.png (perro Funko Pop), mascots/cat.png (gato Disney),
// mascots/dogreal.png (perro realista). ~$0.45 en OpenAI (3 imágenes).
export const maxDuration = 300;

const FRAME =
  "Full-body product photo in a TALL VERTICAL frame. The ENTIRE figure is fully visible from top to bottom " +
  "with empty padding above and below, occupying the central ~70% of the frame, never cropped. " +
  "Isolated on a fully transparent background (clean cut-out), nothing behind the figure. ";

const MASCOTS: Record<string, string> = {
  // Perro estilo Funko Pop
  dog:
    FRAME +
    "A classic FUNKO POP collectible vinyl figurine of a CUTE PUPPY DOG: oversized big head, small body, " +
    "big round solid black dot eyes, simplified matte vinyl, golden-and-white fur, standing on a round white display base.",
  // Gato estilo Disney
  cat:
    FRAME +
    "A DISNEY / PIXAR style 3D animated character figure of a CUTE FLUFFY CAT: stylized cartoon with friendly " +
    "proportions, large expressive cartoon eyes, smooth polished 3D animation render, orange tabby fur, sitting.",
  // Perro realista
  dogreal:
    FRAME +
    "A PHOTOREALISTIC lifelike statue of a REAL DOG (golden retriever): realistic fur texture and detail, " +
    "ultra-detailed, studio photography quality. NOT cartoon, NOT a toy. Full body from head to paws, nothing cut off.",
};

export async function GET(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 500 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Falta configuración de Supabase." }, { status: 500 });
  }
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const openai = new OpenAI({ apiKey });

  async function makeOne(id: string) {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: MASCOTS[id],
      size: "1024x1536",
      background: "transparent",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error(`Sin imagen para ${id}`);
    const path = `mascots/${id}.png`;
    const { error } = await supabaseAdmin!.storage
      .from(SUPABASE_BUCKET)
      .upload(path, Buffer.from(b64, "base64"), {
        contentType: "image/png",
        upsert: true,
        cacheControl: "0",
      });
    if (error) throw new Error(`${id}: ${error.message}`);
    const { data } = supabaseAdmin!.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  const only = new URL(request.url).searchParams.get("id");
  const ids = only && MASCOTS[only] ? [only] : Object.keys(MASCOTS);
  const settled = await Promise.allSettled(ids.map(makeOne));
  const samples: Record<string, string> = {};
  const errors: Record<string, string> = {};
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") samples[ids[i]] = r.value;
    else errors[ids[i]] = r.reason instanceof Error ? r.reason.message : "error";
  });

  const ok = Object.keys(samples).length > 0;
  return NextResponse.json(
    { ok, samples, errors: Object.keys(errors).length ? errors : undefined },
    { status: ok ? 200 : 500 }
  );
}
