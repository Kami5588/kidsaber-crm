import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  DatabaseBackup, Download, ShieldAlert, CheckCircle2, Clock, HardDrive, Info,
} from "lucide-react";
import { getCurrentUser } from "@/lib/permissions";
import { estadoBackup, tamanhoLegivel, MANTER_COPIAS } from "@/lib/backup";

export const metadata = { title: "Cópias de segurança · KidSaber Connect" };

export default async function BackupPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") notFound();

  const { copias, ultima, horasDesdeUltima, totalBytes } = estadoBackup();

  // Mais de 36 horas sem cópia indica que a rotina parou: ela roda na subida do
  // processo e uma vez por dia.
  const atrasada = horasDesdeUltima !== null && horasDesdeUltima > 36;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Cópias de segurança</h1>
        <p className="text-slate-600">
          O sistema guarda uma cópia do banco por dia, mantendo as {MANTER_COPIAS} mais recentes.
        </p>
      </div>

      {/* Estado da rotina */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="card flex items-center gap-4 p-5">
          <span
            className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white ${
              ultima && !atrasada ? "bg-teal-500" : "bg-coral-500"
            }`}
          >
            {ultima && !atrasada ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <ShieldAlert className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800">
              {!ultima ? "Nenhuma cópia" : atrasada ? "Rotina atrasada" : "Em dia"}
            </p>
            <p className="truncate text-sm text-slate-600">
              {ultima
                ? `Última: ${format(parseISO(ultima.criadaEm), "dd/MM 'às' HH:mm", { locale: ptBR })}`
                : "A rotina ainda não rodou"}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-navy-700 text-white">
            <DatabaseBackup className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{copias.length}</p>
            <p className="text-sm text-slate-600">Cópias guardadas</p>
          </div>
        </div>

        <div className="card flex items-center gap-4 p-5">
          <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-slate-700 text-white">
            <HardDrive className="h-5 w-5" />
          </span>
          <div>
            <p className="text-2xl font-bold text-slate-800">{tamanhoLegivel(totalBytes)}</p>
            <p className="text-sm text-slate-600">Espaço ocupado</p>
          </div>
        </div>
      </div>

      {/*
        O aviso mais importante da tela. As cópias moram no mesmo volume do
        banco: elas salvam de uma exclusão errada, não da perda do volume.
      */}
      <div className="mb-6 flex gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-5">
        <Info aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-gold-800" />
        <div>
          <p className="font-bold text-navy-900">Baixe uma cópia de vez em quando</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-700">
            As cópias ficam no mesmo disco do banco. Elas resolvem exclusão acidental, corrupção do
            arquivo ou a necessidade de voltar ao estado de ontem — mas não protegem contra a perda
            do disco inteiro. Guardar um arquivo baixado fora do servidor, de tempos em tempos, é o
            que fecha esse risco.
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">
            O arquivo contém dados de pacientes. Os campos clínicos seguem criptografados, mas nomes
            e contatos não: trate o download como documento sigiloso.
          </p>
        </div>
      </div>

      <section className="card p-6">
        <h2 className="font-bold text-navy-800">Cópias disponíveis</h2>

        {copias.length === 0 ? (
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-slate-50 p-5">
            <Clock aria-hidden className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-500" />
            <div>
              <p className="font-semibold text-slate-800">Ainda não há cópias</p>
              <p className="mt-1 text-sm text-slate-600">
                A primeira é gerada quando o sistema sobe. Se esta mensagem continuar depois de uma
                reinicialização, algo impediu a gravação no disco.
              </p>
            </div>
          </div>
        ) : (
          <div
            tabIndex={0}
            role="region"
            aria-label="Cópias disponíveis"
            className="mt-5 overflow-x-auto"
          >
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-600">
                  <th scope="col" className="pb-2 pr-4">Data</th>
                  <th scope="col" className="pb-2 pr-4">Gerada em</th>
                  <th scope="col" className="pb-2 pr-4 text-right">Tamanho</th>
                  <th scope="col" className="pb-2">Baixar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {copias.map((c, i) => (
                  <tr key={c.nome} className="hover:bg-slate-50/60">
                    <td className="py-3 pr-4 font-medium text-slate-800">
                      {format(parseISO(c.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      {i === 0 && (
                        <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700">
                          mais recente
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {format(parseISO(c.criadaEm), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-slate-600">
                      {tamanhoLegivel(c.bytes)}
                    </td>
                    <td className="py-3">
                      <a
                        href={`/api/backup/${c.nome}`}
                        className="inline-flex items-center gap-1.5 font-medium text-navy-700 hover:underline"
                      >
                        <Download aria-hidden className="h-3.5 w-3.5" />
                        Baixar
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card mt-6 p-6">
        <h2 className="font-bold text-navy-800">Como restaurar</h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          Restaurar é substituir o arquivo do banco pela cópia e reiniciar o sistema. Não há botão
          para isso de propósito: é uma operação que apaga tudo o que foi feito depois da data da
          cópia, e precisa de alguém acompanhando. Se o dia chegar, procure quem cuida da parte
          técnica com o arquivo em mãos.
        </p>
      </section>
    </div>
  );
}
