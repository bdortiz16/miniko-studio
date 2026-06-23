import { NextResponse } from "next/server";
import OpenAI from "openai";
import { isAdmin } from "@/lib/admin-auth";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";
import { getSettings, defaultSettings, SETTINGS_PATH, Settings } from "@/lib/settings";

export const maxDuration = 120;

const PROMPTS = {
  whatsapp:
    "A cute Funko Pop style collectible vinyl figurine mascot, big head, small body, big round solid black eyes, wearing a bright GREEN WhatsApp t-shirt with the white WhatsApp phone logo on the chest, friendly happy smile, full body standing, centered, isolated on a fully transparent background, clean product render.",
  support:
    "A cute Funko Pop style collectible vinyl figurine mascot, big head, small body, big round solid black eyes, wearing a customer-support headset with microphone, waving hello with one hand, friendly, full body standing, centered, isolated on a fully transparent background, clean product render.",
};

async function genImage(openai: OpenAI, prompt: string): Promise<Buffer> {
  const result = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024",
    ...({ background: "transparent", output_format: "png", quality: "medium" } as object),
  });
  const b64 = result.data?.[0]?.b64_json;
  if (!b64) throw new Error("La IA no devolvió imagen.");
  return Buffer.from(b64, "base64");
}

async function upload(path: string, buf: Buffer): Promise<string> {
  if (!supabaseAdmin) throw new Error("Supabase no configurado.");
  const { error } = await supabaseAdmin.storage
    .from(SUPABASE_BUCKET)
    .upload(path, buf, { contentType: "image/png", upsert: true, cacheControl: "3600" });
  if (error) throw new Error(error.message);
  const { data } = supabaseAdmin.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function POST(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 500 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json({ error: "Falta configurar Supabase." }, { status: 500 });
  }

  try {
    const openai = new OpenAI({ apiKey });
    const [wa, sup] = await Promise.all([
      genImage(openai, PROMPTS.whatsapp),
      genImage(openai, PROMPTS.support),
    ]);
    const whatsappIcon = await upload("icons/whatsapp-funko.png", wa);
    const supportIcon = await upload("icons/support-funko.png", sup);

    // Guarda las URLs en la configuración (conservando lo demás).
    const current = await getSettings().catch(() => defaultSettings());
    const next: Settings = { ...current, whatsappIcon, supportIcon };
    const { error } = await supabaseAdmin.storage
      .from(SUPABASE_BUCKET)
      .upload(SETTINGS_PATH, Buffer.from(JSON.stringify(next, null, 2)), {
        contentType: "application/json",
        upsert: true,
        cacheControl: "0",
      });
    if (error) throw new Error(error.message);

    return NextResponse.json({ whatsappIcon, supportIcon });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudieron generar los íconos.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
