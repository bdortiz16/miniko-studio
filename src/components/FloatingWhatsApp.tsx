"use client";

import { useEffect, useState } from "react";
import { getSettings } from "@/lib/settings";
import { waUrl } from "@/lib/whatsapp";
import { MiFigure } from "@/components/MiniIcons";

// Botón flotante de soporte por WhatsApp (Funko). El número se configura en el
// panel. Aparece en la esquina al bajar (para no chocar con el botón del hero).
export default function FloatingWhatsApp() {
  const [href, setHref] = useState("");
  const [icon, setIcon] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setHref(waUrl(s.whatsapp, "Hola Miniko 👋, tengo una duda sobre mi pedido."));
        if (s.whatsappIcon) setIcon(s.whatsappIcon);
      })
      .catch(() => {});

    const onScroll = () => setShow(window.scrollY > 260);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label="Soporte por WhatsApp"
      className={`fixed bottom-4 right-3 z-[70] flex flex-col items-end gap-1 transition-all duration-300 sm:bottom-5 sm:right-5 ${
        show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
      }`}
    >
      {/* Nube de saludo */}
      <span className="relative mr-2 rounded-2xl bg-white px-3 py-1.5 text-sm font-bold text-ink shadow-lg ring-1 ring-line">
        ¡Hola! 👋
        <span className="absolute -bottom-1.5 right-4 h-3 w-3 rotate-45 bg-white" />
      </span>
      {icon ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={icon}
          alt="Soporte por WhatsApp"
          className="h-20 w-20 origin-bottom object-contain drop-shadow-xl animate-wave"
        />
      ) : (
        <span className="grid h-16 w-16 place-items-center rounded-full border-2 border-[#25D366] bg-white shadow-lg animate-wave">
          <MiFigure className="h-9 w-9 text-ink" />
        </span>
      )}
    </a>
  );
}
