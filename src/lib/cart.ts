"use client";

import { useEffect, useState } from "react";

// Carrito de la Tienda, guardado en localStorage. Se sincroniza entre
// componentes (badge, drawer, página de producto) con un evento propio.
export interface CartItem {
  key: string; // productId + designId + customText (para agrupar)
  productId: string;
  name: string;
  unitCop: number; // precio unitario (incluye extra del diseño)
  qty: number;
  designId?: string;
  designName?: string;
  customText?: string;
  image?: string;
  emoji?: string;
  accent?: string;
}

const KEY = "miniko_cart";
const EVENT = "miniko-cart-change";

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

export function addToCart(item: Omit<CartItem, "key">) {
  const key = `${item.productId}|${item.designId || ""}|${item.customText || ""}`;
  const items = read();
  const existing = items.find((i) => i.key === key);
  if (existing) {
    existing.qty = Math.min(20, existing.qty + item.qty);
  } else {
    items.push({ ...item, key });
  }
  write(items);
}

export function setQty(key: string, qty: number) {
  const items = read().map((i) => (i.key === key ? { ...i, qty: Math.max(1, Math.min(20, qty)) } : i));
  write(items);
}

export function removeItem(key: string) {
  write(read().filter((i) => i.key !== key));
}

export function clearCart() {
  write([]);
}

// Hook reactivo: devuelve los items y se actualiza al cambiar el carrito.
export function useCart(): CartItem[] {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(read());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}
