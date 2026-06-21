import Image from "next/image";
import Link from "next/link";
import { FigureStyle } from "@/data/catalog";

export default function StyleCard({ style }: { style: FigureStyle }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-ink/30">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist">
        <Image
          src={style.image}
          alt={`Estilo ${style.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {style.premium && (
          <span className="absolute right-0 top-4 rounded-l-full border-y border-l border-brand bg-white px-3 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand">
            Premium
          </span>
        )}
        <span className="absolute left-4 top-4 rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-ink">
          {style.tagline}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold">{style.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/55">
          {style.description}
        </p>
        <Link
          href={`/pedido?estilo=${style.id}`}
          className="mt-5 inline-flex items-center gap-1 font-semibold text-ink underline decoration-brand decoration-2 underline-offset-4 transition hover:gap-2"
        >
          Elegir este estilo →
        </Link>
      </div>
    </div>
  );
}
