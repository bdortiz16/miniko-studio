"use client";

import { useEffect, useRef, useState, CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { STYLES } from "@/data/catalog";

// 3 personajes = los 3 estilos (Funko Pop, Disney, Realista).
const IMAGES = [
  { style: STYLES[0], bg: "#F4845F", panel: "#F79B7F" }, // Funko Pop
  { style: STYLES[1], bg: "#6EB5FF", panel: "#8DC4FF" }, // Disney
  { style: STYLES[2], bg: "#6BBF7A", panel: "#85CC92" }, // Realista
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

  // Precarga de imágenes.
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

  const center = activeIndex;
  const right = (activeIndex + 1) % N;
  const left = (activeIndex + 2) % N;

  function roleOf(i: number): Role {
    if (i === center) return "center";
    if (i === left) return "left";
    return "right";
  }

  function styleFor(role: Role): CSSProperties {
    // Caja cuadrada (igual que las imágenes) => la figura se ve completa, sin
    // cortar la cabeza, con objectFit contain.
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
        bottom: isMobile ? "18%" : "5%",
        height: isMobile ? "50%" : "76%",
        transform: "translateX(-50%) scale(1)",
        filter: "none",
        opacity: 1,
        zIndex: 20,
      };
    }
    const sideHeight = isMobile ? "24%" : "40%";
    if (role === "left") {
      return {
        ...base,
        left: isMobile ? "16%" : "22%",
        bottom: isMobile ? "30%" : "12%",
        height: sideHeight,
        transform: "translateX(-50%) scale(1)",
        filter: "blur(2px)",
        opacity: 0.85,
        zIndex: 10,
      };
    }
    return {
      ...base,
      left: isMobile ? "84%" : "78%",
      bottom: isMobile ? "30%" : "12%",
      height: sideHeight,
      transform: "translateX(-50%) scale(1)",
      filter: "blur(2px)",
      opacity: 0.85,
      zIndex: 10,
    };
  }

  const ghost = IMAGES[activeIndex].style.name.toUpperCase();

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        backgroundColor: IMAGES[activeIndex].bg,
        transition: `background-color 650ms ${EASE}`,
        fontFamily: "var(--font-sans), Inter, sans-serif",
      }}
    >
      <div className="relative w-full" style={{ height: "100vh", overflow: "hidden" }}>
        {/* 1. Grano */}
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

        {/* 2. Texto fantasma gigante (nombre del estilo activo) */}
        <div
          className="absolute inset-x-0 flex items-center justify-center pointer-events-none select-none"
          style={{ zIndex: 2, top: "18%" }}
        >
          <span
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(70px, 22vw, 320px)",
              fontWeight: 900,
              color: "#fff",
              lineHeight: 1,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
            }}
          >
            {ghost}
          </span>
        </div>

        {/* 3. Carrusel */}
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

        {/* 5. Texto + navegación abajo izquierda */}
        <div
          className="absolute bottom-6 left-4 sm:bottom-20 sm:left-24"
          style={{ zIndex: 60, maxWidth: 340 }}
        >
          <p
            className="mb-2 sm:mb-3 text-base sm:text-[22px] font-bold uppercase tracking-widest text-white"
            style={{ opacity: 0.95, letterSpacing: "0.02em" }}
          >
            Figuras miniko · {IMAGES[activeIndex].style.name}
          </p>
          <p
            className="hidden sm:block text-xs sm:text-sm text-white mb-4 sm:mb-5"
            style={{ opacity: 0.85, lineHeight: 1.6 }}
          >
            Sube tu foto y la convertimos en una figura 3D para pintar. Tres
            estilos, un acabado impecable y lista para regalar. ¡Crea la tuya ahora!
          </p>
          <div className="flex gap-3">
            <button
              aria-label="Anterior"
              onClick={() => navigate("prev")}
              className="grid place-items-center w-12 h-12 sm:w-16 sm:h-16 rounded-full text-white"
              style={{
                background: "transparent",
                border: "2px solid #fff",
                transition: "transform 150ms, background-color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ArrowLeft size={26} strokeWidth={2.25} />
            </button>
            <button
              aria-label="Siguiente"
              onClick={() => navigate("next")}
              className="grid place-items-center w-12 h-12 sm:w-16 sm:h-16 rounded-full text-white"
              style={{
                background: "transparent",
                border: "2px solid #fff",
                transition: "transform 150ms, background-color 150ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.08)";
                e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <ArrowRight size={26} strokeWidth={2.25} />
            </button>
          </div>
        </div>

        {/* 6. Enlace abajo derecha */}
        <div
          className="absolute bottom-6 right-4 sm:bottom-20 sm:right-10"
          style={{ zIndex: 60 }}
        >
          <Link
            href="/pedido"
            className="flex items-center text-white no-underline"
            style={{
              fontFamily: "var(--font-anton), sans-serif",
              fontSize: "clamp(20px, 4vw, 56px)",
              fontWeight: 400,
              opacity: 0.95,
              letterSpacing: "-0.02em",
              lineHeight: 1,
              textTransform: "uppercase",
              transition: "opacity 200ms",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.95")}
          >
            Crear la mía
            <ArrowRight className="w-5 h-5 sm:w-8 sm:h-8 ml-1" strokeWidth={2.25} />
          </Link>
        </div>
      </div>
    </div>
  );
}
