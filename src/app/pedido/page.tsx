import { Suspense } from "react";
import Wizard from "./Wizard";

export const metadata = {
  title: "Crear mi figura — miniko",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="container-x section">Cargando…</div>}>
      <Wizard />
    </Suspense>
  );
}
