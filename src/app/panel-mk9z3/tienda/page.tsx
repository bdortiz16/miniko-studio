"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products";

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
  const [stock, setStock] = useState(typeof product?.stock === "number" ? String(product.stock) : "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          stock: stock === "" ? undefined : Number(stock),
          active: product ? product.active : true,
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
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs font-medium text-ink/60">
              Precio (COP)
              <input value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="15000" className={`mt-1 ${input}`} />
            </label>
            <label className="block text-xs font-medium text-ink/60">
              Stock (opcional)
              <input value={stock} onChange={(e) => setStock(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="—" className={`mt-1 ${input}`} />
            </label>
          </div>
          <label className="block text-xs font-medium text-ink/60">
            Descripción
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Impreso en 3D, resistente, varios colores." className={`mt-1 ${input}`} />
          </label>
          <div>
            <p className="text-xs font-medium text-ink/60">Imagen</p>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-mist">
                {image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full w-full place-items-center text-xl text-ink/30">📦</div>
                )}
              </div>
              <label className="cursor-pointer rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink/70 hover:border-ink">
                {uploading ? "Subiendo…" : image ? "Cambiar imagen" : "Subir imagen"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
              </label>
            </div>
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
