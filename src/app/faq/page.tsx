export const metadata = {
  title: "Preguntas frecuentes — Miniko Studio",
};

const FAQS = [
  {
    q: "¿Qué recibo exactamente en mi kit?",
    a: "Recibes tu figura 3D personalizada sin pintar, un set de pinturas acrílicas a juego con tu personaje, pinceles, una base y una guía de pintado paso a paso. Todo viene en una caja lista para regalar.",
  },
  {
    q: "¿Puedo pedir una figura con varias personas?",
    a: "Sí. Puedes elegir entre figura individual, pareja/dúo o grupo de hasta cuatro personajes. Selecciona el tamaño que mejor se ajuste a tu foto al personalizar tu pedido.",
  },
  {
    q: "¿De qué material está hecha la figura?",
    a: "Cada figura se imprime en 3D con PLA premium, un plástico de origen vegetal resistente y con un acabado ideal para pintar con acrílicos.",
  },
  {
    q: "¿Cuánto tarda en llegar mi pedido?",
    a: "El modelado y la impresión 3D tardan de 3 a 5 días laborables. A eso se suma el tiempo de envío estándar. Recibirás un email con el seguimiento en cuanto salga del taller.",
  },
  {
    q: "¿Necesito experiencia pintando?",
    a: "Para nada. Las figuras vienen con números y una guía paso a paso. Es una actividad apta desde los 5 años y perfecta para hacer en pareja o en familia.",
  },
  {
    q: "¿Puedo regalar un kit?",
    a: "¡Claro! Todos los kits llegan en una caja lista para regalar. Puedes enviarlo directamente a la persona destinataria indicando su dirección en el checkout.",
  },
  {
    q: "¿Qué tipo de foto funciona mejor?",
    a: "Las fotos nítidas, bien iluminadas y donde se vea bien la cara funcionan mejor. Tras el pago te pediremos la imagen y nuestro equipo te confirmará si es adecuada antes de modelar.",
  },
  {
    q: "¿Cómo se realiza el pago?",
    a: "El pago se procesa de forma segura a través de Stripe. Aceptamos las principales tarjetas de crédito y débito.",
  },
];

export default function FaqPage() {
  return (
    <div className="section">
      <div className="container-x max-w-3xl">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-terracotta">
            Ayuda
          </p>
          <h1 className="mt-3 font-display text-4xl font-extrabold">
            Preguntas frecuentes
          </h1>
          <p className="mt-3 text-ink/60">
            Todo lo que necesitas saber antes de pedir.
          </p>
        </header>

        <div className="mt-12 divide-y divide-ink/10 rounded-3xl border border-ink/10 bg-white">
          {FAQS.map((item) => (
            <details key={item.q} className="group px-6 py-5 [&_summary]:list-none">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                {item.q}
                <span className="text-terracotta transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-ink/65">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
