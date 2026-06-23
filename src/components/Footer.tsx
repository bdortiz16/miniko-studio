"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Wordmark } from "./Header";
import { getSettings } from "@/lib/settings";
import { waUrl } from "@/lib/whatsapp";

export default function Footer() {
  const [contacto, setContacto] = useState("mailto:miniko.byandrea@gmail.com");
  useEffect(() => {
    getSettings()
      .then((s) => {
        const wa = waUrl(s.whatsapp, "Hola Miniko 👋, tengo una duda sobre mi pedido.");
        if (wa) setContacto(wa);
      })
      .catch(() => {});
  }, []);

  return (
    <footer className="border-t border-line bg-white">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <Wordmark className="text-xl" />
          <p className="mt-4 max-w-xs text-sm text-ink/55">
            Convertimos tus recuerdos en figuras 3D personalizadas, listas para
            pintar y regalar.
          </p>
        </div>

        <FooterCol
          title="Producto"
          links={[
            { href: "/#estilos", label: "Estilos" },
            { href: "/precios", label: "Precios" },
            { href: "/pedido", label: "Crear mi figura" },
          ]}
        />
        <FooterCol
          title="Ayuda"
          links={[
            { href: "/faq", label: "Preguntas frecuentes" },
            { href: "/#como-funciona", label: "Cómo funciona" },
            { href: contacto, label: "Contacto" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: "/terminos", label: "Términos" },
            { href: "/privacidad", label: "Privacidad" },
            { href: "/envios", label: "Envíos y devoluciones" },
          ]}
        />
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Miniko. Todos los derechos reservados.</p>
          <p>Hecho con cariño y una impresora 3D.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <Link href={l.href} className="text-sm text-ink/55 transition hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
