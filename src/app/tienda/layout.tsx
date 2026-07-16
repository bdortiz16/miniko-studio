import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda — Llaveros y artículos 3D personalizados",
  description:
    "Llaveros, soportes, macetas y más artículos impresos en 3D, personalizables. Elige el diseño, agrégale tus datos y te lo enviamos a toda Colombia.",
  alternates: { canonical: "/tienda" },
  openGraph: {
    title: "Tienda miniko — Llaveros y artículos 3D",
    description: "Productos 3D personalizables. Elige diseño, personaliza y recibe en casa.",
  },
};

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
