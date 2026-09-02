import { redirect } from "next/navigation";
import Link from "next/link";
import { KeyRound } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import UnitSwitcher from "@/components/UnitSwitcher";
import QuickSearch from "@/components/QuickSearch";
import { getActiveUnit, getActiveUnitId, listUnits } from "@/lib/units";
import { getCurrentUser } from "@/lib/permissions";
import { getUserById } from "@/lib/users";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const units = listUnits();
  const activeUnitId = getActiveUnitId();
  const activeUnit = getActiveUnit();

  // Só admin e recepção trabalham com a rede inteira; para o profissional, o
  // seletor de unidade não muda nada, porque o recorte já é por paciente.
  const showUnitSwitcher = user.role !== "PROFISSIONAL";

  const stored = getUserById(user.id);
  const mustChangePassword = stored?.mustChangePassword === 1;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar userName={user.displayName} role={user.role} jobTitle={user.jobTitle} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header aria-label="Barra superior" className="z-40 flex-shrink-0 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3 pl-20 lg:pl-6">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {showUnitSwitcher
                  ? activeUnit
                    ? `Unidade ${activeUnit.name}`
                    : "Rede KidSaber"
                  : "Área do profissional"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {showUnitSwitcher
                  ? activeUnit
                    ? `${activeUnit.city} · ${activeUnit.state}`
                    : `Visão consolidada · ${units.length} ${units.length === 1 ? "unidade" : "unidades"}`
                  : "Você vê apenas os pacientes que atende"}
              </p>
            </div>

            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="hidden min-w-0 max-w-xs flex-1 md:block">
                <QuickSearch />
              </div>

              {showUnitSwitcher && (
                <div className="w-44 flex-shrink-0 sm:w-72">
                  <UnitSwitcher units={units} activeUnitId={activeUnitId} />
                </div>
              )}
            </div>
          </div>
        </header>

        <main id="conteudo" tabIndex={-1} className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">
            {mustChangePassword && (
              <div
                role="status"
                className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold-200 bg-gold-50 px-5 py-4"
              >
                <p className="flex items-center gap-2.5 text-sm text-gold-900">
                  <KeyRound className="h-4 w-4 flex-shrink-0" />
                  Sua senha ainda é a inicial. Defina uma senha pessoal antes de continuar usando o
                  sistema.
                </p>
                <Link href="/minha-conta" className="btn-gold">
                  Alterar senha
                </Link>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
