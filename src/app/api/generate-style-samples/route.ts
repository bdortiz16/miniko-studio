import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Genera las 3 imágenes de ejemplo de los estilos (mismo personaje, distinto
// estilo) y las guarda en Supabase en rutas fijas: samples/<estilo>.png
// Llámala UNA vez desde el navegador. Cuesta ~$0.45 en OpenAI (3 imágenes).
export const maxDuration = 120;

// Descripción del juguete (no una persona real) — el mismo personaje-mascota
// de ejemplo en los 3 estilos, para que solo se vea el cambio de estilo.
const CHARACTER =
  "a cute fictional cartoon mascot toy character with brown hair, " +
  "wearing a blue t-shirt and beige pants and white sneakers, " +
  "holding a small CLOSED laptop (shut flat like a notebook) as an accessory";

const BASE = (styleLine: string) =>
  `Product photography of a small handmade collectible vinyl TOY figurine (a sculpted toy, NOT a real person) of ${CHARACTER}. ` +
  `A single toy figurine standing on a round display base, the ENTIRE figurine fully visible from head to base with generous empty margin around it (zoomed-out catalog product shot), ` +
  `centered, soft neutral light-gray studio background. ${styleLine}`;

const STYLE_LINES: Record<string, string> = {
  // Funko Pop
  kawaii:
    "Style: classic Funko Pop vinyl figurine — large oversized square-ish head, small slim petite body, big round solid black eyes, minimal face.",
  // Disney
  caricatura:
    "Style: Disney / Pixar 3D animated movie character look — polished 3D animation style, big expressive friendly eyes, warm charming smile, soft rounded shapes, cinematic.",
  // Realista
  realista:
    "Style: realistic detailed hand-painted collectible toy figurine with neat proportions and refined paintwork — but still clearly a small sculpted vinyl TOY on a base, NOT a photo of a real human; shown small with plenty of margin so the whole toy fits in frame.",
};

export async function GET(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 500 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Falta configuración de Supabase." }, { status: 500 });
  }
  // Protección opcional: si AUTH_SECRET está definido, exige ?token=...
  const required = process.env.AUTH_SECRET;
  const token = new URL(request.url).searchParams.get("token");
  if (required && token !== required) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const openai = new OpenAI({ apiKey });

  async function makeOne(styleId: string) {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: BASE(STYLE_LINES[styleId]),
      size: "1024x1024",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error(`Sin imagen para ${styleId}`);
    const { error } = await supabaseAdmin!.storage
      .from(SUPABASE_BUCKET)
      .upload(`samples/${styleId}.png`, Buffer.from(b64, "base64"), {
        contentType: "image/png",
        upsert: true,
      });
    if (error) throw new Error(`${styleId}: ${error.message}`);
    const { data } = supabaseAdmin!.storage
      .from(SUPABASE_BUCKET)
      .getPublicUrl(`samples/${styleId}.png`);
    return data.publicUrl;
  }

  const ids = Object.keys(STYLE_LINES);
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
