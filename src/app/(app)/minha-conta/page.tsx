import { redirect } from "next/navigation";
import { UserCircle, ShieldCheck } from "lucide-react";
import { getCurrentUser, ROLES } from "@/lib/permissions";
import ChangePasswordForm from "@/components/ChangePasswordForm";

export const metadata = { title: "Minha conta · KidSaber Connect" };

export default async function MinhaContaPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const role = ROLES.find((r) => r.value === user.role);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Minha conta</h1>
        <p className="text-slate-500">Seus dados de acesso e a senha do sistema.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
            <UserCircle className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-navy-800">Seus dados</h2>

          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Nome exibido</dt>
              <dd className="text-right font-medium text-slate-800">{user.displayName}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">E-mail de acesso</dt>
              <dd className="break-all text-right font-medium text-slate-800">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4 border-b border-slate-100 pb-3">
              <dt className="text-slate-500">Perfil</dt>
              <dd className="text-right font-medium text-slate-800">{role?.label ?? user.role}</dd>
            </div>
            {user.jobTitle && (
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Cargo</dt>
                <dd className="text-right font-medium text-slate-800">{user.jobTitle}</dd>
              </div>
            )}
          </dl>

          <p className="mt-5 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-600">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-teal-500" />
            {role?.description}
          </p>

          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            Nome, perfil e cargo são definidos pela administração. Para alterá-los, fale com quem
            administra o sistema.
          </p>
        </section>

        <ChangePasswordForm />
      </div>
    </div>
  );
}
