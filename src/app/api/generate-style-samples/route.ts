import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Genera las 3 imágenes de ejemplo de los estilos (mismo personaje, distinto
// estilo) y las guarda en Supabase en rutas fijas: samples/<estilo>.png
// Llámala UNA vez desde el navegador. Cuesta ~$0.45 en OpenAI (3 imágenes).
export const maxDuration = 120;

// Mismo personaje en los 3 estilos para que se vea solo el cambio de estilo.
const CHARACTER =
  "the same friendly young adult character: medium-length wavy dark-brown hair, " +
  "warm light-tan skin, wearing a casual sky-blue t-shirt and beige trousers with white sneakers";

const BASE = (styleLine: string) =>
  `Studio product photo of a collectible figurine of ${CHARACTER}. ` +
  `Single full-body figurine standing on a round display base, centered, soft neutral light-gray studio background, high quality. ${styleLine}`;

const STYLE_LINES: Record<string, string> = {
  kawaii:
    "Funko Pop / kawaii style: large oversized head with a small, slim, petite body, big round glossy black eyes, cute minimal face.",
  realista:
    "Realistic premium collectible style: lifelike proportions, detailed face sculpt and refined paintwork.",
  caricatura:
    "Stylized 3D cartoon (Pixar-like) style: big expressive friendly face, playful proportions, vibrant colors.",
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

  try {
    const ids = Object.keys(STYLE_LINES);
    const urls = await Promise.all(ids.map(makeOne));
    const result = Object.fromEntries(ids.map((id, i) => [id, urls[i]]));
    return NextResponse.json({ ok: true, samples: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al generar.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
