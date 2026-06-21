"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  STYLES,
  VARIANTS,
  StyleId,
  formatCop,
  shippingCop,
  styleById,
  variantById,
} from "@/data/catalog";
import StyleImage from "@/components/StyleImage";

const STEPS = ["Estilo", "Foto", "Email", "Preview", "Envío", "Pago"];

interface Photo {
  url: string;
  name: string;
}
interface Shipping {
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
}

export default function Wizard() {
  const params = useSearchParams();
  const initStyle = (params.get("estilo") as StyleId) || STYLES[0].id;

  const [step, setStep] = useState(0);
  const [styleId, setStyleId] = useState<StyleId>(
    STYLES.some((s) => s.id === initStyle) ? initStyle : STYLES[0].id
  );
  const [variantId, setVariantId] = useState(VARIANTS[0].id);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [shipping, setShipping] = useState<Shipping>({
    name: "",
    address: "",
    city: "",
    zip: "",
    country: "Colombia",
  });

  const variant = variantById(variantId)!;
  const style = styleById(styleId)!;
  const shipCents = shippingCop(variant.people);
  const total = variant.priceCop + shipCents;

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // Validación por paso para habilitar "Continuar".
  const canContinue =
    (step === 0 && !!styleId && !!variantId) ||
    (step === 1 && photos.length > 0) ||
    // Basta con un email válido para avanzar. La verificación por código es un
    // extra (funciona cuando Resend está configurado) pero no bloquea el flujo.
    (step === 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    step === 3 ||
    (step === 4 &&
      !!shipping.name &&
      !!shipping.address &&
      !!shipping.city &&
      !!shipping.zip);

  return (
    <div className="section">
      <div className="container-x max-w-3xl">
        <Stepper step={step} />

        <div className="mt-12">
          {step === 0 && (
            <StepStyle
              styleId={styleId}
              setStyleId={setStyleId}
              variantId={variantId}
              setVariantId={setVariantId}
            />
          )}
          {step === 1 && (
            <StepPhotos
              photos={photos}
              setPhotos={setPhotos}
              maxPhotos={variant.people}
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
              photos={photos}
              style={style}
              styleId={styleId}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
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
              previewUrl={previewUrl}
              shipCents={shipCents}
              total={total}
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
            <span>👥 {variant.people}</span>
            <span>📦 {formatCop(variant.priceCop)}</span>
            <span>🚚 {shipCents === 0 ? "Gratis" : formatCop(shipCents)}</span>
          </div>
          <div className="text-right">
            <span className="block text-xs uppercase tracking-wide text-ink/40">Total</span>
            <span className="font-display text-xl font-extrabold">{formatCop(total)}</span>
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
  variantId,
  setVariantId,
}: {
  styleId: StyleId;
  setStyleId: (id: StyleId) => void;
  variantId: string;
  setVariantId: (id: string) => void;
}) {
  return (
    <div>
      <StepHeading title="Elige tu estilo" subtitle="El look de tu figura personalizada." />
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
                  src={s.image}
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

      <h2 className="mt-10 text-center font-display text-lg font-bold">¿Cuántos personajes?</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {VARIANTS.map((v) => {
          const selected = v.id === variantId;
          return (
            <button
              key={v.id}
              onClick={() => setVariantId(v.id)}
              className={`rounded-2xl border p-4 text-center transition ${
                selected ? "border-ink ring-2 ring-ink/10" : "border-line hover:border-ink/30"
              }`}
            >
              <span className="block font-semibold">{v.name}</span>
              <span className="block text-xs text-ink/50">{v.description}</span>
              <span className="mt-1 block font-display font-bold">{formatCop(v.priceCop)}</span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-center text-xs text-ink/40">* Cada personaje mide hasta 15 cm.</p>
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
}: {
  photos: Photo[];
  setPhotos: (p: Photo[]) => void;
  maxPhotos: number;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setPhotos([...photos, ...added]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error al subir la imagen.");
      } finally {
        setUploading(false);
      }
    },
    [photos, setPhotos, maxPhotos]
  );

  return (
    <div>
      <StepHeading
        title="Sube tu foto"
        subtitle={`Una foto nítida y bien iluminada funciona mejor. Hasta ${maxPhotos} ${
          maxPhotos === 1 ? "imagen" : "imágenes"
        }.`}
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {photos.map((p, i) => (
          <div key={i} className="group relative aspect-square overflow-hidden rounded-2xl border border-line">
            <Image src={p.url} alt={p.name} fill sizes="200px" className="object-cover" />
            <button
              onClick={() => setPhotos(photos.filter((_, j) => j !== i))}
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
      <p className="mt-4 text-center text-xs text-ink/40">
        Tus fotos solo se usan para crear tu figura. JPG, PNG o WEBP · máx. 10 MB.
      </p>
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
      <div className="mx-auto mt-8 max-w-md">
        <label className="text-sm font-medium">Email</label>
        <div className="mt-1.5 flex gap-2">
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
            className="w-full rounded-full border border-line px-4 py-2.5 outline-none focus:border-ink"
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
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-green-600">
            ✓ Verificado — puedes continuar
          </p>
        ) : (
          sent && (
            <div className="mt-5">
              <label className="text-sm font-medium">Código de 6 dígitos</label>
              <div className="mt-1.5 flex gap-2">
                <input
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="••••••"
                  className="w-full rounded-full border border-line px-4 py-2.5 tracking-[0.5em] outline-none focus:border-ink"
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
          <p className="mt-3 text-center text-xs text-ink/45">
            La verificación por código es opcional: puedes continuar con un email válido.
          </p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Paso 4: Preview (IA) ─────────────────────────── */
function StepPreview({
  photos,
  style,
  styleId,
  previewUrl,
  setPreviewUrl,
}: {
  photos: Photo[];
  style: ReturnType<typeof styleById>;
  styleId: StyleId;
  previewUrl: string | null;
  setPreviewUrl: (u: string | null) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!photos[0]) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: photos[0].url, styleId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar la figura.");
      setPreviewUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar la figura.");
    } finally {
      setLoading(false);
    }
  }, [photos, styleId, setPreviewUrl]);

  // Genera automáticamente al entrar al paso, si aún no hay preview.
  useEffect(() => {
    if (!previewUrl && !loading && !error && photos[0]) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <StepHeading
        title="Tu figura"
        subtitle="Generamos una vista previa de tu figura a partir de tu foto. Es orientativa; recibirás el render final a aprobar antes de imprimir."
      />

      <div className="mx-auto mt-8 max-w-lg">
        <div className="overflow-hidden rounded-2xl border border-line">
          <div className="relative mx-auto aspect-[2/3] max-w-sm bg-mist">
            {loading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/70 backdrop-blur-sm">
                <span className="h-10 w-10 animate-spin rounded-full border-2 border-line border-t-brand" />
                <p className="text-sm font-medium text-ink/70">Creando tu figura…</p>
                <p className="text-xs text-ink/45">Puede tardar unos segundos</p>
              </div>
            )}

            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Vista previa de tu figura"
                fill
                sizes="(max-width: 640px) 100vw, 512px"
                className="object-contain"
                unoptimized={previewUrl.startsWith("data:")}
              />
            ) : (
              !loading &&
              photos[0] && (
                <Image src={photos[0].url} alt="Tu foto" fill sizes="512px" className="object-cover opacity-60" />
              )
            )}

            {previewUrl && (
              <span className="absolute left-3 top-3 z-10 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold">
                Estilo {style?.name}
              </span>
            )}

            {photos[0] && (
              <div className="absolute bottom-3 left-3 z-10 h-16 w-16 overflow-hidden rounded-lg border-2 border-white shadow">
                <Image src={photos[0].url} alt="Tu foto" fill sizes="64px" className="object-cover" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-brand/60 p-4">
            <p className="text-sm text-ink/60">
              {error
                ? "No pudimos generarla automáticamente."
                : "🎨 Vista previa generada por IA."}
            </p>
            <button
              onClick={generate}
              disabled={loading || !photos[0]}
              className="btn-secondary px-4 py-2 text-sm disabled:opacity-40"
            >
              {loading ? "Generando…" : previewUrl ? "Regenerar" : "Generar"}
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">
            {error}
          </p>
        )}
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
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setShipping({ ...shipping, [k]: e.target.value }),
  });
  const input =
    "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <div>
      <StepHeading title="Datos de envío" subtitle="¿A dónde enviamos tu kit?" />
      <div className="mx-auto mt-8 grid max-w-lg gap-3">
        <input className={input} placeholder="Nombre y apellidos" {...field("name")} />
        <input className={input} placeholder="Dirección" {...field("address")} />
        <div className="grid grid-cols-2 gap-3">
          <input className={input} placeholder="Ciudad" {...field("city")} />
          <input className={input} placeholder="Código postal" {...field("zip")} />
        </div>
        <input className={input} placeholder="País" {...field("country")} />
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
  previewUrl,
  shipCents,
  total,
}: {
  style: NonNullable<ReturnType<typeof styleById>>;
  variant: NonNullable<ReturnType<typeof variantById>>;
  shipping: Shipping;
  email: string;
  photos: Photo[];
  previewUrl: string | null;
  shipCents: number;
  total: number;
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
          previewUrl,
          shipping,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar el pago.");
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
          <span className="text-ink/55">Personajes</span>
          <span className="font-medium">{variant.people}</span>
        </div>
        <div className={`${row} border-t border-line`}>
          <span className="text-ink/55">Kit</span>
          <span className="font-medium">{formatCop(variant.priceCop)}</span>
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
      <p className="mt-3 text-center text-xs text-ink/45">🔒 Pago seguro con Stripe</p>
    </div>
  );
}
