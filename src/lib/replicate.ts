// Integración con Replicate (modelo face-to-many de fofr) para preservar mejor
// la identidad facial en estilos estilizados (Funko/Disney) usando InstantID.
// Si no hay token o falla, el llamador cae a gpt-image-1.

const TOKEN = process.env.REPLICATE_API_TOKEN;
// Versión del modelo fofr/face-to-many (configurable por si cambia).
const FACE_VERSION =
  process.env.REPLICATE_FACE_VERSION ||
  "0acc93d551a9de22261d9c4cb3c117e2f1e7337d7f3dc1f162cf2c43a7ad6dfe";

// Estilos de face-to-many por estilo de miniko. "realista" NO se mapea: ese
// motor es estilizado, así que el realista se queda en gpt-image-1.
const STYLE_MAP: Record<string, { style: string; prompt: string }> = {
  kawaii: {
    style: "Toy",
    prompt:
      "a cute Funko Pop style collectible vinyl figurine of the same person, big head, small body, big round black eyes, on a round display base, white background",
  },
  caricatura: {
    style: "3D",
    prompt:
      "a Disney Pixar style 3D animated character of the same person, friendly expressive face, smooth polished 3D render, full body, white background",
  },
};

export function replicateConfigured(): boolean {
  return !!TOKEN;
}
export function replicateSupportsStyle(styleId: string): boolean {
  return !!STYLE_MAP[styleId];
}

// Genera con face-to-many y devuelve la URL (temporal) del resultado.
export async function generateFaceToMany(photoUrl: string, styleId: string): Promise<string> {
  if (!TOKEN) throw new Error("Replicate sin token.");
  const map = STYLE_MAP[styleId];
  if (!map) throw new Error("Estilo no soportado por Replicate.");

  const start = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify({
      version: FACE_VERSION,
      input: {
        image: photoUrl,
        style: map.style,
        prompt: map.prompt,
        instant_id_strength: 0.85, // alta preservación de identidad
        denoising_strength: 0.65,
        prompt_strength: 4.5,
        control_depth_strength: 0.6,
      },
    }),
  });
  let prediction = await start.json();
  if (!start.ok) throw new Error(prediction?.detail || "Error de Replicate.");

  // Por si "Prefer: wait" no alcanzó a completar, hacemos polling.
  const getUrl = prediction?.urls?.get;
  for (
    let i = 0;
    i < 40 &&
    getUrl &&
    !["succeeded", "failed", "canceled"].includes(prediction.status);
    i++
  ) {
    await new Promise((r) => setTimeout(r, 2000));
    const p = await fetch(getUrl, { headers: { Authorization: `Bearer ${TOKEN}` } });
    prediction = await p.json();
  }

  if (prediction.status !== "succeeded") {
    throw new Error(prediction?.error || "Replicate no completó la imagen.");
  }
  const out = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!out || typeof out !== "string") throw new Error("Replicate no devolvió imagen.");
  return out;
}
