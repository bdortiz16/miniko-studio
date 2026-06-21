import Image from "next/image";
import Link from "next/link";
import { FigureStyle } from "@/data/catalog";

export default function StyleCard({ style }: { style: FigureStyle }) {
  return (
    <div className="group flex flex-col overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{ backgroundColor: `${style.accent}22` }}
      >
        <Image
          src={style.image}
          alt={`Estilo ${style.name}`}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          className="absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: style.accent }}
        >
          {style.tagline}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-display text-xl font-bold">{style.name}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/60">
          {style.description}
        </p>
        <Link
          href={`/personalizar?estilo=${style.id}`}
          className="mt-5 inline-flex items-center gap-1 font-semibold text-terracotta transition hover:gap-2"
        >
          Elegir este estilo →
        </Link>
      </div>
    </div>
  );
}
