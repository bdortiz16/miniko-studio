import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin-auth";

// Genera una galería de figuras variadas (Funko Pop y Disney) para el carrusel
// que se actualiza solo. Se guardan en Supabase: gallery/1.png ... gallery/N.png
export const maxDuration = 300;

const BASE =
  "Product photo of a single collectible figurine, full body from head to base, " +
  "fully visible and centered with margin, isolated on a fully transparent background (no background). ";

const ITEMS = [
  "A classic FUNKO POP vinyl figurine of a young man with glasses and a hoodie holding a coffee cup, big head, big round black eyes.",
  "A DISNEY / PIXAR 3D animated style figurine of a smiling young woman with a small dog, expressive eyes.",
  "A classic FUNKO POP vinyl figurine of a girl with a ponytail holding a soccer ball, big head, big round black eyes.",
  "A DISNEY / PIXAR 3D animated style figurine of a friendly bearded man with headphones.",
  "A classic FUNKO POP vinyl figurine of a woman with curly hair holding a cat, big head, big round black eyes.",
  "A DISNEY / PIXAR 3D animated style figurine of a happy boy with a backpack and a cap.",
];

export async function GET(request: Request) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 500 });
  if (!supabaseAdmin) return NextResponse.json({ error: "Falta Supabase." }, { status: 500 });

  const openai = new OpenAI({ apiKey });

  async function makeOne(index: number) {
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt: BASE + ITEMS[index],
      size: "1024x1536",
      background: "transparent",
    });
    const b64 = result.data?.[0]?.b64_json;
    if (!b64) throw new Error(`Sin imagen ${index + 1}`);
    const path = `gallery/${index + 1}.png`;
    const { error } = await supabaseAdmin!.storage
      .from(SUPABASE_BUCKET)
      .upload(path, Buffer.from(b64, "base64"), {
        contentType: "image/png",
        upsert: true,
        cacheControl: "0",
      });
    if (error) throw new Error(error.message);
    const { data } = supabaseAdmin!.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
    return data.publicUrl;
  }

  const settled = await Promise.allSettled(ITEMS.map((_, i) => makeOne(i)));
  const urls: string[] = [];
  const errors: string[] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") urls.push(r.value);
    else errors.push(`${i + 1}: ${r.reason instanceof Error ? r.reason.message : "error"}`);
  });

  return NextResponse.json(
    { ok: urls.length > 0, count: urls.length, urls, errors: errors.length ? errors : undefined },
    { status: urls.length > 0 ? 200 : 500 }
  );
}
