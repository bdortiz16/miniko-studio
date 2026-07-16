import Link from "next/link";
import type { Metadata } from "next";
import { getPet } from "@/lib/pets";
import { waUrl } from "@/lib/whatsapp";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const pet = await getPet(id);
  if (!pet) return { title: "Mascota" };
  return {
    title: `${pet.name || "Mi mascota"} · Placa miniko`,
    description: pet.lost ? `¡${pet.name} está perdido! Ayúdanos a volver a casa.` : `Placa de ${pet.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PetPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pet = await getPet(id);

  if (!pet) {
    return (
      <div className="section">
        <div className="container-x max-w-md text-center">
          <p className="text-5xl">🐾</p>
          <p className="mt-3 font-semibold">Placa no encontrada</p>
          <p className="mt-1 text-sm text-ink/55">Puede que aún no esté activada por su dueño.</p>
          <Link href="/" className="btn-primary mt-6">Ir a miniko</Link>
        </div>
      </div>
    );
  }

  const wa = pet.whatsapp ? waUrl(pet.whatsapp, `Hola, encontré a ${pet.name || "tu mascota"} 🐾`) : "";
  const tel = pet.ownerPhone ? `tel:${pet.ownerPhone.replace(/[^\d+]/g, "")}` : "";

  return (
    <div className="section">
      <div className="container-x max-w-md">
        {pet.lost && (
          <div className="mb-5 rounded-2xl border-2 border-brand bg-brand/5 p-4 text-center">
            <p className="font-display text-2xl font-extrabold text-brand">🚨 ¡Estoy perdido!</p>
            <p className="mt-1 text-sm text-ink/70">Si me encontraste, por favor avisa a mi familia.</p>
            {pet.reward && <p className="mt-2 text-sm font-bold text-ink">🎁 Recompensa: {pet.reward}</p>}
          </div>
        )}

        <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
          <div className="aspect-square w-full bg-mist">
            {pet.photo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={pet.photo} alt={pet.name} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-7xl">🐶</div>
            )}
          </div>
          <div className="p-6 text-center">
            <h1 className="font-display text-3xl font-extrabold">{pet.name || "Mi mascota"}</h1>
            <p className="mt-1 text-ink/60">
              {[pet.species, pet.breed].filter(Boolean).join(" · ") || "Mascota"}
            </p>

            {pet.notes && (
              <div className="mt-4 rounded-xl bg-mist/60 p-3 text-left text-sm text-ink/75">
                <p className="text-xs font-semibold uppercase text-ink/40">Notas</p>
                <p className="mt-1">{pet.notes}</p>
              </div>
            )}

            <div className="mt-5 border-t border-line pt-5">
              <p className="text-sm font-semibold text-ink/70">¿Me encontraste? Contacta a mi familia:</p>
              {pet.ownerName && <p className="mt-1 text-ink/60">👤 {pet.ownerName}</p>}
              <div className="mt-4 flex flex-col gap-2">
                {wa && (
                  <a href={wa} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3 font-bold text-white">
                    💬 Escribir por WhatsApp
                  </a>
                )}
                {tel && (
                  <a href={tel} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 font-bold text-white">
                    📞 Llamar {pet.ownerPhone}
                  </a>
                )}
                {!wa && !tel && (
                  <p className="text-sm text-ink/45">El dueño aún no agregó su contacto.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-ink/40">
          Placa inteligente de <Link href="/" className="font-semibold text-brand">miniko</Link>
        </p>
      </div>
    </div>
  );
}
