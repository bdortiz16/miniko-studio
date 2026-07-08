"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Wordmark } from "@/components/Header";
import AdminAssistant from "@/components/AdminAssistant";
import AdminIdle from "@/components/AdminIdle";
import AdminSessionGate from "@/components/AdminSessionGate";
import { MiGrid, MiBox, MiPeople, MiChart, MiTag, MiTicket, MiMail, MiGear, MiUser, MiBag } from "@/components/MiniIcons";

const NAV = [
  { href: "/panel-mk9z3", label: "Dashboard", Icon: MiGrid },
  { href: "/panel-mk9z3/pedidos", label: "Pedidos", Icon: MiBox },
  { href: "/panel-mk9z3/tienda", label: "Tienda", Icon: MiBag },
  { href: "/panel-mk9z3/clientes", label: "Clientes", Icon: MiPeople },
  { href: "/panel-mk9z3/contabilidad", label: "Contabilidad", Icon: MiChart },
  { href: "/panel-mk9z3/promociones", label: "Promociones", Icon: MiTicket },
  { href: "/panel-mk9z3/correos", label: "Correos", Icon: MiMail },
  { href: "/panel-mk9z3/precios", label: "Precios y envío", Icon: MiTag },
  { href: "/panel-mk9z3/perfil", label: "Perfil", Icon: MiUser },
  { href: "/panel-mk9z3/configuracion", label: "Configuración", Icon: MiGear },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // La página de login no lleva el panel (aún no hay sesión).
  if (pathname === "/panel-mk9z3/login") {
    return <div className="min-h-screen bg-mist">{children}</div>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/panel-mk9z3/login");
  }

  return (
    <div className="flex min-h-screen bg-mist">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white p-5 md:flex">
        <Link href="/panel-mk9z3" className="flex items-center gap-2">
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

      {/* Cada pestaña nueva debe iniciar sesión (clave + código) */}
      <AdminSessionGate />
      {/* Asistente global: campana + Funko con avisos de pedidos */}
      <AdminAssistant />
      {/* Cierre de sesión por inactividad (2 h) */}
      <AdminIdle />
    </div>
  );
}
