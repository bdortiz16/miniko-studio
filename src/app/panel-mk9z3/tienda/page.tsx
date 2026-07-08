"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product, Design } from "@/lib/products";
import { PRODUCT_CATEGORIES } from "@/lib/products";

function money(cop: number) {
  try {
    return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(cop);
  } catch {
    return `$${cop.toLocaleString("es-CO")}`;
  }
}

export default function AdminTienda() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function seedExamples() {
    setSeeding(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/products/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo cargar.");
      setProducts(data.products || []);
      setMsg({ ok: true, text: `✓ Se cargaron ${data.added} productos de ejemplo. Edítalos o cámbiales la foto.` });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Error." });
    } finally {
      setSeeding(false);
    }
  }

  async function load() {
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    await fetch(`/api/admin/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setProducts((list) => list.filter((p) => p.id !== id));
  }

  async function toggleActive(p: Product) {
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...p, active: !p.active }),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((list) => list.map((x) => (x.id === p.id ? data.product : x)));
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-3xl font-extrabold">Tienda</h1>
      <p className="mt-2 text-ink/60">Productos que vendes además de las figuras (llaveros, artículos 3D…).</p>
      <div className="mt-4 h-px w-16 bg-brand/70" />

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link href="/panel-mk9z3" className="btn-secondary px-5 py-2 text-sm">← Panel</Link>
        <button
          onClick={() => { setEditing(null); setShowForm(true); setMsg(null); }}
          className="btn-primary px-5 py-2 text-sm"
        >
          + Nuevo producto
        </button>
        {products.length === 0 && (
          <button onClick={seedExamples} disabled={seeding} className="btn-secondary px-5 py-2 text-sm disabled:opacity-50">
            {seeding ? "Cargando…" : "Cargar ejemplos"}
          </button>
        )}
        <Link href="/tienda" target="_blank" className="text-sm font-semibold text-brand underline underline-offset-2">
          Ver tienda ↗
        </Link>
      </div>

      {msg && (
        <p className={`mt-4 text-sm font-semibold ${msg.ok ? "text-green-600" : "text-brand"}`}>{msg.text}</p>
      )}

      {showForm && (
        <ProductForm
          product={editing}
          onClose={() => setShowForm(false)}
          onSaved={(p, isNew) => {
            setProducts((list) => (isNew ? [p, ...list] : list.map((x) => (x.id === p.id ? p : x))));
            setShowForm(false);
            setMsg({ ok: true, text: isNew ? "✓ Producto creado." : "✓ Producto actualizado." });
          }}
        />
      )}

      <section className="mt-6">
        {loading ? (
          <p className="text-sm text-ink/50">Cargando…</p>
        ) : products.length === 0 ? (
          <p className="rounded-2xl border border-line bg-white p-8 text-center text-sm text-ink/55">
            Aún no tienes productos. Crea el primero con “+ Nuevo producto”.
          </p>
        ) : (
          <div className="space-y-3">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-line bg-white p-4">
                <div
                  className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-mist"
                  style={p.image ? undefined : { background: `linear-gradient(135deg, ${p.accent || "#f1f1f2"}, #fff)` }}
                >
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-2xl">{p.emoji || "📦"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="text-sm text-ink/60">{money(p.priceCop)}{typeof p.stock === "number" ? ` · stock ${p.stock}` : ""}</p>
                </div>
                <button
                  onClick={() => toggleActive(p)}
                  className={`rounded-full px-3 py-1 text-xs font-bold ${p.active ? "bg-green-100 text-green-700" : "bg-mist text-ink/50"}`}
                >
                  {p.active ? "Activo" : "Oculto"}
                </button>
                <button onClick={() => { setEditing(p); setShowForm(true); setMsg(null); }} className="text-sm font-semibold text-ink/60 hover:text-ink">
                  Editar
                </button>
                <button onClick={() => del(p.id)} className="text-sm font-semibold text-ink/50 hover:text-brand">
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: Product | null;
  onClose: () => void;
  onSaved: (p: Product, isNew: boolean) => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [price, setPrice] = useState(product?.priceCop ? String(product.priceCop) : "");
  const [description, setDescription] = useState(product?.description || "");
  const [image, setImage] = useState(product?.image || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [category, setCategory] = useState(product?.category || "");
  const [stock, setStock] = useState(typeof product?.stock === "number" ? String(product.stock) : "");
  const [designs, setDesigns] = useState<Design[]>(product?.designs || []);
  const [uploading, setUploading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo subir.");
    return data.url as string;
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files || !files.length) return;
    setUploading(true);
    setError(null);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).slice(0, 6)) urls.push(await uploadFile(f));
      setImages((prev) => [...prev, ...urls].slice(0, 6));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setUploading(false);
    }
  }

  // Genera la imagen principal con IA a partir del nombre/descripción.
  async function generateMainImage() {
    if (!name.trim()) { setError("Escribe el nombre del producto primero."); return; }
    setGenLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo generar.");
      setImage(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al generar.");
    } finally {
      setGenLoading(false);
    }
  }

  function addDesign() {
    setDesigns((d) => [...d, { id: `d-${Date.now()}-${d.length}`, name: "", emoji: "" }]);
  }
  function updateDesign(i: number, patch: Partial<Design>) {
    setDesigns((d) => d.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function removeDesign(i: number) {
    setDesigns((d) => d.filter((_, j) => j !== i));
  }
  async function onDesignFile(i: number, file: File | null) {
    if (!file) return;
    try {
      const url = await uploadFile(file);
      updateDesign(i, { image: url });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir.");
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo subir la imagen.");
      setImage(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al subir.");
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: product?.id,
          name,
          priceCop: Number(price),
          description,
          image,
          images,
          category,
          stock: stock === "" ? undefined : Number(stock),
          active: product ? product.active : true,
          designs: designs.filter((d) => d.name.trim()),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo guardar.");
      onSaved(data.product, !product);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error.");
    } finally {
      setSaving(false);
    }
  }

  const input = "w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-ink";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
        <h3 className="font-display text-lg font-bold">{product ? "Editar producto" : "Nuevo producto"}</h3>

        <div className="mt-4 grid gap-4">
          <label className="block text-xs font-medium text-ink/60">
            Nombre
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Llavero personalizado" className={`mt-1 ${input}`} />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block text-xs font-medium text-ink/60">
              Precio (COP)
              <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="15000" className={`mt-1 ${input}`} />
            </label>
            <label className="block text-xs font-medium text-ink/60">
              Stock (opcional)
              <input value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="—" className={`mt-1 ${input}`} />
            </label>
            <label className="block text-xs font-medium text-ink/60">
              Categoría
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`mt-1 ${input}`}>
                <option value="">—</option>
                {PRODUCT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-xs font-medium text-ink/60">
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Impreso en 3D, resistente, varios colores." className={`mt-1 ${input}`} />
          </label>
          <div>
            <p className="text-xs font-medium text-ink/60">Imagen principal</p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-mist">
                {image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xl text-ink/30">📦</div>
                )}
              </div>
              <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink">
                {uploading ? "Subiendo…" : image ? "Cambiar" : "Subir"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
              </label>
              <button type="button" onClick={generateMainImage} disabled={genLoading} className="rounded-full bg-brand/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/20 disabled:opacity-50">
                {genLoading ? "Generando…" : "✨ Generar con IA"}
              </button>
            </div>
          </div>

          {/* Galería (fotos adicionales) */}
          <div>
            <p className="text-xs font-medium text-ink/60">Galería (hasta 6)</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {images.map((u, i) => (
                <div key={i} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt="" className="h-16 w-16 rounded-lg border border-line object-cover" />
                  <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-white">×</button>
                </div>
              ))}
              {images.length < 6 && (
                <label className="grid h-16 w-16 cursor-pointer place-items-center rounded-lg border border-dashed border-line text-xl text-ink/40 hover:border-ink/40">
                  +
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => onGalleryFiles(e.target.files)} />
                </label>
              )}
            </div>
          </div>

          {/* Diseños del producto */}
          <div className="rounded-xl border border-line bg-mist/40 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Diseños (opcional)</p>
              <button type="button" onClick={addDesign} className="text-xs font-semibold text-brand hover:underline">
                + Agregar diseño
              </button>
            </div>
            <p className="mt-1 text-[11px] text-ink/50">
              Cada diseño es una opción que ve el cliente (animales, nombres, marcas…). Si pones una
              etiqueta en “Pide dato”, el cliente escribirá su texto (ej. el nombre a grabar).
            </p>
            {designs.length === 0 ? (
              <p className="mt-2 text-xs text-ink/45">Sin diseños: el producto se compra directo.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {designs.map((d, i) => (
                  <div key={d.id} className="rounded-lg border border-line bg-white p-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={d.emoji || ""}
                        onChange={(e) => updateDesign(i, { emoji: e.target.value })}
                        placeholder="🐶"
                        className="w-12 rounded-lg border border-line px-2 py-1.5 text-center text-sm outline-none focus:border-ink"
                      />
                      <input
                        value={d.name}
                        onChange={(e) => updateDesign(i, { name: e.target.value })}
                        placeholder="Nombre del diseño (ej. Perro)"
                        className="flex-1 rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-ink"
                      />
                      <button type="button" onClick={() => removeDesign(i)} className="px-1 text-ink/40 hover:text-brand" aria-label="Quitar">✕</button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <input
                        value={d.extraCop ? String(d.extraCop) : ""}
                        onChange={(e) => updateDesign(i, { extraCop: Number(e.target.value.replace(/\D/g, "")) || undefined })}
                        inputMode="numeric"
                        placeholder="Precio extra (COP)"
                        className="rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-ink"
                      />
                      <input
                        value={d.customLabel || ""}
                        onChange={(e) => updateDesign(i, { customLabel: e.target.value })}
                        placeholder="Pide dato (ej. Nombre a grabar)"
                        className="rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-ink"
                      />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {d.image ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={d.image} alt="" className="h-10 w-10 rounded-lg border border-line object-cover" />
                          <button type="button" onClick={() => updateDesign(i, { image: undefined })} className="text-xs text-ink/50 hover:text-brand">Quitar foto</button>
                        </>
                      ) : (
                        <label className="cursor-pointer text-xs font-semibold text-brand hover:underline">
                          📷 Subir foto del diseño
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => onDesignFile(i, e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && <p className="mt-3 rounded-lg border border-brand/40 px-3 py-2 text-sm text-brand">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-5 py-2 text-sm">Cancelar</button>
          <button onClick={save} disabled={saving || !name || !price} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
