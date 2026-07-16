import type { Metadata } from "next";
import { Inter, Poppins, Anton } from "next/font/google";
import "./globals.css";
import LayoutChrome from "@/components/LayoutChrome";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-anton",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://miniko.com.co";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "miniko — Tu foto convertida en figura 3D personalizada | Colombia",
    template: "%s · miniko",
  },
  description:
    "Convertimos tu foto en una figura coleccionable 3D pintada a mano, en 3 estilos: Clásico, Animado y Realista. También llaveros y artículos 3D. Envíos a toda Colombia. 🎁",
  keywords: [
    "figuras 3D personalizadas",
    "figura de tu foto",
    "regalo personalizado Colombia",
    "llaveros 3D",
    "impresión 3D",
    "funko personalizado",
    "figura de mascota",
    "miniko",
  ],
  applicationName: "miniko",
  authors: [{ name: "miniko" }],
  creator: "miniko",
  alternates: { canonical: SITE_URL },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: SITE_URL,
    siteName: "miniko",
    title: "miniko — Tu foto convertida en figura 3D personalizada",
    description:
      "Figuras coleccionables 3D pintadas a mano a partir de tu foto, en 3 estilos. Llaveros y artículos 3D. Envíos a toda Colombia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "miniko — Tu foto convertida en figura 3D personalizada",
    description:
      "Figuras 3D pintadas a mano a partir de tu foto. Llaveros y artículos 3D. Envíos a toda Colombia.",
  },
  category: "shopping",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable} ${anton.variable}`}>
      <body className="flex min-h-screen flex-col">
        <LayoutChrome>{children}</LayoutChrome>
      </body>
    </html>
  );
}
