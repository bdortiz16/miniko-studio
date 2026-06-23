"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/settings";
import { waUrl } from "@/lib/whatsapp";
import { MiFigure } from "@/components/MiniIcons";

// Botón flotante de soporte por WhatsApp con figura tipo Funko. El número se
// configura en el panel admin (Precios y envío). Si no hay número, no aparece.
export default function FloatingWhatsApp() {
  const [href, setHref] = useState("");
  const [icon, setIcon] = useState("");

  useEffect(() => {
    getSettings()
      .then((s) => {
        setHref(waUrl(s.whatsapp, "Hola Miniko 👋, tengo una duda sobre mi pedido."));
        if (s.whatsappIcon) setIcon(s.whatsappIcon);
      })
      .catch(() => {});
  }, []);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Soporte por WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-2"
    >
      <span className="hidden rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-ink shadow-md sm:group-hover:inline-block">
        ¿Dudas? Escríbenos
      </span>
      {icon ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={icon}
          alt="Soporte por WhatsApp"
          className="h-24 w-24 object-contain drop-shadow-xl transition hover:scale-105"
        />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#25D366] bg-white shadow-lg">
          <MiFigure className="h-9 w-9 text-ink" />
        </span>
      )}
    </a>
  );
}
