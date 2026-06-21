import { Suspense } from "react";
import Link from "next/link";
import ClearCart from "./ClearCart";

export const metadata = {
  title: "¡Pedido confirmado! — Miniko Studio",
};

export default function ExitoPage() {
  return (
    <div className="section">
      <div className="container-x max-w-xl text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-green-100 text-5xl">
          🎉
        </div>
        <h1 className="mt-7 font-display text-3xl font-extrabold">
          ¡Gracias por tu pedido!
        </h1>
        <p className="mt-4 text-ink/65">
          Hemos recibido tu pago correctamente. En breve te enviaremos un email de
          confirmación con los siguientes pasos para subir tu foto y empezar a
          crear tu figura 3D.
        </p>
        <div className="mt-8 rounded-2xl bg-sand p-6 text-left text-sm text-ink/70">
          <p className="font-semibold text-ink">¿Qué pasa ahora?</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>Revisa tu correo para encontrar el enlace de subida de foto.</li>
            <li>Nuestro equipo modela e imprime tu figura (3–5 días laborables).</li>
            <li>Recibes tu kit listo para pintar.</li>
          </ol>
        </div>
        <Link href="/" className="btn-primary mt-8">
          Volver al inicio
        </Link>
      </div>
      <Suspense fallback={null}>
        <ClearCart />
      </Suspense>
    </div>
  );
}
