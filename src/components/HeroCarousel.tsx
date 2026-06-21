"use client";

import {
  useEffect,
  useRef,
  useState,
  CSSProperties,
  PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STYLES } from "@/data/catalog";

// 3 slides = 3 colores de marca: blanco, rojo y negro (nada de naranja).
const IMAGES = [
  {
    style: STYLES[0], // Funko Pop
    bg: "#ffffff",
    ghost: "#efe9e7",
    text: "#141414",
    sub: "#141414",
    btnBg: "#141414",
    btnText: "#ffffff",
  },
  {
    style: STYLES[1], // Disney
    bg: "#E5322D",
    ghost: "#ffffff",
    text: "#ffffff",
    sub: "#ffffff",
    btnBg: "#ffffff",
    btnText: "#E5322D",
  },
  {
    style: STYLES[2], // Realista
    bg: "#141414",
    ghost: "#ffffff",
    text: "#ffffff",
    sub: "#ffffff",
    btnBg: "#ffffff",
    btnText: "#141414",
  },
];
const N = IMAGES.length;
const EASE = "cubic-bezier(0.4,0,0.2,1)";

type Role = "center" | "left" | "right";

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const animating = useRef(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    IMAGES.forEach(({ style }) => {
      const img = new window.Image();
      img.src = style.image;
    });
  }, []);

  function navigate(dir: "next" | "prev") {
    if (animating.current) return;
    animating.current = true;
    setActiveIndex((p) => (dir === "next" ? (p + 1) % N : (p + N - 1) % N));
    setTimeout(() => {
      animating.current = false;
    }, 650);
  }

  // Arrastre con mouse / swipe táctil (sin flechas).
  const dragX = useRef<number | null>(null);
  function onPointerDown(e: ReactPointerEvent) {
    dragX.current = e.clientX;
  }
  function onPointerUp(e: ReactPointerEvent) {
    if (dragX.current === null) return;
    const dx = e.clientX - dragX.current;
    dragX.current = null;
    if (Math.abs(dx) > 45) navigate(dx < 0 ? "next" : "prev");
  }

  const active = IMAGES[activeIndex];
  const center = activeIndex;
  const right = (activeIndex + 1) % N;
  const left = (activeIndex + 2) % N;

  function roleOf(i: number): Role {
    if (i === center) return "center";
    if (i === left) return "left";
    return "right";
  }

  function styleFor(role: Role): CSSProperties {
    const base: CSSProperties = {
      position: "absolute",
      aspectRatio: "2 / 3",
      transition: `transform 650ms ${EASE}, filter 650ms ${EASE}, opacity 650ms ${EASE}, left 650ms ${EASE}, height 650ms ${EASE}`,
      willChange: "transform, filter, opacity",
    };
    if (role === "center") {
      return {
        ...base,
        left: "50%",
        bottom: isMobile ? "16%" : "5%",
        height: isMobile ? "50%" : "76%",
        transform: "translateX(-50%) scale(1)",
        filter: "none",
        opacity: 1,
        zIndex: 20,
      };
    }
    const sideHeight = isMobile ? "24%" : "40%";
    const common = {
      ...base,
      bottom: isMobile ? "30%" : "12%",
      height: sideHeight,
      transform: "translateX(-50%) scale(1)",
      filter: "blur(2px)",
      opacity: 0.85,
      zIndex: 10,
    };
    return role === "left"
      ? { ...common, left: isMobile ? "16%" : "22%" }
      : { ...common, left: isMobile ? "84%" : "78%" };
  }

  const ghost = active.style.name.toUpperCase();

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: active.bg,
        transition: `background-color 650ms ${EASE}`,
        fontFamily: "var(--font-sans), Inter, sans-serif",
      }}
    >
      <div className="relative w-full" style={{ height: "100vh", overflow: "hidden" }}>
        {/* Grano */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            zIndex: 50,
            opacity: 0.4,
            backgroundSize: "200px 200px",
            backgroundRepeat: "repeat",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Texto fantasma gigante */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2, top: "18%" }}
        >
          <span
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(70px, 22vw, 320px)",
              fontWeight: 900,
              color: active.ghost,
              transition: `color 650ms ${EASE}`,
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {ghost}
          </span>
        </div>

        {/* Carrusel */}
        <div className="absolute inset-0" style={{ zIndex: 3 }}>
          {IMAGES.map(({ style }, i) => (
            <div key={style.id} style={styleFor(roleOf(i))}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={style.image}
                alt={style.name}
                draggable={false}
                onError={(e) => {
                  const t = e.currentTarget;
                  if (!t.dataset.fb) {
                    t.dataset.fb = "1";
                    t.src = `/styles/${style.id}.svg`;
                  }
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  objectPosition: "bottom center",
                }}
              />
            </div>
          ))}
        </div>

        {/* Capa para arrastrar/deslizar (mouse y táctil). Debajo de los botones. */}
        <div
          className="absolute inset-0"
          style={{ zIndex: 40, touchAction: "pan-y", cursor: "grab" }}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={() => (dragX.current = null)}
        />

        {/* Texto + navegación abajo izquierda */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-16 sm:left-16"
          style={{ zIndex: 60, maxWidth: 360, color: active.text, transition: `color 650ms ${EASE}` }}
        >
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.25em]" style={{ opacity: 0.9 }}>
            Figuras miniko
          </p>
          <p className="font-display text-2xl font-extrabold leading-none sm:text-4xl">
            {active.style.name}
          </p>
          <p
            className="mt-3 hidden max-w-xs text-sm sm:block"
            style={{ opacity: 0.85, lineHeight: 1.6 }}
          >
            Sube tu foto y la convertimos en una figura 3D para pintar. Tres
            estilos, acabado impecable y lista para regalar.
          </p>
          <div className="mt-5 flex gap-3">
            {(["prev", "next"] as const).map((dir) => (
              <button
                key={dir}
                aria-label={dir === "prev" ? "Anterior" : "Siguiente"}
                onClick={() => navigate(dir)}
                className="grid h-12 w-12 place-items-center rounded-full transition hover:scale-110 sm:h-14 sm:w-14"
                style={{ border: `2px solid ${active.text}` }}
              >
                {dir === "prev" ? (
                  <ArrowLeft size={24} strokeWidth={2.25} />
                ) : (
                  <ArrowRight size={24} strokeWidth={2.25} />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Botón CTA abajo derecha */}
        <div className="absolute bottom-6 right-4 sm:bottom-16 sm:right-12" style={{ zIndex: 60 }}>
          <Link
            href="/pedido"
            className="group inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-bold uppercase tracking-wide shadow-lg transition hover:scale-[1.04] sm:px-9 sm:py-5 sm:text-lg"
            style={{
              backgroundColor: active.btnBg,
              color: active.btnText,
              transition: `background-color 650ms ${EASE}, color 650ms ${EASE}, transform 150ms`,
            }}
          >
            Crear la mía
            <ArrowRight className="transition-transform group-hover:translate-x-1" size={22} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}
