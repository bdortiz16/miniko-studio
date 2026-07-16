import { Suspense } from "react";
import Link from "next/link";
import Wizard from "../pedido/Wizard";

export const metadata = {
  title: "Mascotas — Figura 3D y Placa NFC",
  description:
    "Para tu mascota: una figura 3D personalizada para pintar y una placa NFC/QR con su nombre y tu contacto por si se pierde.",
};

export default function Page() {
  return (
    <div>
      {/* Dos opciones para la mascota */}
      <section className="section pb-0">
        <div className="container-x">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col rounded-2xl border-2 border-brand bg-white p-5">
              <p className="text-3xl">🐾</p>
              <h2 className="mt-2 font-display text-xl font-extrabold">Figura 3D de tu mascota</h2>
              <p className="mt-1 flex-1 text-sm text-ink/60">Sube su foto y la convertimos en una figura para pintar. Elige el estilo abajo. 👇</p>
              <span className="mt-3 text-sm font-bold text-brand">Empieza aquí abajo ↓</span>
            </div>
            <Link href="/tienda/demo-placa-nfc" className="flex flex-col rounded-2xl border border-line bg-white p-5 transition hover:border-ink/30 hover:shadow-lg">
              <p className="text-3xl">🦴</p>
              <h2 className="mt-2 font-display text-xl font-extrabold">Placa NFC de mascota</h2>
              <p className="mt-1 flex-1 text-sm text-ink/60">Placa con su nombre + chip NFC/QR. Si se pierde, quien la encuentre ve tu contacto.</p>
              <span className="mt-3 text-sm font-bold text-brand">Ver la placa →</span>
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="container-x section">Cargando…</div>}>
        <Wizard forcePet />
      </Suspense>
    </div>
  );
}
