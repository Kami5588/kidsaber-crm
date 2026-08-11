import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ENTITIES, getEntity } from "@/lib/entities";
import { listAll } from "@/lib/orm";
import { createEntity } from "@/lib/actions";
import EntityForm, { RelationOption } from "@/components/EntityForm";

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
<EntityForm fields={entity.fields} action={boundAction} relationOptions={relationOptions} cancelHref={`/${entity.key}`} />
</div>
);
}
