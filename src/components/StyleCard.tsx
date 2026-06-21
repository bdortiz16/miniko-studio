import Link from "next/link";
import { FigureStyle } from "@/data/catalog";
import StyleImage from "@/components/StyleImage";

export default function StyleCard({ style }: { style: FigureStyle }) {
  return (
    <Link
      href={`/pedido?estilo=${style.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-white transition hover:-translate-y-1 hover:border-ink/30 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-mist">
        <StyleImage
          src={style.image}
          fallback={`/styles/${style.id}.svg`}
          alt={`Estilo ${style.name}`}
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain p-3 transition duration-500 group-hover:scale-105"
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
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">{style.name}</h3>
          <span className="grid h-8 w-8 place-items-center rounded-full border border-line text-ink transition group-hover:border-brand group-hover:bg-brand group-hover:text-white">
            →
          </span>
        </div>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/55">
          {style.description}
        </p>
      </div>
    </Link>
  );
}
