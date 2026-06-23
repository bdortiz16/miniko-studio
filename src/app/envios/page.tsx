import LegalDoc, { LegalSection } from "@/components/LegalDoc";

export const metadata = { title: "Envíos y devoluciones — Miniko" };

export default function EnviosPage() {
  return (
    <LegalDoc kicker="Legal" title="Envíos y devoluciones" updated="23 de junio de 2026">
      <LegalSection title="Cobertura y transportadoras">
        <p>
          Enviamos a todo Colombia a través de transportadoras aliadas (Servientrega, Coordinadora,
          Inter Rapidísimo, TCC, entre otras). La transportadora se asigna según la mejor opción para
          tu dirección de destino.
        </p>
      </LegalSection>
      <LegalSection title="Tiempos de entrega">
        <p>
          La producción (modelado e impresión 3D) tarda de 3 a 5 días hábiles. A eso se suma el
          tiempo de la transportadora, que varía según la ciudad. Los plazos son estimados.
        </p>
      </LegalSection>
      <LegalSection title="Costo y seguimiento">
        <p>
          El costo de envío se muestra en el checkout antes de pagar. Cuando tu pedido sale del
          taller, te enviamos por correo el <strong>número de guía</strong> para que puedas rastrear
          tu paquete. También puedes consultar el estado en la sección <strong>Mis pedidos</strong>.
        </p>
      </LegalSection>
      <LegalSection title="Cambios y devoluciones">
        <p>
          Al tratarse de un producto <strong>personalizado y hecho a la medida</strong>, no aplican
          cambios ni devoluciones por arrepentimiento una vez iniciada la producción.
        </p>
        <p>
          Si tu pedido llega <strong>defectuoso, dañado o equivocado</strong>, escríbenos dentro de
          los <strong>5 días</strong> siguientes a la entrega con fotos del problema y lo
          solucionamos con una reposición sin costo.
        </p>
      </LegalSection>
      <LegalSection title="Contacto">
        <p>
          Para temas de envíos o incidencias, escríbenos a{" "}
          <a href="mailto:miniko.byandrea@gmail.com" className="text-brand underline">
            miniko.byandrea@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
