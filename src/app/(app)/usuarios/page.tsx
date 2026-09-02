import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentUser, ROLES } from "@/lib/permissions";
import { listLinkableProfessionals, listUsers } from "@/lib/users";
import UsersPanel from "@/components/UsersPanel";
import AccessRequestsPanel from "@/components/AccessRequestsPanel";
import { listAccessRequests } from "@/lib/access-requests";
import { googleEnabled } from "@/lib/auth";

export const metadata = { title: "Contas de acesso · KidSaber Connect" };

export default async function UsuariosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "ADMIN") {
    return (
      <div className="card flex items-start gap-3 p-6">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy-600" />
        <div>
          <p className="font-semibold text-slate-800">Acesso restrito</p>
          <p className="mt-1 text-sm text-slate-600">
            Somente a administração da clínica cria e gerencia contas de acesso.
          </p>
        </div>
      </div>
    );
  }

  const users = listUsers();
  const professionals = listLinkableProfessionals();
  const requests = listAccessRequests();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Contas de acesso</h1>
        <p className="text-slate-600">
          Crie logins para a equipe e defina o que cada pessoa enxerga no sistema.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {ROLES.map((r) => (
          <div key={r.value} className="card p-5">
            <p className="text-sm font-bold text-navy-800">{r.label}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{r.description}</p>
          </div>
        ))}
      </div>

      {googleEnabled && (
        <div className="mb-6">
          <AccessRequestsPanel
            requests={requests.map((r) => ({
              id: r.id,
              email: r.email,
              name: r.name,
              picture: r.picture,
              status: r.status,
              reviewedByName: r.reviewedByName,
              reviewedAt: r.reviewedAt,
              createdAt: r.createdAt,
            }))}
            professionals={professionals.map((p) => ({
              id: p.id as string,
              fullName: p.fullName as string,
              specialty: (p.specialty as string) ?? null,
            }))}
          />
        </div>
      )}

      <UsersPanel
        users={users.map((u) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          professionalId: u.professionalId,
          title: u.title,
          jobTitle: u.jobTitle,
          active: u.active,
          mustChangePassword: u.mustChangePassword,
          displayName: u.displayName,
          professionalName: u.professionalName,
          specialty: u.specialty,
        }))}
        professionals={professionals.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          specialty: p.specialty,
        }))}
        currentUserId={user.id}
      />
    </div>
  );
}
