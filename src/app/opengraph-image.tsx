import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "miniko — figuras 3D personalizadas";

// Imagen de vista previa social (Open Graph). Se genera con la marca miniko.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fff 0%, #fdecec 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", fontSize: 130, fontWeight: 800, color: "#111" }}>
          <span style={{ color: "#E5322D" }}>mini</span>
          <span>ko</span>
          <span style={{ color: "#E5322D", fontSize: 60, marginTop: 10 }}>★</span>
        </div>
        <div style={{ marginTop: 20, fontSize: 40, color: "#333", maxWidth: 900, textAlign: "center" }}>
          Tu foto convertida en figura 3D pintada a mano
        </div>
        <div style={{ marginTop: 16, fontSize: 28, color: "#888" }}>
          Figuras · Llaveros · Artículos 3D · Envíos a toda Colombia
        </div>
      </div>
    ),
    { ...size }
  );
}
