import Image from "next/image";
import Link from "next/link";
import { STYLES, VARIANTS, formatEur } from "@/data/catalog";
import StyleCard from "@/components/StyleCard";

const STEPS = [
  { n: "1", title: "Elige tu estilo", desc: "Kawaii, realista o caricatura: tú decides el look.", icon: "🎨" },
  { n: "2", title: "Sube tu foto", desc: "Creamos un modelo 3D personalizado a partir de tu imagen.", icon: "📷" },
  { n: "3", title: "Recibe tu kit", desc: "Impreso en 3D y listo en tu casa, sin pintar.", icon: "🎁" },
  { n: "4", title: "Píntalo y disfruta", desc: "Un recuerdo único hecho con tus propias manos.", icon: "🖌️" },
];

export default function Home() {
  const fromPrice = Math.min(...VARIANTS.map((v) => v.priceCents));

  return (
    <>
      {/* HERO */}
      <section className="border-b border-line">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="container-x py-16 sm:py-24 lg:max-w-none lg:pr-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-1.5 text-xs font-semibold text-ink/70">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Hecho a partir de tu foto
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
              Convierte tu foto en una <span className="text-brand">figura 3D</span> personalizada
            </h1>
            <p className="mt-5 max-w-md text-lg text-ink/65">
              Sube una foto y la transformamos en una figura 3D para pintar tú
              mismo. El regalo más personal que existe.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-ink/60">
              <span>🧑‍🤝‍🧑 100% personalizado</span>
              <span>🎨 Sin pintar / DIY</span>
              <span>🎁 Listo para regalar</span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/pedido" className="btn-primary">Crear mi figura →</Link>
              <Link href="/#como-funciona" className="btn-secondary">Cómo funciona</Link>
            </div>
            <p className="mt-5 text-sm text-ink/50">
              Desde {formatEur(fromPrice)} · Envío 4,99 € · Gratis a partir de 55 €
            </p>
          </div>

          <div className="relative h-72 border-l border-line bg-mist sm:h-96 lg:h-[34rem]">
            <Image
              src="/styles/hero.svg"
              alt="Figura 3D personalizada"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como-funciona" className="section">
        <div className="container-x">
          <SectionTitle kicker="Sencillo" title="Cómo funciona" subtitle="De tu foto a tu estantería en cuatro pasos." />
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s) => (
              <div key={s.n} className="text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-line text-3xl">
                  {s.icon}
                </div>
                <div className="mt-5 text-xs font-bold text-brand">PASO {s.n}</div>
                <h3 className="mt-1 font-display text-lg font-bold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-[15rem] text-sm text-ink/55">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ESTILOS */}
      <section id="estilos" className="section bg-mist">
        <div className="container-x">
          <SectionTitle kicker="Tres looks" title="Elige tu estilo" subtitle="Cada estilo le da una personalidad distinta a tu figura." />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {STYLES.map((style) => (
              <StyleCard key={style.id} style={style} />
            ))}
          </div>
        </div>
      </section>

      {/* QUÉ INCLUYE */}
      <section className="section">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-line bg-mist">
            <Image src="/styles/kit.svg" alt="Contenido del kit miniko" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand">El kit</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">Una foto. Un kit inolvidable.</h2>
            <div className="mt-4 h-px w-16 bg-brand/70" />
            <ul className="mt-8 space-y-4">
              {[
                "Tu figura 3D impresa en PLA premium, sin pintar",
                "Pinturas acrílicas a juego con tu personaje",
                "Pinceles, base y guía de pintado paso a paso",
                "Caja lista para regalar",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brand text-brand">✓</span>
                  <span className="text-ink/75">{item}</span>
                </li>
              ))}
            </ul>
            <Link href="/pedido" className="btn-primary mt-9">Quiero el mío →</Link>
            <p className="mt-4 text-xs text-ink/40">* Las imágenes del producto son orientativas. El kit real puede variar.</p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section pt-0">
        <div className="container-x">
          <div className="rounded-2xl border border-line p-10 text-center sm:p-16">
            <div className="mx-auto mb-6 h-px w-16 bg-brand/70" />
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">¿Listo para inmortalizar tu momento?</h2>
            <p className="mx-auto mt-4 max-w-xl text-ink/60">Sube tu foto hoy y recibe una figura única que durará para siempre.</p>
            <Link href="/pedido" className="btn-primary mt-8">Crear mi figura →</Link>
          </div>
        </div>
      </section>
    </>
  );
}

function SectionTitle({ kicker, title, subtitle }: { kicker: string; title: string; subtitle: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-brand">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">{title}</h2>
      <div className="mx-auto mt-4 h-px w-16 bg-brand/70" />
      <p className="mx-auto mt-4 max-w-xl text-ink/60">{subtitle}</p>
    </div>
  );
}
