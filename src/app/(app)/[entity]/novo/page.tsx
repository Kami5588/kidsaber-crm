import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ENTITIES, getEntity } from "@/lib/entities";
import { listAll } from "@/lib/orm";
import { createEntity } from "@/lib/actions";
import EntityForm, { RelationOption } from "@/components/EntityForm";
import { ALL_UNITS, getActiveUnitId } from "@/lib/units";

export default async function NewEntityPage({ params }: { params: { entity: string } }) {
const entity = getEntity(params.entity);
if (!entity) notFound();

const relationOptions: Record<string, RelationOption[]> = {};
for (const f of entity.fields) {
if (!f.relation) continue;
const relEntity = ENTITIES[f.relation];
if (!relEntity) continue;
const rows = listAll(relEntity.table);
relationOptions[f.name] = rows.map((r) => ({ id: r.id, label: r[relEntity.displayField] }));
}

// Com uma unidade selecionada, novos registros ja vem vinculados a ela -
// evita que a recepcao cadastre paciente na unidade errada.
const activeUnitId = getActiveUnitId();
const initial = activeUnitId === ALL_UNITS ? undefined : { unitId: activeUnitId };

const boundAction = async (formData: FormData) => {
"use server";
await createEntity(entity!.key, formData);
};

return (
<div>
<Link href={`/${entity.key}`} className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-700">
<ArrowLeft className="h-4 w-4" /> Voltar para {entity.label}
</Link>
<h1 className="mb-6 text-2xl font-bold text-slate-900">Novo {entity.labelSingular}</h1>
<EntityForm fields={entity.fields} initial={initial} action={boundAction} relationOptions={relationOptions} cancelHref={`/${entity.key}`} />
</div>
);
}
