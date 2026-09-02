import { notFound, redirect } from "next/navigation";
import { getCurrentUser, canAccessEntity } from "@/lib/permissions";
import { listDocuments, selectablePatients, shareableProfessionals } from "@/lib/documents";
import DocumentsPanel from "@/components/DocumentsPanel";

export const metadata = { title: "Documentos · KidSaber Connect" };

export default async function DocumentosPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canAccessEntity(user.role, "documentos")) notFound();

  const documents = listDocuments(user);
  const patients = selectablePatients(user);
  const professionals = shareableProfessionals(user.professionalId);

  // A recepção organiza documentos, mas quem anexa laudo é quem atende.
  const canUpload = user.role !== "RECEPCAO" && patients.length > 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
        <p className="text-slate-600">
          Laudos e relatórios do prontuário, com encaminhamento entre profissionais.
        </p>
      </div>

      <DocumentsPanel
        documents={documents.map((d) => ({
          id: d.id,
          name: d.name,
          type: d.type,
          patientName: d.patientName,
          originalName: d.originalName,
          mimeType: d.mimeType,
          sizeBytes: d.sizeBytes,
          storedName: d.storedName,
          uploadDate: d.uploadDate,
          visibleToResponsible: d.visibleToResponsible,
          sharedCount: d.sharedCount,
          sharedWithMe: d.sharedWithMe,
        }))}
        patients={patients.map((p) => ({ id: p.id, fullName: p.fullName, unidade: p.unidade }))}
        professionals={professionals.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          specialty: p.specialty,
        }))}
        canUpload={canUpload}
      />
    </div>
  );
}
