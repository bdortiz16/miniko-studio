import { NextResponse } from "next/server";
import OpenAI from "openai";

// Detecta cuántas PERSONAS y cuántas MASCOTAS hay en las fotos subidas, para
// calcular automáticamente cuántas figuras lleva el pedido (sin preguntar).
export const maxDuration = 60;

const MAX = 8; // máximo de personas/mascotas por pedido

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 500 });
  }

  let photoUrls: string[] = [];
  try {
    ({ photoUrls = [] } = await request.json());
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }
  const urls = photoUrls.filter((u) => typeof u === "string" && /^https?:\/\//.test(u)).slice(0, 8);
  if (urls.length === 0) {
    return NextResponse.json({ error: "Faltan fotos." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  async function countOne(url: string): Promise<{ people: number; pets: number }> {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Look at this photo. Count the number of distinct REAL HUMAN people and the number of REAL PETS/animals (dogs, cats, etc.). " +
                "Only count actual people or animals that physically appear in the photo. " +
                "If the image has NO people and NO animals (for example it is text, a screenshot, an object, a landscape or a logo), answer 0 and 0. " +
                'Respond ONLY with strict minified JSON, no extra text: {"people": <int>, "pets": <int>}.',
            },
            { type: "image_url", image_url: { url, detail: "low" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 30,
    });
    const raw = completion.choices[0]?.message?.content || "{}";
    try {
      const j = JSON.parse(raw);
      const people = Math.max(0, Math.round(Number(j.people) || 0));
      const pets = Math.max(0, Math.round(Number(j.pets) || 0));
      return { people, pets };
    } catch {
      return { people: 0, pets: 0 };
    }
  }

  try {
    const results = await Promise.all(urls.map(countOne));
    let people = results.reduce((a, r) => a + r.people, 0);
    let pets = results.reduce((a, r) => a + r.pets, 0);
    // Respeta el máximo del pedido.
    if (people + pets > MAX) {
      // Recorta proporcionalmente conservando al menos lo detectado mayor.
      const total = people + pets;
      people = Math.round((people / total) * MAX);
      pets = MAX - people;
    }
    return NextResponse.json({ people, pets, total: people + pets, max: MAX });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error al analizar la foto.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
