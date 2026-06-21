import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-sand/60">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2 font-display text-lg font-extrabold">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-clay to-terracotta text-white">
              M
            </span>
            Miniko Studio
          </div>
          <p className="mt-4 max-w-xs text-sm text-ink/60">
            Convertimos tus recuerdos en figuras 3D personalizadas, listas para
            pintar y regalar.
          </p>
        </div>

        <FooterCol
          title="Producto"
          links={[
            { href: "/#estilos", label: "Estilos" },
            { href: "/precios", label: "Precios" },
            { href: "/personalizar", label: "Crear mi figura" },
          ]}
        />
        <FooterCol
          title="Ayuda"
          links={[
            { href: "/faq", label: "Preguntas frecuentes" },
            { href: "/#como-funciona", label: "Cómo funciona" },
            { href: "mailto:hola@miniko.studio", label: "Contacto" },
          ]}
        />
        <FooterCol
          title="Legal"
          links={[
            { href: "#", label: "Términos" },
            { href: "#", label: "Privacidad" },
            { href: "#", label: "Envíos y devoluciones" },
          ]}
        />
      </div>
      <div className="border-t border-ink/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-xs text-ink/50 sm:flex-row">
          <p>© {new Date().getFullYear()} Miniko Studio. Todos los derechos reservados.</p>
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
            <Link href={l.href} className="text-sm text-ink/60 transition hover:text-ink">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
