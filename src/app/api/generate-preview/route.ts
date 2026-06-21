import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { supabaseAdmin, SUPABASE_BUCKET } from "@/lib/supabase";

export const maxDuration = 300;

// Cada estilo define el look completo (no fuerza Funko siempre).
const STYLE_PROMPT: Record<string, string> = {
  kawaii:
    "Turn the person in this photo into a classic FUNKO POP collectible vinyl figurine: very large oversized head, small short slim body, big round solid black dot eyes, simplified matte vinyl.",
  caricatura:
    "Turn the person in this photo into a DISNEY / PIXAR style 3D animated character figure: full-body stylized 3D cartoon, large expressive cartoon eyes, smooth polished 3D animation render. " +
    "Keep the person's REAL body proportions and slim figure from the photo — a stylized animated version of THIS person, NOT a generic chubby or rounded cartoon character.",
  realista:
    "Turn the person in this photo into a realistic COLLECTIBLE STATUE FIGURINE — a sculpted, hand-painted resin/PVC display figure of the person, with realistic human proportions, highly detailed and refined. It is an inanimate figurine OBJECT (like a high-end collectible statue), NOT a Funko, NOT a cartoon, NOT a big-head toy. " +
    "CRITICAL — FACE IDENTITY: the face must be an ACCURATE PORTRAIT of THIS exact person. Faithfully preserve their exact facial structure, face shape, eyes, nose, mouth, eyebrows, cheeks, jawline, facial hair/beard, skin tone, and any glasses or sunglasses and hat/cap exactly as in the photo. It must be unmistakably recognizable as the SAME individual, not a generic or different person.",
};

const COMMON_PROMPT =
  "Keep the SAME face and a clear, accurate, recognizable likeness of the person in the photo: same face shape, eyes, nose, mouth, eyebrows, cheeks, jawline, facial hair, same hairstyle, hair length and hair color, same skin tone, and keep their glasses/sunglasses or cap if they wear any — the face must be an accurate portrait of the SAME specific person, never a generic or different-looking character. " +
  "CRUCIAL — BODY: keep the person's EXACT real body type, build, weight and silhouette from the photo. If the person is slim/slender/skinny, the figure MUST be slim and slender, with a flat stomach, slim waist and slim arms and legs. Do NOT add weight, do NOT make the belly round, do NOT make them chubby, fat, thicker or heavier in ANY way. Match the body shape and waist precisely as in the photo. " +
  "IMPORTANT: the result is an INANIMATE collectible FIGURINE / sculpted statue OBJECT made of painted resin — a toy product, not a real person and not a real photograph of a person. This is safe, non-sexual product imagery. " +
  "Recreate the EXACT same outfit, clothing and colors the person is wearing in the photo, faithfully — including a swimsuit or bikini if that is what they wear (modest swimwear on a figurine, like any beach-themed collectible). Do not change their clothes. No nudity. " +
  "The figurine stands on a round display base, on a clean pure WHITE studio background. " +
  "Tall vertical frame, zoomed out: the whole figure is small and centered with generous margin on all sides, fully visible from head to the base, never cropped. " +
  "High quality product photo, soft studio lighting.";

// Prompts equivalentes para MASCOTAS (animales, no personas).
const PET_STYLE_PROMPT: Record<string, string> = {
  kawaii:
    "Turn the pet/animal in this photo into a classic FUNKO POP collectible vinyl figurine of the SAME animal: oversized big head, small body, big round solid black dot eyes, simplified matte vinyl.",
  caricatura:
    "Turn the pet/animal in this photo into a DISNEY / PIXAR style 3D animated character figure of the SAME animal: stylized cute cartoon with friendly proportions, large expressive eyes, smooth polished 3D animation render.",
  realista:
    "Turn the pet/animal in this photo into a PHOTOREALISTIC lifelike collectible statue of the SAME animal with realistic fur and detail. NOT a Funko, NOT a cartoon, NOT a big-head toy.",
};

const PET_COMMON_PROMPT =
  "Keep the SAME animal: same species, breed, fur/coat color, markings and distinctive features — it must clearly look like the SAME pet from the photo. " +
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
  let tipo = "persona";
  let index = 1;
  let total = 1;
  try {
    ({ photoUrl, styleId, tipo = "persona", index = 1, total = 1 } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const isPet = tipo === "mascota";
  // Si hay varios sujetos del mismo tipo en la foto, aislamos al número `index`.
  const subject = isPet ? "animal/pet" : "person";
  const isolate =
    total > 1
      ? `The photo contains ${total} ${subject}s. Create a figurine of ONLY ONE of them: the ${subject} number ${index} counting from LEFT to RIGHT in the photo. Show only that single ${subject} as one figurine; completely ignore and exclude the others. `
      : "";
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

    const prompt = isPet
      ? `${isolate}${PET_STYLE_PROMPT[styleId] ?? PET_STYLE_PROMPT.kawaii} ${PET_COMMON_PROMPT}`
      : `${isolate}${STYLE_PROMPT[styleId] ?? STYLE_PROMPT.kawaii} ${COMMON_PROMPT}`;
    const openai = new OpenAI({ apiKey });

    // El filtro de OpenAI a veces rechaza fotos al límite (p. ej. bikini) de
    // forma intermitente. Reintentamos un par de veces antes de rendirnos.
    async function tryGenerate(): Promise<string> {
      const result = await openai.images.edit({
        model: "gpt-image-1",
        image: file,
        prompt,
        size: "1024x1536",
        // moderation "low" reduce rechazos; el SDK aún no lo tipa.
        ...({ moderation: "low" } as object),
      });
      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error("La IA no devolvió una imagen.");
      return b64;
    }

    let outB64 = "";
    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        outB64 = await tryGenerate();
        break;
      } catch (e) {
        lastErr = e;
        const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
        const isModeration =
          msg.includes("moderation") ||
          msg.includes("safety") ||
          msg.includes("content policy") ||
          msg.includes("rejected") ||
          msg.includes("flagged") ||
          msg.includes("blocked");
        // Si no es un rechazo del filtro, no insistas.
        if (!isModeration && attempt > 0) break;
      }
    }
    if (!outB64) {
      const m = lastErr instanceof Error ? lastErr.message.toLowerCase() : "";
      const moderation =
        m.includes("moderation") || m.includes("safety") || m.includes("content policy") ||
        m.includes("rejected") || m.includes("flagged") || m.includes("blocked");
      throw new Error(
        moderation
          ? "El filtro de la IA rechazó la foto. Intenta de nuevo o usa una foto donde se vea bien el rostro."
          : "La IA no devolvió una imagen. Prueba con otra foto."
      );
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
