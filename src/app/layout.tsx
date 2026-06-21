import type { Metadata } from "next";
import { Inter, Poppins, Anton } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

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

export const metadata: Metadata = {
  title: "miniko — Tu foto convertida en figura 3D para pintar",
  description:
    "Convertimos tu foto favorita en una figura 3D personalizada en 3 estilos: Kawaii, Realista y Caricatura. Un regalo único hecho a mano.",
  keywords: [
    "figuras 3D personalizadas",
    "regalo personalizado",
    "figura para pintar",
    "impresión 3D",
    "miniko",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${inter.variable} ${poppins.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
