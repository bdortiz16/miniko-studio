import { Suspense } from "react";
import Wizard from "../pedido/Wizard";

export const metadata = {
  title: "Figura de tu mascota — miniko",
};

export default function Page() {
  return (
    <Suspense fallback={<div className="container-x section">Cargando…</div>}>
      <Wizard forcePet />
    </Suspense>
  );
}
