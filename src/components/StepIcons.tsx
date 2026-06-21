// Iconos propios de miniko, estilo "Funko Pop" / coleccionable: trazo negro
// redondeado con acentos en rojo de marca. Sustituyen a los emojis del sistema.
// Pensados para verse dentro de un círculo (≈40px). viewBox 0 0 48 48.

const INK = "#141414";
const RED = "#E5322D";

type IconProps = { className?: string };

const base = {
  width: 40,
  height: 40,
  viewBox: "0 0 48 48",
  fill: "none",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

// 1. Estilo — paleta de pintor con un pegote de pintura rojo.
export function IconEstilo({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path
        d="M24 7C14.6 7 7 13.9 7 22.4c0 5.2 3.7 8.2 8.2 8.2 2.6 0 3.9 1.7 3.9 3.6 0 1.2-.6 2-.6 3.1 0 2 1.7 3.7 4.5 3.7C33.9 41 41 33.4 41 24 41 14.6 33.4 7 24 7Z"
        stroke={INK}
      />
      <circle cx="16.5" cy="20" r="2.3" fill={INK} />
      <circle cx="24" cy="15.5" r="2.3" fill={INK} />
      <circle cx="31.5" cy="20" r="2.3" fill={RED} />
      <circle cx="32.5" cy="28.5" r="2.3" fill={INK} />
    </svg>
  );
}

// 2. Foto — cámara con destello rojo en el lente.
export function IconFoto({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <rect x="6" y="15" width="36" height="25" rx="5" stroke={INK} />
      <path d="M17 15l3-5h8l3 5" stroke={INK} />
      <circle cx="24" cy="28" r="7" stroke={INK} />
      <circle cx="24" cy="28" r="2.6" fill={RED} />
      <circle cx="35.5" cy="20.5" r="1.4" fill={INK} />
    </svg>
  );
}

// 3. Kit — caja regalo con lazo rojo.
export function IconKit({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M9 21h30v16a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V21Z" stroke={INK} />
      <rect x="7" y="15" width="34" height="6" rx="2" stroke={INK} />
      <path d="M24 15v25" stroke={RED} />
      <path
        d="M24 15c-1-3-4-6-7-6s-4 4-1 5 8 1 8 1Zm0 0c1-3 4-6 7-6s4 4 1 5-8 1-8 1Z"
        stroke={RED}
      />
    </svg>
  );
}

// 4. Pintar — pincel con la punta roja.
export function IconPintar({ className }: IconProps) {
  return (
    <svg {...base} className={className} aria-hidden="true">
      <path d="M40 8c-4 2-15 9-20 14l6 6c5-5 12-16 14-20Z" stroke={INK} />
      <path d="M20 22l6 6" stroke={INK} />
      <path
        d="M20 28c-3 0-6 2-7 5-1 2-2 3-4 3 2 3 6 5 9 4 3-1 5-4 5-7 0-3-1.5-5-3-5Z"
        stroke={RED}
        fill="none"
      />
    </svg>
  );
}
