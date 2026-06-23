"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  STYLES,
  MASCOTS,
  StyleId,
  formatCop,
  styleById,
  variantById,
  variantByPeople,
} from "@/data/catalog";
import {
  Settings,
  defaultSettings,
  getSettings,
  priceOf,
  shipOf,
} from "@/lib/settings";
import StyleImage from "@/components/StyleImage";

const STEPS = ["Estilo", "Foto", "Email", "Preview", "Envío", "Pago"];
const MAX_FIGURES = 8; // máximo de personas/mascotas por pedido

// Imagen de mascota de ejemplo por estilo (perro Funko, gato Disney, perro
// realista) para mostrarla en el selector cuando es un pedido de mascota.
const mascotByStyle: Record<string, string> = Object.fromEntries(
  MASCOTS.map((m) => [m.styleId, m.image])
);

// "1 persona + 1 mascota", "2 personas", "3 mascotas"…
function composeLabel({ people, pets }: { people: number; pets: number }): string {
  const parts: string[] = [];
  if (people > 0) parts.push(`${people} ${people === 1 ? "persona" : "personas"}`);
  if (pets > 0) parts.push(`${pets} ${pets === 1 ? "mascota" : "mascotas"}`);
  return parts.join(" + ") || "1 figura";
}

interface Photo {
  url: string;
  name: string;
}
interface Shipping {
  name: string;
  phone: string;
  address: string;
  reference: string;
  city: string;
  department: string;
  zip: string;
  country: string;
}

// Departamentos de Colombia (los exige la transportadora).
const DEPARTAMENTOS = [
  "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar",
  "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó",
  "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira",
  "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío",
  "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
  "Valle del Cauca", "Vaupés", "Vichada",
];

