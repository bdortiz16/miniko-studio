// Iconos propios de miniko, pequeños y en línea con el texto (sustituyen emojis
// del sistema). Heredan el color del texto (currentColor). Tamaño por defecto 1em.
import { SVGProps } from "react";

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: "1.05em",
  height: "1.05em",
  "aria-hidden": true as const,
};

type P = SVGProps<SVGSVGElement>;
const cls = "inline-block shrink-0 align-[-0.15em]";

// Figurita coleccionable (cabezón sobre base) — el icono de "figura".
export function MiFigure({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <circle cx="12" cy="6" r="3.2" />
      <path d="M8 21v-4.5a4 4 0 0 1 8 0V21" />
      <path d="M6.5 21h11" />
    </svg>
  );
}

// Caja / paquete.
export function MiBox({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <path d="M3 7.5 12 3l9 4.5v9L12 21 3 16.5z" />
      <path d="M3 7.5 12 12l9-4.5M12 12v9" />
    </svg>
  );
}

// Camión de envío.
export function MiTruck({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <path d="M2 6.5h11v9H2zM13 9.5h4l3 3v3h-7z" />
      <circle cx="6" cy="17.5" r="1.8" />
      <circle cx="17" cy="17.5" r="1.8" />
    </svg>
  );
}

// Personas / grupo.
export function MiPeople({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <circle cx="8.5" cy="8" r="3" />
      <path d="M3 19.5a5.5 5.5 0 0 1 11 0" />
      <path d="M16 5.6a3 3 0 0 1 0 5.8M16.5 15c2.5.4 4.5 2.3 4.5 4.5" />
    </svg>
  );
}

// Cámara de fotos.
export function MiCamera({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <path d="M3 8.5h3l1.5-2h7L15 8.5h3a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.5a2 2 0 0 1 1-1.5z" />
      <circle cx="12" cy="13" r="3.2" />
    </svg>
  );
}

// Huella de mascota.
export function MiPaw({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <ellipse cx="12" cy="16" rx="4" ry="3.3" />
      <circle cx="6.5" cy="11" r="1.6" />
      <circle cx="17.5" cy="11" r="1.6" />
      <circle cx="9.5" cy="7.5" r="1.6" />
      <circle cx="14.5" cy="7.5" r="1.6" />
    </svg>
  );
}

// Check en círculo — pago aprobado.
export function MiCheck({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.2l2.6 2.6L16 9.5" />
    </svg>
  );
}

// Reloj — pago en proceso / cargando.
export function MiClock({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

// X en círculo — pago rechazado/anulado.
export function MiX({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

// Triángulo de alerta — error.
export function MiWarn({ className = "", ...p }: P) {
  return (
    <svg {...base} className={`${cls} ${className}`} {...p}>
      <path d="M12 4 2.5 20h19L12 4z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
