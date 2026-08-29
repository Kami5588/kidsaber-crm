import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ENTITIES, getEntity } from "@/lib/entities";
import { getById, listAll } from "@/lib/orm";
import { updateEntity } from "@/lib/actions";
import { logAccess } from "@/lib/audit";
import { canAccessPatient, getCurrentUser } from "@/lib/permissions";
import EntityForm, { RelationOption } from "@/components/EntityForm";

export const metadata = { title: "Editar paciente · KidSaber Connect" };

export default async function EditarPacientePage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessPatient(user, params.id)) notFound();

  const entity = getEntity("pacientes")!;
  const record = getById(entity.table, params.id);
  if (!record) notFound();

  await logAccess({
    action: "VISUALIZAR",
    entity: "Patient",
    entityId: params.id,
    detail: "Abriu o cadastro para edição.",
  });

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
    await updateEntity("pacientes", params.id, formData);
  };

  return (
    <div>
      <Link
        href={`/pacientes/${params.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-navy-700"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para a ficha
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        Editar {record.fullName}
      </h1>

      <EntityForm
        fields={entity.fields}
        initial={record}
        action={boundAction}
        relationOptions={relationOptions}
        cancelHref={`/pacientes/${params.id}`}
      />
    </div>
  );
}