export default function Wizard({ forcePet = false }: { forcePet?: boolean } = {}) {
  const params = useSearchParams();
  const initStyle = (params.get("estilo") as StyleId) || STYLES[0].id;
  // Flujo separado: "mascota" cambia los textos y se guarda en el pedido.
  const isPet = forcePet || params.get("tipo") === "mascota";

  const [step, setStep] = useState(0);
  const [settings, setSettings] = useState<Settings>(defaultSettings());
  const [styleId, setStyleId] = useState<StyleId>(
    STYLES.some((s) => s.id === initStyle) ? initStyle : STYLES[0].id
  );
  const [photos, setPhotos] = useState<Photo[]>([]);
  // Una vista previa por cada figura detectada (personas + mascotas).
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  // Detección automática de cuántas figuras (personas/mascotas) hay en la foto.
  const [detected, setDetected] = useState<{ people: number; pets: number } | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState(false);
  // Ajuste manual opcional por si la IA cuenta mal.
  const [manual, setManual] = useState<{ people: number; pets: number } | null>(null);
  const [shipping, setShipping] = useState<Shipping>({
    name: "",
    phone: "",
    address: "",
    reference: "",
    city: "",
    department: "",
    zip: "",
    country: "Colombia",
  });

  // Carga la configuración (precios/envío) editable desde el panel admin.
  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  // Persistencia: el avance del wizard NO se pierde al recargar la página.
  const STORAGE_KEY = isPet ? "miniko_wizard_pet" : "miniko_wizard";
  const restored = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.styleId && STYLES.some((x) => x.id === s.styleId)) setStyleId(s.styleId);
        if (typeof s.step === "number") setStep(s.step);
        if (Array.isArray(s.photos)) setPhotos(s.photos);
        if (Array.isArray(s.previews)) setPreviews(s.previews);
        if (typeof s.email === "string") setEmail(s.email);
        if (typeof s.emailVerified === "boolean") setEmailVerified(s.emailVerified);
        if (s.detected) setDetected(s.detected);
        if (s.manual) setManual(s.manual);
        if (s.shipping)
          setShipping({
            name: "", phone: "", address: "", reference: "",
            city: "", department: "", zip: "", country: "Colombia",
            ...s.shipping,
          });
      }
    } catch {
      /* almacenamiento no disponible */
    }
    restored.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try {
      // No guardamos previews "data:" (pesadas); las URL de Supabase sí.
      const safePreviews = previews.map((p) => (p && p.startsWith("data:") ? null : p));
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step, styleId, photos, previews: safePreviews, email, emailVerified, detected, manual, shipping })
      );
    } catch {
      /* cuota excedida o no disponible */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, styleId, photos, previews, email, emailVerified, detected, manual, shipping]);

  // Analiza las fotos para contar personas y mascotas automáticamente.
  const detect = useCallback(async (urls: string[]) => {
    setManual(null);
    setDetectError(false);
    if (urls.length === 0) {
      setDetected(null);
      return;
    }
    setDetecting(true);
    try {
      const res = await fetch("/api/detect-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrls: urls }),
      });
      const data = await res.json();
      if (res.ok && typeof data.people === "number") {
        setDetected({ people: data.people, pets: data.pets });
      } else {
        // No se pudo analizar: el usuario tendrá que indicarlo manualmente.
        setDetected(null);
        setDetectError(true);
      }
    } catch {
      setDetected(null);
      setDetectError(true);
    } finally {
      setDetecting(false);
    }
  }, []);

  // Recuento efectivo (manual si el usuario lo ajustó; si no, el detectado).
  const counts = manual ?? detected ?? { people: 0, pets: 0 };
  const totalDetected = counts.people + counts.pets;
  const hasFigures = totalDetected >= 1; // hay al menos una persona o mascota
  const totalFigures = Math.min(MAX_FIGURES, Math.max(1, totalDetected));
  const composicion = composeLabel(counts);
  const tipoLabel =
    counts.people > 0 && counts.pets > 0
      ? "Persona + Mascota"
      : counts.pets > 0
      ? "Mascota"
      : "Persona";

  // Lista de figuras a generar: primero las personas, luego las mascotas.
  // Cada una sabe su tipo y su número dentro de su tipo (para aislar sujetos).
  const figures: { kind: "persona" | "mascota"; index: number; ofKind: number }[] = [];
  for (let i = 0; i < counts.people; i++)
    figures.push({ kind: "persona", index: i + 1, ofKind: counts.people });
  for (let i = 0; i < counts.pets; i++)
    figures.push({ kind: "mascota", index: i + 1, ofKind: counts.pets });

  // ─── Generación de vistas previas EN SEGUNDO PLANO ───────────────
  // Apenas se detectan las figuras, empezamos a generarlas mientras el cliente
  // sigue con el email/envío. Si una falla, reintenta sola varias veces.
  type GenStatus = "idle" | "loading" | "done" | "error";
  const [genStatus, setGenStatus] = useState<GenStatus[]>([]);

  // Refs con los valores actuales (evita closures obsoletos en el generador).
  const figuresRef = useRef(figures);
  figuresRef.current = figures;
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const styleIdRef = useRef(styleId);
  styleIdRef.current = styleId;
  const attemptsRef = useRef<number[]>([]);

  // Firma de las entradas: si cambia (estilo, fotos o conteo), regeneramos todo.
  const figuresKey = figures.map((f) => `${f.kind}${f.index}/${f.ofKind}`).join(",");
  const photosKey = photos.map((p) => p.url).join(",");

  useEffect(() => {
    const n = figuresKey ? figuresKey.split(",").length : 0;
    attemptsRef.current = Array(n).fill(0);
    setPreviews(Array<string | null>(n).fill(null));
    setGenStatus(Array<GenStatus>(n).fill("idle"));
  }, [figuresKey, photosKey, styleId]);

  const generateFigure = useCallback(async (i: number) => {
    const fig = figuresRef.current[i];
    const ph = photosRef.current;
    const photoUrl = ph[Math.min(i, ph.length - 1)]?.url;
    if (!fig || !photoUrl) return;
    setGenStatus((p) => { const n = [...p]; n[i] = "loading"; return n; });
    try {
      const res = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoUrl,
          styleId: styleIdRef.current,
          tipo: fig.kind,
          index: fig.index,
          total: fig.ofKind,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "fallo");
      setPreviews((p) => { const n = [...p]; n[i] = data.url; return n; });
      setGenStatus((p) => { const n = [...p]; n[i] = "done"; return n; });
    } catch {
      const a = (attemptsRef.current[i] ?? 0) + 1;
      attemptsRef.current[i] = a;
      setGenStatus((p) => { const n = [...p]; n[i] = "error"; return n; });
      // Reintenta sola en segundo plano (hasta 4 intentos).
      if (a < 4) {
        setTimeout(() => {
          setGenStatus((p) => {
            if (p[i] !== "error") return p;
            const n = [...p]; n[i] = "idle"; return n;
          });
        }, 5000);
      }
    }
  }, []);

  // Lanza la generación de las figuras que estén "en cola" (idle).
  useEffect(() => {
    if (photos.length === 0) return;
    genStatus.forEach((st, i) => {
      if (st === "idle") generateFigure(i);
    });
  }, [genStatus, photos.length, generateFigure]);

  // Regenerar manualmente una figura (botón en la ventana).
  const regenerate = (i: number) => {
    attemptsRef.current[i] = 0;
    setGenStatus((p) => { const n = [...p]; n[i] = "idle"; return n; });
  };

  const variant = variantByPeople(totalFigures);
  const style = styleById(styleId)!;
  const price = priceOf(settings, variant.id, variant.priceCop);
  const shipCents = shipOf(settings, totalFigures);
  const total = price + shipCents;

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Validación por paso para habilitar "Continuar".
  const canContinue =
    (step === 0 && !!styleId) ||
    (step === 1 && photos.length > 0 && !detecting && hasFigures) ||
    // Obligatorio: hay que verificar el código del correo para continuar.
    (step === 2 && emailVerified) ||
    step === 3 ||
    (step === 4 &&
      !!shipping.name &&
      !!shipping.phone &&
      !!shipping.address &&
      !!shipping.city &&
      !!shipping.department);

  return (
    <div className="section">
      <div className="container-x max-w-3xl">
        {isPet && (
          <div className="mb-6 flex items-center justify-center">
            <span className="rounded-full border border-brand bg-white px-4 py-1.5 text-sm font-semibold text-brand">
              🐾 Pedido de mascota
            </span>
          </div>
        )}
        <Stepper step={step} />

        <div className="mt-12">
          {step === 0 && (
            <StepStyle styleId={styleId} setStyleId={setStyleId} isPet={isPet} />
          )}
          {step === 1 && (
            <StepPhotos
              photos={photos}
              setPhotos={setPhotos}
              maxPhotos={MAX_FIGURES}
              isPet={isPet}
              detecting={detecting}
              detectError={detectError}
              hasFigures={hasFigures}
              counts={counts}
              totalFigures={totalFigures}
              composicion={composicion}
              setManual={setManual}
              onPhotosChange={detect}
            />
          )}
          {step === 2 && (
            <StepEmail
              email={email}
              setEmail={setEmail}
              verified={emailVerified}
              setVerified={setEmailVerified}
            />
          )}
          {step === 3 && (
            <StepPreview
              style={style}
              figures={figures}
              previews={previews}
              genStatus={genStatus}
              onRegenerate={regenerate}
            />
          )}
          {step === 4 && <StepShipping shipping={shipping} setShipping={setShipping} />}
          {step === 5 && (
            <StepPay
              style={style}
              variant={variant}
              shipping={shipping}
              email={email}
              photos={photos}
              previews={previews}
              price={price}
              shipCents={shipCents}
              total={total}
              counts={counts}
              composicion={composicion}
              tipoLabel={tipoLabel}
            />
          )}
        </div>

        {/* Navegación (el paso de pago tiene su propio botón). */}
        {step < 5 && (
          <div className="mt-10 flex items-center justify-between">
            <button
              onClick={back}
              disabled={step === 0}
              className="btn-secondary disabled:invisible"
            >
              ← Atrás
            </button>
            <button
              onClick={next}
              disabled={!canContinue}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Continuar →
            </button>
          </div>
        )}

        {/* Resumen permanente abajo. */}
        <div className="mt-10 flex items-center justify-between border-t border-line pt-5 text-sm">
          <div className="flex items-center gap-5 text-ink/60">
            <span>🧩 {hasFigures ? `${totalFigures} ${totalFigures === 1 ? "figura" : "figuras"}` : "—"}</span>
            <span>📦 {hasFigures ? formatCop(price) : "—"}</span>
            <span>🚚 {hasFigures ? (shipCents === 0 ? "Gratis" : formatCop(shipCents)) : "—"}</span>
          </div>
          <div className="text-right">
            <span className="block text-xs uppercase tracking-wide text-ink/40">Total</span>
            <span className="font-display text-xl font-extrabold">{hasFigures ? formatCop(total) : "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Stepper ─────────────────────────── */
function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-between">
      {STEPS.map((label, i) => {
        const done = i < step;
        const active = i === step;
        return (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <span
                className={`grid h-9 w-9 place-items-center rounded-full border text-sm font-bold transition ${
                  active
                    ? "border-ink bg-ink text-white"
                    : done
                    ? "border-brand bg-white text-brand"
                    : "border-line bg-white text-ink/40"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`mt-2 hidden text-xs sm:block ${
                  active ? "font-semibold text-ink" : "text-ink/45"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-2 h-px flex-1 ${i < step ? "bg-brand" : "bg-line"}`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <h1 className="font-display text-3xl font-extrabold">{title}</h1>
      <p className="mx-auto mt-2 max-w-md text-ink/55">{subtitle}</p>
      <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
    </div>
  );
}

/* ─────────────────────────── Paso 1: Estilo ─────────────────────────── */
function StepStyle({
  styleId,
  setStyleId,
  isPet,
}: {
  styleId: StyleId;
  setStyleId: (id: StyleId) => void;
  isPet: boolean;
}) {
  return (
    <div>
      <StepHeading
        title="Elige tu estilo"
        subtitle={
          isPet
            ? "El look de la figura de tu mascota."
            : "El look de tu figura personalizada."
        }
      />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {STYLES.map((s) => {
          const selected = s.id === styleId;
          return (
            <button
              key={s.id}
              onClick={() => setStyleId(s.id)}
              className={`relative overflow-hidden rounded-2xl border bg-white text-left transition ${
                selected ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-ink/30"
              }`}
            >
              {s.premium && (
                <span className="absolute right-0 top-3 rounded-l-full border-y border-l border-brand bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
                  Premium
                </span>
              )}
              <div className="relative aspect-square w-full bg-mist">
                <StyleImage
                  src={isPet ? mascotByStyle[s.id] || s.image : s.image}
                  fallback={`/styles/${s.id}.svg`}
                  alt={s.name}
                  sizes="200px"
                  className="object-contain p-2"
                />
              </div>
              <div className="p-4">
                <p className="font-display font-bold">{s.name}</p>
                <p className="text-xs text-ink/50">{s.tagline}</p>
              </div>
              {selected && <span className="absolute left-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-ink text-xs text-white">✓</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-center text-sm text-ink/55">
        No te preocupes por la cantidad: al subir la foto detectamos
        automáticamente cuántas personas y mascotas hay. 🪄
      </p>
    </div>
  );
}

// Reduce la imagen a máx. 1280px y la exporta como JPEG ligero antes de subir.
// Si falla (p. ej. HEIC no soportado), devuelve el archivo original.
async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const MAX = 1280;
    let { width, height } = bitmap;
    if (width > MAX || height > MAX) {
      const scale = MAX / Math.max(width, height);
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

/* ─────────────────────────── Paso 2: Foto ─────────────────────────── */
function StepPhotos({
  photos,
  setPhotos,
  maxPhotos,
  isPet,
  detecting,
  detectError,
  hasFigures,
  counts,
  totalFigures,
  composicion,
  setManual,
  onPhotosChange,
}: {
  photos: Photo[];
  setPhotos: (p: Photo[]) => void;
  maxPhotos: number;
  isPet: boolean;
  detecting: boolean;
  detectError: boolean;
  hasFigures: boolean;
  counts: { people: number; pets: number };
  totalFigures: number;
  composicion: string;
  setManual: (c: { people: number; pets: number } | null) => void;
  onPhotosChange: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adjust, setAdjust] = useState(false);

  // Cambia la lista de fotos y dispara la detección automática.
  const commit = useCallback(
    (list: Photo[]) => {
      setPhotos(list);
      onPhotosChange(list.map((p) => p.url));
    },
    [setPhotos, onPhotosChange]
  );

  const upload = useCallback(
    async (files: FileList) => {
      setError(null);
      setUploading(true);
      const added: Photo[] = [];
      try {
        for (const file of Array.from(files)) {
          if (photos.length + added.length >= maxPhotos) break;
          // Comprime/reduce la imagen en el navegador para que suba rápido.
          const blob = await compressImage(file);
          const fd = new FormData();
          fd.append("file", blob, "foto.jpg");
          // Límite de tiempo: si tarda más de 45s, aborta y muestra error.
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), 45000);
          let res: Response;
          try {
            res = await fetch("/api/upload", {
              method: "POST",
              body: fd,
              signal: ctrl.signal,
            });
          } catch {
            throw new Error("La subida tardó demasiado. Reintenta con una imagen más ligera.");
          } finally {
            clearTimeout(timer);
          }
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error al subir.");
          added.push({ url: data.url, name: file.name });
        }
        commit([...photos, ...added]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al subir la imagen.");
      } finally {
        setUploading(false);
      }
    },
    [photos, commit, maxPhotos]
  );

  return (
    <div>
      <StepHeading
        title={isPet ? "Sube la foto de tu mascota" : "Sube tu foto"}
        subtitle="Sube una foto nítida y bien iluminada. Detectamos solos cuántas figuras lleva tu pedido."
      />

      <div className="mx-auto mt-6 flex max-w-md items-start gap-2.5 rounded-2xl border border-brand/30 bg-brand/5 px-4 py-3 text-sm text-ink/75">
        <span className="mt-0.5">💡</span>
        <p>
          <span className="font-semibold text-ink">Consejo:</span> sube una foto por cada{" "}
          {isPet ? "mascota" : "persona o mascota"} (una foto = una figura). Así cada figura se
          parece mucho más. Una foto grupal también funciona, pero el parecido puede bajar.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {photos.map((p, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-line">
            <Image src={p.url} alt={p.name} fill sizes="200px" className="object-cover" />
            <button
              onClick={() => commit(photos.filter((_, j) => j !== i))}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sm shadow"
              aria-label="Quitar"
            >
              ✕
            </button>
          </div>
        ))}

        {photos.length < maxPhotos && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line text-center text-ink/50 transition hover:border-brand/60 hover:text-ink">
            <span className="text-3xl">＋</span>
            <span className="text-sm">{uploading ? "Subiendo…" : "Añadir foto"}</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(e) => e.target.files && upload(e.target.files)}
            />
          </label>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-brand/40 bg-white px-3 py-2 text-sm text-brand">
          {error}
        </p>
      )}

      {/* Resultado de la detección automática */}
      {photos.length > 0 && (
        <div
          className={`mt-6 rounded-2xl border bg-white p-5 text-center ${
            !detecting && !hasFigures ? "border-brand/50" : "border-line"
          }`}
        >
          {detecting ? (
            <p className="flex items-center justify-center gap-2 text-sm text-ink/60">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-brand" />
              Detectando cuántas figuras hay en tu foto…
            </p>
          ) : !hasFigures ? (
            <>
              <p className="text-2xl">🔍</p>
              <p className="mt-1 font-display text-lg font-bold text-brand">
                {detectError
                  ? "No pudimos analizar la foto"
                  : "No detectamos ninguna persona ni mascota"}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">
                {detectError
                  ? "Vuelve a intentarlo o indícanos manualmente cuántas figuras hay."
                  : "Sube una foto donde se vea bien la persona o la mascota. Si crees que está bien, indícalo manualmente."}
              </p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
                <Counter
                  label="Personas"
                  value={counts.people}
                  onChange={(v) => setManual({ people: v, pets: counts.pets })}
                />
                <Counter
                  label="Mascotas"
                  value={counts.pets}
                  onChange={(v) => setManual({ people: counts.people, pets: v })}
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-ink/60">Detectamos</p>
              <p className="mt-1 font-display text-xl font-extrabold">{composicion}</p>
              <p className="mt-1 text-sm text-ink/70">
                = {totalFigures} {totalFigures === 1 ? "figura" : "figuras"}
              </p>
              <p className="mt-1 text-xs text-ink/45">
                Cada figura va por separado (en impresión 3D solo se imprime una por base).
              </p>
              <button
                onClick={() => {
                  setAdjust((v) => !v);
                  if (!adjust) setManual({ ...counts });
                }}
                className="mt-2 text-xs font-semibold text-brand underline underline-offset-2"
              >
                {adjust ? "Listo" : "¿No coincide? Ajustar"}
              </button>

              {adjust && (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-6">
                  <Counter
                    label="Personas"
                    value={counts.people}
                    onChange={(v) => setManual({ people: v, pets: counts.pets })}
                  />
                  <Counter
                    label="Mascotas"
                    value={counts.pets}
                    onChange={(v) => setManual({ people: counts.people, pets: v })}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Reglas / consejos para mejores resultados */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center text-xs text-ink/40">
        <span>👥 Máximo {maxPhotos} personas/mascotas por pedido.</span>
        <span>📷 Las fotos de cuerpo entero con fondos sencillos funcionan mejor.</span>
        <span>🐾 Mascotas: de pie o sentadas, no acurrucadas.</span>
      </div>
    </div>
  );
}

// Contador +/- para ajustar manualmente personas o mascotas.
function Counter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-xs font-semibold text-ink/60">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(0, value - 1))}
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-lg leading-none hover:border-ink/40"
          aria-label={`Menos ${label}`}
        >
          −
        </button>
        <span className="w-6 text-center font-display text-lg font-bold">{value}</span>
        <button
          onClick={() => onChange(Math.min(8, value + 1))}
          className="grid h-8 w-8 place-items-center rounded-full border border-line text-lg leading-none hover:border-ink/40"
          aria-label={`Más ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────── Paso 3: Email ─────────────────────────── */
function StepEmail({
  email,
  setEmail,
  verified,
  setVerified,
}: {
  email: string;
  setEmail: (v: string) => void;
  verified: boolean;
  setVerified: (v: boolean) => void;
}) {
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [exp, setExp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/email/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo enviar el código.");
      setToken(data.token);
      setExp(data.exp);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al enviar el código.");
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/email/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, exp, token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Código incorrecto.");
      setVerified(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código incorrecto.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <StepHeading
        title="Verifica tu email"
        subtitle="Te enviamos un código de 6 dígitos para confirmar tu dirección."
      />
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line bg-white p-6 text-center sm:p-8">
        <label className="block text-sm font-medium">Email</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            value={email}
            disabled={verified}
            onChange={(e) => {
              setEmail(e.target.value);
              setSent(false);
              setVerified(false);
            }}
            placeholder="tu@email.com"
            className="w-full rounded-full border border-line px-4 py-2.5 text-center outline-none focus:border-ink"
          />
          {!verified && (
            <button
              onClick={sendCode}
              disabled={loading || !email}
              className="btn-secondary shrink-0 px-5 py-2.5 text-sm disabled:opacity-40"
            >
              {sent ? "Reenviar" : "Enviar código"}
            </button>
          )}
        </div>

        {verified ? (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-sm font-medium text-green-600">
            ✓ Verificado — puedes continuar
          </p>
        ) : (
          sent && (
            <div className="mt-5">
              <label className="block text-sm font-medium">Código de 6 dígitos</label>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full rounded-full border border-line px-4 py-2.5 text-center tracking-[0.5em] outline-none focus:border-ink"
                />
                <button
                  onClick={verify}
                  disabled={loading || code.length !== 6}
                  className="btn-primary shrink-0 px-5 py-2.5 text-sm disabled:opacity-40"
                >
                  Verificar
                </button>
              </div>
              <p className="mt-2 text-xs text-ink/45">Revisa tu bandeja (y spam). Caduca en 10 min.</p>
            </div>
          )
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
            {error}
          </p>
        )}

        {!verified && (
          <p className="mt-3 text-xs text-ink/45">
            Ingresa el código que te enviamos al correo para continuar.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Paso 4: Preview (IA) ─────────────────────────── */
type Figure = { kind: "persona" | "mascota"; index: number; ofKind: number };
type GenStatus = "idle" | "loading" | "done" | "error";

function StepPreview({
  style,
  figures,
  previews,
  genStatus,
  onRegenerate,
}: {
  style: ReturnType<typeof styleById>;
  figures: Figure[];
  previews: (string | null)[];
  genStatus: GenStatus[];
  onRegenerate: (i: number) => void;
}) {
  const multiple = figures.length > 1;
  return (
    <div>
      <StepHeading
        title={multiple ? "Tus figuras" : "Tu figura"}
        subtitle={
          multiple
            ? `Detectamos ${figures.length} figuras: cada una se genera e imprime por separado. Desliza para verlas todas →`
            : "Vista previa orientativa. Se genera sola; recibirás el render final a aprobar antes de imprimir."
        }
      />

      <div
        className={`mt-8 flex gap-4 overflow-x-auto pb-3 ${
          multiple ? "snap-x snap-mandatory" : "justify-center"
        }`}
      >
        {figures.map((fig, i) => (
          <PreviewWindow
            key={i}
            figure={fig}
            total={figures.length}
            styleName={style?.name || ""}
            url={previews[i] ?? null}
            status={genStatus[i] ?? "idle"}
            onRegenerate={() => onRegenerate(i)}
          />
        ))}
      </div>
    </div>
  );
}

// Una ventana = una figura. Solo muestra el estado; la generación corre en
// segundo plano desde el Wizard (con reintentos automáticos).
function PreviewWindow({
  figure,
  total,
  styleName,
  url,
  status,
  onRegenerate,
}: {
  figure: Figure;
  total: number;
  styleName: string;
  url: string | null;
  status: GenStatus;
  onRegenerate: () => void;
}) {
  const busy = status === "loading" || (status === "idle" && !url);
  const label =
    total > 1
      ? `${figure.kind === "mascota" ? "Mascota" : "Persona"} ${figure.index}`
      : figure.kind === "mascota"
      ? "Mascota"
      : "Tu figura";

  return (
    <div className="w-[280px] shrink-0 snap-center">
      <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-xl shadow-ink/5">
        <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-brand/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
            <span className="h-2.5 w-2.5 rounded-full bg-line" />
          </div>
          <span className="text-xs font-semibold text-ink/50">{label}</span>
          <span className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold text-ink/70">
            {styleName}
          </span>
        </div>

        <div className="relative aspect-[3/4] w-full bg-gradient-to-b from-mist to-white">
          {busy && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm">
              <span className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-brand" />
              <p className="text-sm font-medium text-ink/70">Creando figura…</p>
            </div>
          )}

          {url ? (
            <Image
              src={url}
              alt={label}
              fill
              sizes="280px"
              className="object-contain p-3"
              unoptimized={url.startsWith("data:")}
            />
          ) : (
            status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <span className="text-2xl">⚠️</span>
                <p className="text-xs text-ink/55">No se pudo generar. Reintentando sola…</p>
              </div>
            )
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs text-ink/55">
            <span className={`h-1.5 w-1.5 rounded-full ${status === "error" ? "bg-amber-500" : "bg-brand"}`} />
            {busy ? "Generando…" : url ? "Orientativa" : status === "error" ? "Reintentando…" : "En cola…"}
          </p>
          <button
            onClick={onRegenerate}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-semibold transition hover:border-ink/40 disabled:opacity-40"
          >
            <span className={busy ? "animate-spin" : ""}>↻</span>
            {busy ? "…" : url ? "Regenerar" : "Reintentar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Paso 5: Envío ─────────────────────────── */
function StepShipping({
  shipping,
  setShipping,
}: {
  shipping: Shipping;
  setShipping: (s: Shipping) => void;
}) {
  const field = (k: keyof Shipping) => ({
    value: shipping[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setShipping({ ...shipping, [k]: e.target.value }),
  });
  const input =
    "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";
  const label = "text-xs font-medium text-ink/60";

  return (
    <div>
      <StepHeading title="Datos de envío" subtitle="¿A dónde enviamos tu kit?" />
      <div className="mx-auto mt-8 grid max-w-lg gap-3 text-left">
        <label className="block">
          <span className={label}>Nombre y apellidos *</span>
          <input className={`mt-1 ${input}`} placeholder="Nombre completo" {...field("name")} />
        </label>
        <label className="block">
          <span className={label}>Celular *</span>
          <input
            className={`mt-1 ${input}`}
            inputMode="tel"
            placeholder="3001234567"
            {...field("phone")}
          />
        </label>
        <label className="block">
          <span className={label}>Dirección *</span>
          <input className={`mt-1 ${input}`} placeholder="Calle 82 # 37-68" {...field("address")} />
        </label>
        <label className="block">
          <span className={label}>Referencia / barrio (opcional)</span>
          <input className={`mt-1 ${input}`} placeholder="Bosques de Bambú, casa azul…" {...field("reference")} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Departamento *</span>
            <select className={`mt-1 ${input} bg-white`} {...field("department")}>
              <option value="">Selecciona…</option>
              {DEPARTAMENTOS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>Ciudad / Municipio *</span>
            <input className={`mt-1 ${input}`} placeholder="Pereira" {...field("city")} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className={label}>Código postal (opcional)</span>
            <input className={`mt-1 ${input}`} placeholder="660001" {...field("zip")} />
          </label>
          <label className="block">
            <span className={label}>País</span>
            <input className={`mt-1 ${input}`} placeholder="País" {...field("country")} />
          </label>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Paso 6: Pago ─────────────────────────── */
function StepPay({
  style,
  variant,
  shipping,
  email,
  photos,
  previews,
  price,
  shipCents,
  total,
  counts,
  composicion,
  tipoLabel,
}: {
  style: NonNullable<ReturnType<typeof styleById>>;
  variant: NonNullable<ReturnType<typeof variantById>>;
  shipping: Shipping;
  email: string;
  photos: Photo[];
  previews: (string | null)[];
  price: number;
  shipCents: number;
  total: number;
  counts: { people: number; pets: number };
  composicion: string;
  tipoLabel: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styleId: style.id,
          variantId: variant.id,
          email,
          photoUrls: photos.map((p) => p.url),
          previewUrls: previews.filter((u): u is string => !!u),
          shipping,
          tipo: tipoLabel,
          personas: counts.people,
          mascotas: counts.pets,
          composicion,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
      // Pago iniciado: limpiamos el progreso guardado para el próximo pedido.
      try {
        localStorage.removeItem("miniko_wizard");
        localStorage.removeItem("miniko_wizard_pet");
      } catch {
        /* ignore */
      }
      if (data.url) window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
      setLoading(false);
    }
  }

  const row = "flex items-center justify-between py-2.5 text-sm";

  return (
    <div>
      <StepHeading title="Revisa y paga" subtitle="Revisa tu pedido y procede al pago." />
      <div className="mx-auto mt-8 max-w-md rounded-2xl border border-line p-6">
        <div className={row}>
          <span className="text-ink/55">Estilo</span>
          <span className="font-medium">{style.name}</span>
        </div>
        <div className={`${row} border-t border-line`}>
          <span className="text-ink/55">Figuras</span>
          <span className="font-medium">{composicion}</span>
        </div>
        <div className={`${row} border-t border-line`}>
          <span className="text-ink/55">Kit ({variant.people} {variant.people === 1 ? "figura" : "figuras"})</span>
          <span className="font-medium">{formatCop(price)}</span>
        </div>
        <div className={`${row} border-t border-line`}>
          <span className="text-ink/55">Envío</span>
          <span className="font-medium">{shipCents === 0 ? "Gratis" : formatCop(shipCents)}</span>
        </div>
        <div className="my-1 h-px bg-brand/60" />
        <div className="flex items-center justify-between py-2">
          <span className="font-display text-lg font-bold">Total</span>
          <span className="font-display text-lg font-extrabold">{formatCop(total)}</span>
        </div>
        {shipping.name && (
          <p className="mt-2 text-xs text-ink/50">
            <span className="font-semibold text-ink/70">Envío a:</span> {shipping.name},{" "}
            {[shipping.address, shipping.city, shipping.zip, shipping.country]
              .filter(Boolean)
              .join(", ")}
          </p>
        )}
      </div>

      {error && (
        <p className="mx-auto mt-4 max-w-md rounded-lg border border-brand/40 px-3 py-2 text-center text-sm text-brand">
          {error}
        </p>
      )}

      <div className="mt-6 flex justify-center">
        <button onClick={pay} disabled={loading} className="btn-primary px-10 disabled:opacity-60">
          {loading ? "Redirigiendo…" : `Pagar ${formatCop(total)} →`}
        </button>
      </div>
      <p className="mt-3 text-center text-xs text-ink/45">🔒 Pago seguro con Wompi · PSE, Nequi, Bancolombia y tarjetas</p>
    </div>
  );
}
