"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Upload, Loader2, Share2, Check, X, MoveRight, Paperclip,
} from "lucide-react";
import {
  uploadDocumentAction, shareDocumentAction, type DocumentFormState,
} from "@/lib/document-actions";
import { changeStageAction, type StageFormState } from "@/lib/care-stage-actions";
import { CARE_STAGES, STAGE_META } from "@/lib/care-stage-constants";
import { ACCEPT_ATTRIBUTE, MAX_FILE_BYTES, humanSize } from "@/lib/file-constants";

const DOCUMENT_TYPES = [
  "Laudo", "Atestado", "Contrato", "Anamnese", "Relatório", "Receita", "Encaminhamento", "Outro",
];

function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

/** Anexa um arquivo direto na ficha, sem sair para outra tela. */
export function AttachFileForm({ patientId }: { patientId: string }) {
  const [state, action] = useFormState<DocumentFormState, FormData>(uploadDocumentAction, { ok: false });
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={open ? "btn-secondary" : "btn-primary"}
      >
        {open ? <X className="h-4 w-4" /> : <Paperclip className="h-4 w-4" />}
        {open ? "Cancelar" : "Anexar arquivo"}
      </button>

      {open && (
        <form action={action} className="mt-4 grid gap-4 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2">
          <input type="hidden" name="patientId" value={patientId} />

          <div>
            <label htmlFor="doc-name" className="label">Nome do documento *</label>
            <input id="doc-name" name="name" required className="input" placeholder="Laudo neuropediátrico - jan/2026" />
          </div>

          <div>
            <label htmlFor="doc-type" className="label">Tipo *</label>
            <select id="doc-type" name="type" className="input" defaultValue="Laudo">
              {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="doc-file" className="label">Arquivo *</label>
            <input
              id="doc-file"
              name="file"
              type="file"
              required
              accept={ACCEPT_ATTRIBUTE}
              className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-700 hover:file:bg-navy-100"
            />
            <p className="mt-1.5 text-xs text-slate-500">
              PDF, imagem, Word, Excel ou texto. Até {humanSize(MAX_FILE_BYTES)}.
            </p>
          </div>

          <label className="flex items-start gap-2.5 sm:col-span-2">
            <input type="checkbox" name="visibleToResponsible" className="mt-0.5 h-4 w-4 rounded border-slate-300 text-navy-700" />
            <span className="text-sm text-slate-700">
              Visível para o responsável
              <span className="block text-xs text-slate-500">
                Marque apenas o que pode ser compartilhado com a família.
              </span>
            </span>
          </label>

          {state.error && (
            <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700 sm:col-span-2">
              {state.error}
            </p>
          )}
          {state.ok && state.message && (
            <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800 sm:col-span-2">
              {state.message}
            </p>
          )}

          <div className="sm:col-span-2">
            <SubmitButton><Upload className="h-4 w-4" /> Enviar</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}

/** Encaminha um arquivo já anexado para outro profissional. */
export function ShareDocumentForm({
  documentId,
  professionals,
}: {
  documentId: string;
  professionals: { id: string; fullName: string; specialty?: string | null }[];
}) {
  const [state, action] = useFormState<DocumentFormState, FormData>(shareDocumentAction, { ok: false });
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
      >
        <Share2 className="h-4 w-4" /> Encaminhar
      </button>

      {open && (
        <form action={action} className="mt-3 space-y-3 rounded-xl bg-slate-50 p-4">
          <input type="hidden" name="documentId" value={documentId} />
          <div>
            <label className="label text-xs">Encaminhar para</label>
            <select name="professionalId" required className="input" defaultValue="">
              <option value="">Selecione o profissional...</option>
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}{p.specialty ? ` — ${p.specialty}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-xs">Observação (opcional)</label>
            <input name="note" className="input" placeholder="Ex.: avaliar necessidade de fono" />
          </div>

          {state.error && <p className="text-xs font-medium text-coral-700">{state.error}</p>}
          {state.ok && state.message && <p className="text-xs text-teal-700">{state.message}</p>}

          <SubmitButton><Check className="h-4 w-4" /> Encaminhar</SubmitButton>
        </form>
      )}
    </div>
  );
}

/** Move o paciente para outra etapa do acompanhamento. */
export function ChangeStageForm({
  patientId,
  currentStage,
}: {
  patientId: string;
  currentStage?: string | null;
}) {
  const [state, action] = useFormState<StageFormState, FormData>(changeStageAction, { ok: false });
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-secondary"
      >
        {open ? <X className="h-4 w-4" /> : <MoveRight className="h-4 w-4" />}
        {open ? "Cancelar" : "Mudar etapa"}
      </button>

      {open && (
        <form action={action} className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-5">
          <input type="hidden" name="patientId" value={patientId} />

          <div>
            <label htmlFor="toStage" className="label">Nova etapa</label>
            <select id="toStage" name="toStage" required className="input" defaultValue="">
              <option value="">Selecione...</option>
              {CARE_STAGES.filter((s) => s !== currentStage).map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-slate-500">
              Etapa atual: <strong>{currentStage ?? "sem etapa"}</strong>
            </p>
          </div>

          <div>
            <label htmlFor="stage-note" className="label">Observação (opcional)</label>
            <input id="stage-note" name="note" className="input" placeholder="Motivo ou contexto da mudança" />
          </div>

          {state.error && (
            <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{state.error}</p>
          )}
          {state.ok && state.message && (
            <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{state.message}</p>
          )}

          <SubmitButton><Check className="h-4 w-4" /> Confirmar mudança</SubmitButton>
        </form>
      )}
    </div>
  );
}
