import { rawAll, rawGet } from "./orm";
import { patientScope, type CurrentUser } from "./permissions";
import { unitFilter } from "./units";

/**
 * Agenda de atendimentos.
 *
 * A consulta respeita os dois recortes que já valem no resto do sistema: a
 * unidade selecionada no topo e, para o profissional, apenas os pacientes que
 * ele atende.
 */

export interface AgendaSession {
  id: string;
  patientId: string;
  patientName: string;
  professionalName: string | null;
  specialty: string;
  sessionDate: string;
  durationMinutes: number;
  status: string;
  unitName: string | null;
}

/** Sessões entre duas datas, já filtradas pelo que o usuário pode ver. */
export function sessionsBetween(
  user: CurrentUser | null,
  startIso: string,
  endIso: string
): AgendaSession[] {
  if (!user) return [];

  const clauses = ["s.sessionDate >= ?", "s.sessionDate < ?"];
  const params: any[] = [startIso, endIso];

  const scope = patientScope(user, "p");
  if (scope.sql !== "1=1") {
    clauses.push(scope.sql);
    params.push(...scope.params);
  }

  // O seletor de unidade não se aplica ao profissional: o recorte dele já é
  // por paciente, e cruzar os dois esconderia atendimentos dele em outra
  // unidade.
  if (user.role !== "PROFISSIONAL") {
    const uf = unitFilter("s");
    if (uf.sql !== "1=1") {
      clauses.push(uf.sql);
      params.push(...uf.params);
    }
  }

  return rawAll(
    `SELECT s.id, s.patientId, s.specialty, s.sessionDate, s.durationMinutes, s.status,
            p.fullName AS patientName,
            pf.fullName AS professionalName,
            u.name AS unitName
     FROM Session s
     JOIN Patient p ON p.id = s.patientId
     LEFT JOIN Professional pf ON pf.id = s.professionalId
     LEFT JOIN Unit u ON u.id = s.unitId
     WHERE ${clauses.join(" AND ")}
     ORDER BY s.sessionDate ASC`,
    params
  ) as AgendaSession[];
}

export interface AgendaTotals {
  total: number;
  agendadas: number;
  realizadas: number;
  canceladas: number;
  relatoriosPendentes: number;
  /** Percentual de comparecimento entre as sessões já encerradas. */
  comparecimento: number | null;
}

export function summarize(sessions: AgendaSession[]): AgendaTotals {
  const agendadas = sessions.filter((s) => s.status === "Agendada").length;
  const realizadas = sessions.filter((s) => s.status === "Realizada").length;
  const canceladas = sessions.filter((s) => s.status === "Cancelada").length;
  const relatoriosPendentes = sessions.filter((s) => s.status === "Relatório pendente").length;

  // Só entram no cálculo as sessões que já aconteceram ou deixaram de
  // acontecer; as ainda agendadas não dizem nada sobre comparecimento.
  const encerradas = realizadas + relatoriosPendentes + canceladas;

  return {
    total: sessions.length,
    agendadas,
    realizadas,
    canceladas,
    relatoriosPendentes,
    comparecimento:
      encerradas > 0 ? Math.round(((realizadas + relatoriosPendentes) / encerradas) * 100) : null,
  };
}

/** Agrupa as sessões por dia, no formato AAAA-MM-DD. */
export function groupByDay(sessions: AgendaSession[]): Map<string, AgendaSession[]> {
  const map = new Map<string, AgendaSession[]>();

  for (const s of sessions) {
    // A data vem em ISO com fuso; recortar os 10 primeiros caracteres manteria
    // o dia em UTC e jogaria a sessão da noite para o dia seguinte.
    const key = toLocalDayKey(s.sessionDate);
    const list = map.get(key);
    if (list) list.push(s);
    else map.set(key, [s]);
  }

  return map;
}

export function toLocalDayKey(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Profissionais com atendimento no período, para o filtro da tela. */
export function professionalsInPeriod(startIso: string, endIso: string) {
  return rawAll(
    `SELECT DISTINCT pf.id, pf.fullName, pf.specialty
     FROM Session s
     JOIN Professional pf ON pf.id = s.professionalId
     WHERE s.sessionDate >= ? AND s.sessionDate < ?
     ORDER BY pf.fullName ASC`,
    [startIso, endIso]
  );
}

/** Quantas sessões existem hoje, para o aviso no topo do painel. */
export function todayCount(user: CurrentUser | null): number {
  if (!user) return 0;

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return sessionsBetween(user, start.toISOString(), end.toISOString()).length;
}
