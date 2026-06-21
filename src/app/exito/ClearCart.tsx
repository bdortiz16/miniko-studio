"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart";

// Vacía el carrito una vez que el usuario llega a la página de éxito.
export default function ClearCart() {
  const { clear } = useCart();
  useEffect(() => {
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}
