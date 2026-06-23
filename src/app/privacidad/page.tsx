import LegalDoc, { LegalSection } from "@/components/LegalDoc";

export const metadata = { title: "Política de privacidad — Miniko" };

export default function PrivacidadPage() {
  return (
    <LegalDoc kicker="Legal" title="Política de privacidad" updated="23 de junio de 2026">
      <LegalSection title="1. Responsable del tratamiento">
        <p>
          Miniko (Pereira, Risaralda, Colombia) es responsable de los datos personales que recogemos
          a través de este sitio. Tratamos tus datos conforme a la Ley 1581 de 2012 (Habeas Data) y
          sus normas reglamentarias.
        </p>
      </LegalSection>
      <LegalSection title="2. Qué datos recogemos">
        <p>Para procesar tu pedido recogemos:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Datos de contacto: nombre y correo electrónico.</li>
          <li>Datos de envío: dirección, ciudad, departamento y teléfono.</li>
          <li>La(s) foto(s) que subes para crear tu figura.</li>
          <li>Datos del pago, gestionados directamente por Wompi (no almacenamos tu tarjeta).</li>
        </ul>
      </LegalSection>
      <LegalSection title="3. Para qué los usamos">
        <p>
          Usamos tus datos para crear tu figura, procesar el pago, gestionar el envío y comunicarnos
          contigo sobre el estado de tu pedido. No vendemos tus datos a terceros.
        </p>
      </LegalSection>
      <LegalSection title="4. Con quién los compartimos">
        <p>
          Compartimos solo lo necesario con proveedores que nos ayudan a operar: pasarela de pagos
          (Wompi), transportadoras y plataformas logísticas para el envío, servicio de correo
          transaccional (Resend) y proveedores de procesamiento y almacenamiento de imágenes.
        </p>
      </LegalSection>
      <LegalSection title="5. Conservación">
        <p>
          Conservamos tus datos el tiempo necesario para cumplir con tu pedido y con nuestras
          obligaciones legales y contables. Las fotos se usan únicamente para producir tu figura.
        </p>
      </LegalSection>
      <LegalSection title="6. Tus derechos">
        <p>
          Puedes conocer, actualizar, rectificar o solicitar la eliminación de tus datos en cualquier
          momento escribiéndonos a{" "}
          <a href="mailto:miniko.byandrea@gmail.com" className="text-brand underline">
            miniko.byandrea@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
