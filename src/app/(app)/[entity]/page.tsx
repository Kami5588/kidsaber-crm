import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Pencil, Search } from "lucide-react";
import { ENTITIES, getEntity } from "@/lib/entities";
import { listAll } from "@/lib/orm";
import { UNIT_SCOPED_TABLES } from "@/lib/db";
import { ALL_UNITS, getActiveUnitId, unitFilter } from "@/lib/units";
import { deleteEntity } from "@/lib/actions";
import DeleteButton from "@/components/DeleteButton";
import { format, parseISO } from "date-fns";

function fmt(field: string, value: any, relationLabels: Record<string, Record<string, string>>): string {
if (value === null || value === undefined || value === "") return "-";
if (relationLabels[field]) return relationLabels[field][value] ?? "-";
if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
try {
const hasTime = value.includes("T") && value.length > 10;
return format(parseISO(value), hasTime ? "dd/MM/yyyy HH:mm" : "dd/MM/yyyy");
} catch {
return value;
}
}
return String(value);
}

const STATUS_COLORS: Record<string, string> = {
Ativo: "bg-teal-50 text-teal-700",
Pago: "bg-teal-50 text-teal-700",
Convertido: "bg-teal-50 text-teal-700",
Concluída: "bg-teal-50 text-teal-700",
Realizada: "bg-teal-50 text-teal-700",
Agendado: "bg-teal-50 text-teal-700",
Pendente: "bg-gold-50 text-gold-800",
Novo: "bg-gold-50 text-gold-800",
"Em contato": "bg-gold-50 text-gold-800",
"Em andamento": "bg-gold-50 text-gold-800",
Aguardando: "bg-gold-50 text-gold-800",
Agendada: "bg-navy-50 text-navy-700",
Inativo: "bg-slate-100 text-slate-600",
"Em avaliação": "bg-navy-50 text-navy-700",
"Relatório pendente": "bg-gold-50 text-gold-800",
Contatado: "bg-navy-50 text-navy-700",
Urgente: "bg-coral-50 text-coral-700",
Alta: "bg-coral-50 text-coral-700",
Media: "bg-gold-50 text-gold-800",
Baixa: "bg-slate-100 text-slate-600",
Cancelada: "bg-coral-50 text-coral-700",
Cancelado: "bg-coral-50 text-coral-700",
Atrasado: "bg-coral-50 text-coral-700",
Arquivado: "bg-slate-100 text-slate-600",
Desistiu: "bg-coral-50 text-coral-700",
};

export default async function EntityListPage({
params, searchParams,
}: { params: { entity: string }; searchParams: { q?: string } }) {
const entity = getEntity(params.entity);
if (!entity) notFound();

const q = searchParams.q?.trim();
const clauses: string[] = [];
const queryParams: any[] = [];

// A busca é um OR entre vários campos, então precisa de parênteses para não
// se misturar com o AND do filtro de unidade.
if (q && entity.searchFields.length > 0) {
clauses.push("(" + entity.searchFields.map((f) => `${f} LIKE ?`).join(" OR ") + ")");
queryParams.push(...entity.searchFields.map(() => `%${q}%`));
}

const activeUnitId = getActiveUnitId();
const isUnitScoped = (UNIT_SCOPED_TABLES as readonly string[]).includes(entity.table);
if (isUnitScoped) {
const uf = unitFilter();
if (uf.sql !== "1=1") {
clauses.push(uf.sql);
queryParams.push(...uf.params);
}
}

const where = clauses.length > 0 ? clauses.join(" AND ") : undefined;
const rows = listAll(entity.table, { where, params: queryParams });

const relationFields = entity.fields.filter((f) => f.relation);
const relationLabels: Record<string, Record<string, string>> = {};
for (const rf of relationFields) {
const relEntity = ENTITIES[rf.relation!];
if (!relEntity) continue;
const relRows = listAll(relEntity.table);
relationLabels[rf.name] = Object.fromEntries(relRows.map((r) => [r.id, r[relEntity.displayField]]));
}

const columns = entity.fields.filter(
(f) => f.showInTable && !(f.name === "unitId" && activeUnitId !== ALL_UNITS)
);
const boundDelete = async (id: string) => {
"use server";
await deleteEntity(entity!.key, id);
};

return (
<div>
<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
<div>
<h1 className="text-2xl font-bold text-slate-900">{entity.label}</h1>
<p className="text-sm text-slate-500">{rows.length} registro(s)</p>
</div>
<div className="flex items-center gap-3">
{entity.searchFields.length > 0 && (
<form className="relative">
<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
<input type="text" name="q" defaultValue={q} placeholder="Buscar..." className="input w-56 pl-9" />
</form>
)}
<Link href={`/${entity.key}/novo`} className="btn-primary">
<Plus className="h-4 w-4" /> Novo
</Link>
</div>
</div>

<div className="card overflow-x-auto">
<table className="w-full text-left text-sm">
<thead className="border-b border-slate-100 bg-slate-50/60">
<tr className="text-xs uppercase tracking-wide text-slate-400">
{columns.map((c) => (
<th key={c.name} className="whitespace-nowrap px-4 py-3">{c.label}</th>
))}
<th className="px-4 py-3 text-right">Ações</th>
</tr>
</thead>
<tbody className="divide-y divide-slate-100">
{rows.length === 0 && (
<tr>
<td colSpan={columns.length + 1} className="px-4 py-10 text-center text-sm text-slate-400">
Nenhum registro encontrado.
</td>
</tr>
)}
{rows.map((row) => (
<tr key={row.id} className="hover:bg-slate-50/60">
{columns.map((c) => {
const display = fmt(c.name, row[c.name], relationLabels);
const isStatusish = ["status", "priority"].includes(c.name);
return (
<td key={c.name} className="whitespace-nowrap px-4 py-3 text-slate-700">
{isStatusish && STATUS_COLORS[display] ? (
<span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[display]}`}>{display}</span>
) : c.name === "active" ? (
row[c.name] ? "Sim" : "Não"
) : (
display
)}
</td>
);
})}

<td className="px-4 py-3">
<div className="flex items-center justify-end gap-1">
<Link href={`/${entity.key}/${row.id}`} className="rounded-lg p-1.5 text-navy-600 hover:bg-navy-50" title="Editar">
<Pencil className="h-4 w-4" />
</Link>
<DeleteButton action={boundDelete.bind(null, row.id)} />
</div>
</td>
</tr>
))}
</tbody>
</table>
</div>
</div>
);
}
