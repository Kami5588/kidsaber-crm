import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import UnitSwitcher from "@/components/UnitSwitcher";
import { getActiveUnit, getActiveUnitId, listUnits } from "@/lib/units";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const units = listUnits();
  const activeUnitId = getActiveUnitId();
  const activeUnit = getActiveUnit();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar userName={session.user?.name} />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="z-40 flex-shrink-0 border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {activeUnit ? `Unidade ${activeUnit.name}` : "Rede KidSaber"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {activeUnit
                  ? `${activeUnit.city} · ${activeUnit.state}`
                  : `Visão consolidada · ${units.length} ${units.length === 1 ? "unidade" : "unidades"}`}
              </p>
            </div>

            <div className="w-72 flex-shrink-0">
              <UnitSwitcher units={units} activeUnitId={activeUnitId} />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
