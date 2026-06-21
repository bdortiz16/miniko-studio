import { Suspense } from "react";
import Personalizar from "./Personalizar";

export const metadata = {
  title: "Crear mi figura — Miniko Studio",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="container-x section">Cargando…</div>}>
      <Personalizar />
    </Suspense>
  );
}
