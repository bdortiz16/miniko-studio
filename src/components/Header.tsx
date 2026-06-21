"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";

const NAV = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#estilos", label: "Estilos" },
  { href: "/precios", label: "Precios" },
  { href: "/faq", label: "FAQ" },
];

export default function Header() {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-ink/5 bg-cream/85 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-clay to-terracotta text-white">
            M
          </span>
          <span>
            Miniko<span className="text-terracotta"> Studio</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/70 transition hover:text-ink"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/personalizar"
            className="btn-primary hidden px-5 py-2 text-sm sm:inline-flex"
          >
            Crear mi figura →
          </Link>
          <Link
            href="/carrito"
            aria-label="Carrito"
            className="relative grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white transition hover:border-ink/25"
          >
            <CartIcon />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-terracotta text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            aria-label="Menú"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 bg-white md:hidden"
          >
            <span className="text-lg">≡</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-ink/5 bg-cream md:hidden">
          <nav className="container-x flex flex-col py-3">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-2.5 text-sm font-medium text-ink/80"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/personalizar"
              onClick={() => setOpen(false)}
              className="btn-primary mt-2 text-sm"
            >
              Crear mi figura →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

function CartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
