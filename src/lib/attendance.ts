import { rawAll, rawGet } from "./orm";
import { patientScope, type CurrentUser } from "./permissions";

/**
 * Controle de faltas.
 *
 * "Falta" e "Cancelada" são coisas diferentes na gestão de uma clínica: quem
 * avisa com antecedência libera o horário para outra criança; quem não aparece
 * gera um horário perdido, que não volta. O painel olha principalmente as
 * faltas, mas mostra os cancelamentos ao lado para dar contexto.
 */

export interface AbsenceRow {
  patientId: string;
  fullName: string;
  unidade: string | null;
  careStage: string | null;
  faltas: number;
  cancelamentos: number;
  realizadas: number;
  /** Percentual de faltas sobre tudo que foi marcado e já passou. */
  taxaFalta: number;
  ultimaFalta: string | null;
  responsavel: string | null;
  telefoneResponsavel: string | null;
}

/**
 * Ranking de faltas no período.
 *
 * `minSessoes` evita destaque injusto: uma criança com uma única sessão
 * marcada e uma falta apareceria com 100%, ao lado de quem falta há meses.
 */
export function absenceRanking(
  user: CurrentUser | null,
  startIso: string,
  endIso: string,
  minSessoes = 2
): AbsenceRow[] {
  if (!user) return [];

  const scope = patientScope(user, "p");

  const rows = rawAll(
    `SELECT p.id AS patientId, p.fullName, p.careStage,
            u.name AS unidade,
            SUM(CASE WHEN s.status = 'Falta' THEN 1 ELSE 0 END) AS faltas,
            SUM(CASE WHEN s.status = 'Cancelada' THEN 1 ELSE 0 END) AS cancelamentos,
            SUM(CASE WHEN s.status IN ('Realizada','Relatório pendente') THEN 1 ELSE 0 END) AS realizadas,
            MAX(CASE WHEN s.status = 'Falta' THEN s.sessionDate END) AS ultimaFalta,
            (SELECT r.fullName FROM Responsible r
               JOIN PatientResponsible pr ON pr.responsibleId = r.id
              WHERE pr.patientId = p.id LIMIT 1) AS responsavel,
            (SELECT r.phone FROM Responsible r
               JOIN PatientResponsible pr ON pr.responsibleId = r.id
              WHERE pr.patientId = p.id LIMIT 1) AS telefoneResponsavel
     FROM Session s
     JOIN Patient p ON p.id = s.patientId
     LEFT JOIN Unit u ON u.id = p.unitId
     WHERE s.sessionDate >= ? AND s.sessionDate < ?
       AND s.status IN ('Falta','Cancelada','Realizada','Relatório pendente')
       AND ${scope.sql}
     GROUP BY p.id
     HAVING faltas > 0`,
    [startIso, endIso, ...scope.params]
  );

  return rows
    .map((r) => {
      const faltas = Number(r.faltas);
      const realizadas = Number(r.realizadas);
      const cancelamentos = Number(r.cancelamentos);
      const encerradas = faltas + realizadas + cancelamentos;

      return {
        patientId: r.patientId as string,
        fullName: r.fullName as string,
        unidade: (r.unidade as string) ?? null,
        careStage: (r.careStage as string) ?? null,
        faltas,
        cancelamentos,
        realizadas,
        taxaFalta: encerradas > 0 ? Math.round((faltas / encerradas) * 100) : 0,
        ultimaFalta: (r.ultimaFalta as string) ?? null,
        responsavel: (r.responsavel as string) ?? null,
        telefoneResponsavel: (r.telefoneResponsavel as string) ?? null,
      };
    })
    .filter((r) => r.faltas + r.realizadas + r.cancelamentos >= minSessoes)
    .sort((a, b) => b.faltas - a.faltas || b.taxaFalta - a.taxaFalta);
}

export interface AbsenceTotals {
  faltas: number;
  cancelamentos: number;
  realizadas: number;
  taxaFalta: number | null;
  /** Estimativa do que se deixou de faturar com os horários perdidos. */
  prejuizoEstimado: number;
}

export function absenceTotals(
  user: CurrentUser | null,
  startIso: string,
  endIso: string
): AbsenceTotals {
  if (!user) {
    return { faltas: 0, cancelamentos: 0, realizadas: 0, taxaFalta: null, prejuizoEstimado: 0 };
  }

  const scope = patientScope(user, "p");

  const row = rawGet(
    `SELECT
       SUM(CASE WHEN s.status = 'Falta' THEN 1 ELSE 0 END) AS faltas,
       SUM(CASE WHEN s.status = 'Cancelada' THEN 1 ELSE 0 END) AS cancelamentos,
       SUM(CASE WHEN s.status IN ('Realizada','Relatório pendente') THEN 1 ELSE 0 END) AS realizadas
     FROM Session s
     JOIN Patient p ON p.id = s.patientId
     WHERE s.sessionDate >= ? AND s.sessionDate < ? AND ${scope.sql}`,
    [startIso, endIso, ...scope.params]
  );

  const faltas = Number(row?.faltas ?? 0);
  const cancelamentos = Number(row?.cancelamentos ?? 0);
  const realizadas = Number(row?.realizadas ?? 0);
  const encerradas = faltas + realizadas + cancelamentos;

  // Valor médio da sessão, tirado da tabela de serviços ativa. É uma
  // estimativa: serve para dimensionar o problema, não para contabilidade.
  const preco = rawGet(
    `SELECT AVG(price) AS media FROM ServiceItem WHERE active = 1 AND packageSessions IS NULL`
  );
  const media = Number(preco?.media ?? 0);

  return {
    faltas,
    cancelamentos,
    realizadas,
    taxaFalta: encerradas > 0 ? Math.round((faltas / encerradas) * 100) : null,
    prejuizoEstimado: Math.round(faltas * media),
  };
}

/** Faltas por dia da semana, para revelar padrões de horário. */
export function absencesByWeekday(
  user: CurrentUser | null,
  startIso: string,
  endIso: string
): { dia: string; total: number }[] {
  if (!user) return [];

  const scope = patientScope(user, "p");
  const rows = rawAll(
    `SELECT s.sessionDate FROM Session s
     JOIN Patient p ON p.id = s.patientId
     WHERE s.sessionDate >= ? AND s.sessionDate < ? AND s.status = 'Falta' AND ${scope.sql}`,
    [startIso, endIso, ...scope.params]
  );

  const nomes = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const contagem = new Array(7).fill(0);
  for (const r of rows) contagem[new Date(r.sessionDate as string).getDay()]++;

  // Semana começa na segunda, como na agenda.
  return [1, 2, 3, 4, 5, 6, 0].map((i) => ({ dia: nomes[i], total: contagem[i] }));
}
