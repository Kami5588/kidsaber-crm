"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Download, Loader2, ShieldAlert, Trash2, CheckCircle2 } from "lucide-react";
import {
  deletePatientAction,
  exportPatientAction,
  type DeleteState,
  type ExportState,
} from "@/lib/lgpd-actions";
import { DELETE_CONFIRMATION } from "@/lib/lgpd-constants";

interface PatientOption {
  id: string;
  fullName: string;
  unidade?: string | null;
  status?: string | null;
}

function SubmitButton({
  children,
  className,
  disabled,
}: {
  children: React.ReactNode;
  className: string;
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || disabled} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export default function LgpdPanel({ patients }: { patients: PatientOption[] }) {
  const [exportState, exportFormAction] = useFormState<ExportState, FormData>(
    exportPatientAction,
    { ok: false }
  );
  const [deleteState, deleteFormAction] = useFormState<DeleteState, FormData>(
    deletePatientAction,
    { ok: false }
  );

  const [confirmation, setConfirmation] = useState("");
  const downloadedRef = useRef<string | null>(null);

  // O arquivo é montado no navegador a partir do conteúdo devolvido pela ação,
  // evitando gravar um export com dado sensível no servidor.
  useEffect(() => {
    if (!exportState.ok) return;
    if (downloadedRef.current === exportState.fileName) return;

    downloadedRef.current = exportState.fileName;
    const blob = new Blob([exportState.content], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportState.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [exportState]);

  const confirmationOk = confirmation.trim() === DELETE_CONFIRMATION;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---------- Portabilidade ---------- */}
      <section className="card flex flex-col p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
          <Download className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-navy-800">Acesso e portabilidade</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Gera um arquivo com tudo que o sistema guarda sobre o paciente: cadastro, responsáveis,
          sessões, evoluções, faturas e documentos. Entregue esse arquivo ao responsável legal
          quando ele solicitar acesso aos dados.
        </p>

        <form action={exportFormAction} className="mt-5 flex flex-1 flex-col gap-3">
          <div>
            <label htmlFor="export-patient" className="label">Paciente</label>
            <select id="export-patient" name="patientId" required className="input" defaultValue="">
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                  {p.unidade ? ` — ${p.unidade}` : ""}
                </option>
              ))}
            </select>
          </div>

          {"error" in exportState && exportState.error && (
            <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
              {exportState.error}
            </p>
          )}

          {exportState.ok && (
            <p className="flex items-start gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Arquivo <strong>{exportState.fileName}</strong> gerado e baixado. A exportação
                ficou registrada na auditoria.
              </span>
            </p>
          )}

          <div className="mt-auto pt-2">
            <SubmitButton className="btn-primary">
              <Download className="h-4 w-4" /> Gerar arquivo de dados
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* ---------- Eliminação ---------- */}
      <section className="card flex flex-col border-coral-200 p-6">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
          <Trash2 className="h-5 w-5" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-navy-800">Eliminação de dados</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
          Apaga em definitivo o paciente e todo o histórico ligado a ele. A ação não pode ser
          desfeita.
        </p>

        <div className="mt-4 flex gap-2.5 rounded-xl bg-gold-50 p-3.5 text-xs leading-relaxed text-gold-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>
            Antes de excluir, confirme se não há obrigação legal de guarda do prontuário. As normas
            dos conselhos profissionais exigem retenção por prazo próprio, que pode se sobrepor ao
            pedido de eliminação.
          </span>
        </div>

        <form action={deleteFormAction} className="mt-5 flex flex-1 flex-col gap-3">
          <div>
            <label htmlFor="delete-patient" className="label">Paciente</label>
            <select id="delete-patient" name="patientId" required className="input" defaultValue="">
              <option value="">Selecione...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                  {p.unidade ? ` — ${p.unidade}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="confirmation" className="label">
              Digite <span className="font-mono text-coral-600">{DELETE_CONFIRMATION}</span> para confirmar
            </label>
            <input
              id="confirmation"
              name="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              autoComplete="off"
              className="input font-mono"
              placeholder={DELETE_CONFIRMATION}
            />
          </div>

          {deleteState.error && (
            <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">
              {deleteState.error}
            </p>
          )}
          {deleteState.ok && deleteState.message && (
            <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">
              {deleteState.message}
            </p>
          )}

          <div className="mt-auto pt-2">
            <SubmitButton className="btn-danger" disabled={!confirmationOk}>
              <Trash2 className="h-4 w-4" /> Excluir definitivamente
            </SubmitButton>
          </div>
        </form>
      </section>
    </div>
  );
}
