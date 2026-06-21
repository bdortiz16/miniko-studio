"use client";

import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#estilos", label: "Estilos" },
  { href: "/precios", label: "Precios" },
  { href: "/faq", label: "FAQ" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display font-extrabold lowercase tracking-tight ${className}`}>
      <span className="text-brand">mini</span>
      <span className="text-ink">k</span>
      <span className="relative inline-block text-ink">
        o
        <svg
          viewBox="0 0 32 32"
          aria-hidden="true"
          className="absolute -top-[0.34em] left-[112%] h-[0.46em] w-[0.46em] -translate-x-1/2 fill-brand"
        >
          <path d="M16 4l3.6 7.3 8.1 1.2-5.9 5.7 1.4 8.1-7.2-3.8-7.2 3.8 1.4-8.1-5.9-5.7 8.1-1.2z" />
        </svg>
      </span>
    </span>
  );
}

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="container-x flex h-16 items-center justify-between gap-4">
        <Link href="/" aria-label="Miniko" className="flex items-center">
          <Wordmark className="text-2xl" />
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
          <Link href="/pedido" className="btn-primary hidden px-5 py-2 text-sm sm:inline-flex">
            Crear mi figura →
          </Link>
          <button
            aria-label="Menú"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-white md:hidden"
          >
            <span className="text-lg">≡</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white md:hidden">
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
            <Link href="/pedido" onClick={() => setOpen(false)} className="btn-primary mt-2 text-sm">
              Crear mi figura →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
