"use client";

import Link from "next/link";
import { useState } from "react";

const NAV = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#estilos", label: "Estilos" },
  { href: "/#mascotas", label: "Mascotas" },
  { href: "/precios", label: "Precios" },
  { href: "/faq", label: "FAQ" },
];

// Huellita de mascota (rellena), pequeña.
function Paw({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`fill-brand ${className}`}>
      <ellipse cx="12" cy="15.5" rx="5" ry="4" />
      <circle cx="5.5" cy="9.5" r="1.9" />
      <circle cx="18.5" cy="9.5" r="1.9" />
      <circle cx="9" cy="6" r="1.9" />
      <circle cx="15" cy="6" r="1.9" />
    </svg>
  );
}

// Fila de huellitas animadas que caminan (aparecen una tras otra).
function PawTrail() {
  return (
    <span className="pointer-events-none absolute -top-2.5 left-1/2 flex -translate-x-1/2 items-end gap-[3px]">
      <Paw className="animate-paw h-2 w-2 -rotate-12 [animation-delay:0ms]" />
      <Paw className="animate-paw h-2.5 w-2.5 translate-y-[-2px] [animation-delay:220ms]" />
      <Paw className="animate-paw h-2 w-2 rotate-12 [animation-delay:440ms]" />
    </span>
  );
}

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
          className="animate-star absolute -top-[0.18em] left-[112%] h-[0.46em] w-[0.46em] fill-brand"
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
    <header className="sticky top-0 z-50 border-b-2 border-brand bg-white/95 backdrop-blur-md">
      <div className="container-x flex h-[68px] items-center justify-between gap-4">
        <Link href="/" aria-label="Miniko" className="flex items-center">
          <Wordmark className="text-2xl" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => {
            const isMascotas = item.href === "/#mascotas";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative text-[13px] font-semibold uppercase tracking-wider transition ${
                  isMascotas ? "text-brand hover:text-brand" : "text-ink/70 hover:text-ink"
                }`}
              >
                {isMascotas && <PawTrail />}
                {item.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-brand transition-all duration-300 group-hover:w-full" />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/mis-pedidos"
            className="hidden items-center gap-1.5 rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white transition hover:scale-[1.03] hover:bg-black sm:inline-flex"
          >
            Mis pedidos
            <span className="text-brand">→</span>
          </Link>
          <button
            aria-label="Menú"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/15 bg-white md:hidden"
          >
            <span className="text-lg">≡</span>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-white md:hidden">
          <nav className="container-x flex flex-col py-3">
            {NAV.map((item) => {
              const isMascotas = item.href === "/#mascotas";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-2 py-2.5 text-sm font-medium ${
                    isMascotas ? "font-bold text-brand" : "text-ink/80"
                  }`}
                >
                  {item.label}
                  {isMascotas && (
                    <span className="flex items-end gap-[3px]">
                      <Paw className="animate-paw h-2.5 w-2.5 -rotate-12 [animation-delay:0ms]" />
                      <Paw className="animate-paw h-3 w-3 [animation-delay:220ms]" />
                      <Paw className="animate-paw h-2.5 w-2.5 rotate-12 [animation-delay:440ms]" />
                    </span>
                  )}
                </Link>
              );
            })}
            <Link href="/mis-pedidos" onClick={() => setOpen(false)} className="btn-primary mt-2 text-sm">
              Mis pedidos →
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
