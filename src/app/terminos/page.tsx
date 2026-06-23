import LegalDoc, { LegalSection } from "@/components/LegalDoc";

export const metadata = { title: "Términos y condiciones — Miniko" };

export default function TerminosPage() {
  return (
    <LegalDoc kicker="Legal" title="Términos y condiciones" updated="23 de junio de 2026">
      <LegalSection title="1. Quiénes somos">
        <p>
          Miniko es una marca colombiana con sede en Pereira (Risaralda) que crea figuras 3D
          personalizadas a partir de las fotos de nuestros clientes. Al usar este sitio y realizar
          un pedido, aceptas estos términos.
        </p>
      </LegalSection>
      <LegalSection title="2. El producto">
        <p>
          Cada figura es un producto <strong>hecho por encargo y personalizado</strong> con base en
          la foto que nos envías. La vista previa generada con inteligencia artificial es
          <strong> orientativa</strong>: muestra una aproximación del estilo, no el resultado final
          exacto. El acabado, colores y proporciones pueden variar respecto a la vista previa.
        </p>
      </LegalSection>
      <LegalSection title="3. Pedidos y pagos">
        <p>
          Los precios se muestran en pesos colombianos (COP) e incluyen lo indicado en cada paquete.
          El pago se procesa de forma segura a través de <strong>Wompi</strong>. Un pedido se
          considera confirmado únicamente cuando el pago ha sido aprobado.
        </p>
      </LegalSection>
      <LegalSection title="4. Uso de tus imágenes">
        <p>
          Al subir una foto, declaras que tienes derecho a usarla y nos autorizas a procesarla con el
          único fin de crear tu figura. No usaremos tus fotos para publicidad sin tu permiso. No se
          aceptan imágenes ilegales, ofensivas o que vulneren derechos de terceros.
        </p>
      </LegalSection>
      <LegalSection title="5. Tiempos de producción y envío">
        <p>
          El modelado y la impresión 3D tardan habitualmente de 3 a 5 días hábiles, a lo que se suma
          el tiempo de la transportadora. Estos plazos son estimados y pueden variar según la demanda
          y la ciudad de destino.
        </p>
      </LegalSection>
      <LegalSection title="6. Responsabilidad">
        <p>
          Hacemos nuestro mejor esfuerzo para lograr el mayor parecido posible, pero al tratarse de un
          producto artístico y personalizado no garantizamos una réplica exacta. Nuestra
          responsabilidad se limita al valor del pedido.
        </p>
      </LegalSection>
      <LegalSection title="7. Contacto">
        <p>
          Para cualquier duda sobre estos términos, escríbenos a{" "}
          <a href="mailto:miniko.byandrea@gmail.com" className="text-brand underline">
            miniko.byandrea@gmail.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
