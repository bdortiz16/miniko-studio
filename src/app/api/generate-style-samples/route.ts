import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

// Genera las 3 imágenes de ejemplo de los estilos (mismo personaje, distinto
// estilo) y las guarda en Supabase en rutas fijas: samples/<estilo>.png
// Llámala UNA vez desde el navegador. Cuesta ~$0.45 en OpenAI (3 imágenes).
export const maxDuration = 120;

// Descripción del juguete (no una persona real) — el mismo personaje-mascota
// de ejemplo en los 3 estilos, para que solo se vea el cambio de estilo.
// EXACTAMENTE el mismo personaje en los 3 estilos (solo cambia el render).
const CHARACTER =
  "the SAME single young man character: short curly light-brown hair, " +
  "wearing an olive-green field jacket over a blue-and-white striped shirt, " +
  "brown trousers and brown leather boots, holding a small closed laptop in one hand";

const BASE = (styleLine: string, bgLine: string) =>
  `Full-body product photo, the ENTIRE figure visible head to feet, centered with generous margin so it fits in frame. ` +
  `${bgLine} ${styleLine} The character: ${CHARACTER}.`;

const GRAY_BG = "Clean soft light-gray studio background.";
const NO_BG = "Isolated on a fully transparent background (no background at all, clean cut-out), nothing behind the figure.";

const STYLE_LINES: Record<string, string> = {
  // Funko Pop
  kawaii:
    "A classic FUNKO POP collectible vinyl figurine: very large oversized head, small short body, big round solid black dot eyes, simplified matte vinyl, standing on a round white display base.",
  // Disney
  caricatura:
    "A DISNEY / PIXAR style 3D animated character figure: stylized full-body cartoon with friendly proportions, large expressive cartoon eyes, smooth polished 3D animation render, standing.",
  // Realista
  realista:
    "A PHOTOREALISTIC lifelike statue of the character, real photograph quality: realistic skin texture, realistic hair and realistic fabric, ultra-detailed and refined, studio photography. NOT cartoon, NOT stylized, NOT a toy — looks like a real high-end lifelike figure, full body standing.",
};

// Fondo por estilo: Funko y Disney en gris; Realista en transparente.
const STYLE_BG: Record<string, string> = {
  kawaii: GRAY_BG,
  caricatura: GRAY_BG,
  realista: NO_BG,
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
      prompt: BASE(STYLE_LINES[styleId], STYLE_BG[styleId]),
      size: "1024x1024",
      // Realista con fondo transparente; los demás opacos.
      background: styleId === "realista" ? "transparent" : "opaque",
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

  // ?style=realista genera solo ese estilo (sin tocar los demás).
  const only = new URL(request.url).searchParams.get("style");
  const ids = only && STYLE_LINES[only] ? [only] : Object.keys(STYLE_LINES);
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
