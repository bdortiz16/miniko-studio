import { ReactNode } from "react";

// Layout reutilizable para las páginas legales (términos, privacidad, envíos).
export default function LegalDoc({
  kicker,
  title,
  updated,
  children,
}: {
  kicker: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="section">
      <div className="container-x max-w-3xl">
        <header>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">{kicker}</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold">{title}</h1>
          <div className="mt-4 h-px w-16 bg-brand/70" />
          <p className="mt-4 text-sm text-ink/50">Última actualización: {updated}</p>
        </header>
        <div className="mt-10 space-y-8">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink/70">{children}</div>
    </section>
  );
}
