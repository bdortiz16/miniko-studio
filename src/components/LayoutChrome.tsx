"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

// La zona /admin usa su propio layout (dashboard). El resto del sitio lleva la
// cabecera y el pie públicos.
export default function LayoutChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
