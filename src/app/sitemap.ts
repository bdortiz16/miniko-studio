import type { MetadataRoute } from "next";
import { listProducts } from "@/lib/products";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://miniko.com.co";

// Mapa del sitio para Google: páginas públicas + productos de la tienda.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = ["", "/pedido", "/tienda", "/precios", "/faq", "/mascotas", "/terminos", "/privacidad", "/envios"];
  const base: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  try {
    const products = (await listProducts()).filter((p) => p.active);
    for (const p of products) {
      base.push({ url: `${SITE_URL}/tienda/${p.id}`, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {}

  return base;
}
