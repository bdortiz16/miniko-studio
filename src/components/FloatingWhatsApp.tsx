"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/settings";
import { waUrl } from "@/lib/whatsapp";
import { MiFigure } from "@/components/MiniIcons";

// Botón flotante de soporte por WhatsApp con figura tipo Funko. El número se
// configura en el panel admin (Precios y envío). Si no hay número, no aparece.
export default function FloatingWhatsApp() {
  const [href, setHref] = useState("");

  useEffect(() => {
    getSettings()
      .then((s) => setHref(waUrl(s.whatsapp, "Hola Miniko 👋, tengo una duda sobre mi pedido.")))
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
      <span className="relative grid h-16 w-16 place-items-center rounded-full border-2 border-[#25D366] bg-white shadow-lg transition hover:scale-105">
        <MiFigure className="h-9 w-9 text-ink" />
        <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-[#25D366] text-white shadow">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.13c-1.52 0-3.01-.41-4.3-1.18l-.31-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.35c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.42-8.25 8.42zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z" />
          </svg>
        </span>
      </span>
    </a>
  );
}
