"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/Header";
import AdminAssistant from "@/components/AdminAssistant";
import { MiGrid, MiBox, MiPeople, MiChart, MiTag, MiGear } from "@/components/MiniIcons";

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: MiGrid },
  { href: "/admin/pedidos", label: "Pedidos", Icon: MiBox },
  { href: "/admin/clientes", label: "Clientes", Icon: MiPeople },
  { href: "/admin/contabilidad", label: "Contabilidad", Icon: MiChart },
  { href: "/admin/precios", label: "Precios y envío", Icon: MiTag },
  { href: "/admin/configuracion", label: "Configuración", Icon: MiGear },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // La página de login no lleva el panel (aún no hay sesión).
  if (pathname === "/admin/login") {
    return <div className="min-h-screen bg-mist">{children}</div>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-mist">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white p-5 md:flex">
        <Link href="/admin" className="flex items-center gap-2">
          <Wordmark className="text-xl" />
          <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            admin
          </span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((n) => {
            const active = pathname === n.href;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  active ? "bg-ink text-white" : "text-ink/70 hover:bg-mist"
                }`}
              >
                <n.Icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={logout}
          className="mt-auto rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-ink/70 transition hover:border-ink/30 hover:text-ink"
        >
          ← Cerrar sesión
        </button>
      </aside>

      {/* Contenido */}
      <div className="flex min-h-screen flex-1 flex-col">
        {/* Barra superior (móvil) */}
        <div className="flex items-center justify-between border-b border-line bg-white px-5 py-3 md:hidden">
          <Wordmark className="text-lg" />
          <div className="flex items-center gap-1 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className={`rounded-lg p-2 ${pathname === n.href ? "text-brand" : "text-ink/60"}`}>
                <n.Icon className="h-5 w-5" />
              </Link>
            ))}
            <button onClick={logout} className="rounded-lg p-2 text-ink/60">
              ↩
            </button>
          </div>
        </div>
        <main className="flex-1 p-6 sm:p-10">{children}</main>
      </div>

      {/* Asistente global: campana + Funko con avisos de pedidos */}
      <AdminAssistant />
    </div>
  );
}
