"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MiCheck, MiClock, MiX, MiWarn } from "@/components/MiniIcons";

type State = "loading" | "APPROVED" | "PENDING" | "DECLINED" | "VOIDED" | "ERROR";

export default function ExitoClient() {
  const params = useSearchParams();
  // Wompi redirige con ?id=<transactionId>
  const id = params.get("id");
  const [state, setState] = useState<State>(id ? "loading" : "APPROVED");

  useEffect(() => {
    if (!id) return;
    let tries = 0;
    let stop = false;
    async function check() {
      try {
        const res = await fetch(`/api/wompi/verify?id=${encodeURIComponent(id!)}`);
        const data = await res.json();
        if (stop) return;
        if (data.status === "APPROVED") return setState("APPROVED");
        if (["DECLINED", "VOIDED", "ERROR"].includes(data.status)) return setState(data.status);
        // Aún PENDING: reintenta unas pocas veces.
        if (tries++ < 5) setTimeout(check, 2000);
        else setState("PENDING");
      } catch {
        if (tries++ < 5) setTimeout(check, 2000);
        else setState("PENDING");
      }
    }
    check();
    return () => {
      stop = true;
    };
  }, [id]);

  const ui = {
    loading: { Icon: MiClock, color: "text-ink/40", title: "Confirmando tu pago…", desc: "Un momento, estamos verificando la transacción con Wompi." },
    APPROVED: { Icon: MiCheck, color: "text-green-600", title: "¡Gracias por tu pedido!", desc: "Tu pago fue aprobado. En breve recibirás un correo de confirmación con los siguientes pasos para crear tu figura 3D." },
    PENDING: { Icon: MiClock, color: "text-amber-500", title: "Pago en proceso", desc: "Tu pago está siendo procesado. Te avisaremos por correo en cuanto se confirme. Puede tardar unos minutos." },
    DECLINED: { Icon: MiX, color: "text-brand", title: "Pago rechazado", desc: "Tu pago no pudo completarse. Puedes intentarlo de nuevo con otro medio de pago." },
    VOIDED: { Icon: MiX, color: "text-brand", title: "Pago anulado", desc: "La transacción fue anulada. Puedes intentarlo de nuevo." },
    ERROR: { Icon: MiWarn, color: "text-brand", title: "Hubo un problema", desc: "Ocurrió un error con el pago. Intenta de nuevo o contáctanos." },
  }[state];
  const StateIcon = ui.Icon;

  const ok = state === "APPROVED";
  const failed = ["DECLINED", "VOIDED", "ERROR"].includes(state);

  return (
    <div className="section">
      <div className="container-x max-w-xl text-center">
        <div className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-brand/50">
          <StateIcon className={`h-12 w-12 ${ui.color}`} />
        </div>
        <h1 className="mt-7 font-display text-3xl font-extrabold">{ui.title}</h1>
        <p className="mt-4 text-ink/60">{ui.desc}</p>
        <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />

        {ok && (
          <div className="mt-8 rounded-2xl border border-line p-6 text-left text-sm text-ink/70">
            <p className="font-semibold text-ink">¿Qué pasa ahora?</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5">
              <li>Revisa tu correo para la confirmación del pedido.</li>
              <li>Nuestro equipo modela tu figura y te envía un render a aprobar.</li>
              <li>Imprimimos y te enviamos tu kit listo para pintar.</li>
            </ol>
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {failed && (
            <Link href="/pedido" className="btn-primary">
              Intentar de nuevo
            </Link>
          )}
          {ok && (
            <Link href="/mis-pedidos" className="btn-primary">
              Ver mis pedidos →
            </Link>
          )}
          <Link href="/" className={ok || failed ? "btn-secondary" : "btn-primary"}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
