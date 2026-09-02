import { getServerSession } from "next-auth";
import { ScrollText, Search, ShieldCheck, AlertTriangle, Activity } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { authOptions } from "@/lib/auth";
import { auditStats, listAuditLog } from "@/lib/audit";

export const metadata = { title: "Auditoria de acesso · KidSaber Connect" };

/** Cor por tipo de ação, para o olho achar o que importa na lista. */
const ACTION_STYLE: Record<string, string> = {
  LOGIN_SUCESSO: "bg-teal-50 text-teal-700",
  LOGIN_FALHA: "bg-gold-50 text-gold-800",
  LOGIN_BLOQUEADO: "bg-coral-50 text-coral-700",
  VISUALIZAR: "bg-navy-50 text-navy-700",
  CRIAR: "bg-teal-50 text-teal-700",
  EDITAR: "bg-navy-50 text-navy-700",
  EXCLUIR: "bg-coral-50 text-coral-700",
  EXPORTAR_DADOS: "bg-gold-50 text-gold-800",
  EXCLUIR_DADOS_TITULAR: "bg-coral-50 text-coral-700",
};

const ACTION_LABEL: Record<string, string> = {
  LOGIN_SUCESSO: "Entrou no sistema",
  LOGIN_FALHA: "Tentativa de login falhou",
  LOGIN_BLOQUEADO: "Login bloqueado",
  VISUALIZAR: "Visualizou",
  LISTAR: "Listou",
  CRIAR: "Cadastrou",
  EDITAR: "Alterou",
  EXCLUIR: "Excluiu",
  EXPORTAR_DADOS: "Exportou dados do titular",
  EXCLUIR_DADOS_TITULAR: "Eliminou dados do titular",
};

function fmt(iso?: string) {
  if (!iso) return "-";
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm:ss", { locale: ptBR });
  } catch {
    return iso;
  }
}

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: { q?: string; acao?: string };
}) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  if (!isAdmin) {
    return (
      <div className="card flex items-start gap-3 p-6">
        <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-navy-600" />
        <div>
          <p className="font-semibold text-slate-800">Acesso restrito</p>
          <p className="mt-1 text-sm text-slate-600">
            A trilha de auditoria registra quem acessou prontuários e só pode ser consultada pela
            administração da clínica.
          </p>
        </div>
      </div>
    );
  }

  const stats = auditStats();
  const rows = listAuditLog({ email: searchParams.q, action: searchParams.acao });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Auditoria de acesso</h1>
        <p className="text-slate-600">
          Quem acessou ou alterou dados, quando e de onde. Registros mantidos por 180 dias.
        </p>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-700 text-white">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            <p className="text-sm text-slate-600">Registros na trilha</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-white">
            <Activity className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.last24h}</p>
            <p className="text-sm text-slate-600">Acessos nas últimas 24h</p>
          </div>
        </div>
        <div className="card flex items-center gap-4 p-5">
          <span
            className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${
              stats.failedLogins > 0 ? "bg-coral-500" : "bg-gold-500"
            }`}
          >
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{stats.failedLogins}</p>
            <p className="text-sm text-slate-600">Logins falhos em 7 dias</p>
          </div>
        </div>
      </div>

      <form className="mb-5 flex flex-wrap items-end gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
          <input
            type="text"
            name="q"
            defaultValue={searchParams.q}
            placeholder="Filtrar por e-mail..."
            className="input input-with-icon w-64"
          />
        </div>
        {/*
          A primeira opção diz "Todas as ações", mas isso é o valor, não o nome
          do campo: sem o rótulo, o leitor de tela anuncia apenas "caixa de
          combinação" e não diz o que ela filtra.
        */}
        <select
          name="acao"
          defaultValue={searchParams.acao ?? ""}
          aria-label="Filtrar por tipo de ação"
          className="input w-56"
        >
          <option value="">Todas as ações</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button type="submit" className="btn-secondary">Filtrar</button>
      </form>

      <div tabIndex={0} role="region" aria-label="Registros de acesso" className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50/60">
            <tr className="text-xs uppercase tracking-wide text-slate-600">
              <th scope="col" className="whitespace-nowrap px-4 py-3">Data e hora</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Usuário</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Ação</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Registro</th>
              <th scope="col" className="px-4 py-3">Detalhe</th>
              <th scope="col" className="whitespace-nowrap px-4 py-3">Origem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{fmt(r.createdAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                  {r.userEmail ?? "-"}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      ACTION_STYLE[r.action] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {ACTION_LABEL[r.action] ?? r.action}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                  {r.entity ? `${r.entity}${r.entityId ? ` · ${String(r.entityId).slice(0, 8)}` : ""}` : "-"}
                </td>
                <td className="max-w-md px-4 py-3 text-slate-600">{r.detail ?? "-"}</td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                  {r.ip ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
