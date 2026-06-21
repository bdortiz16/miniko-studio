import { Suspense } from "react";
import ExitoClient from "./ExitoClient";

export const metadata = {
  title: "Estado del pedido — miniko",
};

export default function ExitoPage() {
  return (
    <Suspense fallback={<div className="container-x section">Cargando…</div>}>
      <ExitoClient />
    </Suspense>
  );
}
