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
      className="group fixed bottom-24 right-3 z-[70] flex flex-col items-center gap-1 sm:bottom-28 sm:right-5"
    >
      {/* Nube de saludo */}
      <span className="relative rounded-2xl bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-lg">
        ¡Hola! 👋
        <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-white" />
      </span>
      {icon ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={icon}
          alt="Soporte por WhatsApp"
          className="h-24 w-24 origin-bottom object-contain drop-shadow-xl animate-wave"
        />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#25D366] bg-white shadow-lg animate-wave">
          <MiFigure className="h-9 w-9 text-ink" />
        </span>
      )}
    </a>
  );
}
