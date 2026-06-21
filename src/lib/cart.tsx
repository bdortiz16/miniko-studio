"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";
import {
  StyleId,
  VARIANTS,
  STYLES,
  variantById,
  styleById,
  SHIPPING,
} from "@/data/catalog";

export interface CartItem {
  lineId: string;
  styleId: StyleId;
  variantId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (styleId: StyleId, variantId: string, quantity?: number) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "miniko-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  function addItem(styleId: StyleId, variantId: string, quantity = 1) {
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.styleId === styleId && i.variantId === variantId
      );
      if (existing) {
        return prev.map((i) =>
          i.lineId === existing.lineId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [
        ...prev,
        {
          lineId: `${styleId}-${variantId}-${Date.now()}`,
          styleId,
          variantId,
          quantity,
        },
      ];
    });
  }

  function removeItem(lineId: string) {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  }

  function updateQuantity(lineId: string, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
        .filter((i) => i.quantity > 0)
    );
  }

  function clear() {
    setItems([]);
  }

  const subtotalCents = useMemo(
    () =>
      items.reduce((sum, item) => {
        const v = variantById(item.variantId);
        return sum + (v ? v.priceCents * item.quantity : 0);
      }, 0),
    [items]
  );

  const shippingCents =
    subtotalCents === 0 || subtotalCents >= SHIPPING.freeThresholdCents
      ? 0
      : SHIPPING.flatCents;

  const value: CartContextValue = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotalCents,
    shippingCents,
    totalCents: subtotalCents + shippingCents,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart debe usarse dentro de <CartProvider>");
  return ctx;
}

// Helpers para mostrar nombres legibles en la UI del carrito.
export function describeItem(item: CartItem) {
  const style = styleById(item.styleId);
  const variant = variantById(item.variantId);
  return {
    styleName: style?.name ?? item.styleId,
    styleImage: style?.image,
    variantName: variant?.name ?? item.variantId,
    unitCents: variant?.priceCents ?? 0,
  };
}

export { VARIANTS, STYLES };
