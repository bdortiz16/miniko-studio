import Link from "next/link";

export const metadata = {
  title: "¡Pedido confirmado! — miniko",
};

export default function ExitoPage() {
  return (
    <div className="section">
      <div className="container-x max-w-xl text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-brand/50 text-5xl">
          🎉
        </div>
        <h1 className="mt-7 font-display text-3xl font-extrabold">
          ¡Gracias por tu pedido!
        </h1>
        <p className="mt-4 text-ink/60">
          Hemos recibido tu pago correctamente. En breve te enviaremos un email de
          confirmación con los siguientes pasos para crear tu figura 3D.
        </p>
        <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
        <div className="mt-8 rounded-2xl border border-line p-6 text-left text-sm text-ink/70">
          <p className="font-semibold text-ink">¿Qué pasa ahora?</p>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5">
            <li>Revisa tu correo para la confirmación del pedido.</li>
            <li>Nuestro equipo modela tu figura y te envía un render a aprobar.</li>
            <li>Imprimimos y te enviamos tu kit listo para pintar.</li>
          </ol>
        </div>
        <Link href="/" className="btn-primary mt-8">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
