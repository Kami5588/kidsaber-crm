"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  Upload, Loader2, FileText, Download, Share2, Trash2, X, Check, Users, Inbox,
} from "lucide-react";
import {
  uploadDocumentAction, shareDocumentAction, deleteDocumentAction,
  type DocumentFormState,
} from "@/lib/document-actions";
import { ACCEPT_ATTRIBUTE, humanSize } from "@/lib/file-constants";

interface Doc {
  id: string;
  name: string;
  type: string;
  patientName?: string;
  originalName: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  storedName: string | null;
  uploadDate: string;
  visibleToResponsible: number;
  sharedCount?: number;
  sharedWithMe?: number;
}

interface Option { id: string; fullName: string; specialty?: string | null; unidade?: string | null }

const TYPES = ["Laudo", "Atestado", "Contrato", "Anamnese", "Relatório", "Receita", "Encaminhamento", "Outro"];

function SubmitButton({ children, className = "btn-primary" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}

export default function DocumentsPanel({
  documents,
  patients,
  professionals,
  canUpload,
}: {
  documents: Doc[];
  patients: Option[];
  professionals: Option[];
  canUpload: boolean;
}) {
  const [uploadState, uploadAction] = useFormState<DocumentFormState, FormData>(uploadDocumentAction, { ok: false });
  const [shareState, shareAction] = useFormState<DocumentFormState, FormData>(shareDocumentAction, { ok: false });
  const [deleteState, deleteAction] = useFormState<DocumentFormState, FormData>(deleteDocumentAction, { ok: false });

  const [showUpload, setShowUpload] = useState(false);
  const [sharing, setSharing] = useState<Doc | null>(null);

  return (
    <div className="space-y-6">
      {canUpload && (
        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-navy-800">Anexar documento</h2>
              <p className="mt-1 text-sm text-slate-600">
                Laudos, relatórios e encaminhamentos ficam guardados junto ao prontuário, com acesso
                controlado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowUpload((v) => !v)}
              className={showUpload ? "btn-secondary" : "btn-primary"}
            >
              {showUpload ? <X className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
              {showUpload ? "Cancelar" : "Anexar arquivo"}
            </button>
          </div>

          {showUpload && (
            <form action={uploadAction} className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
              <div>
                <label htmlFor="patientId" className="label">Paciente *</label>
                <select id="patientId" name="patientId" required className="input" defaultValue="">
                  <option value="">Selecione...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName}{p.unidade ? ` — ${p.unidade}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="type" className="label">Tipo *</label>
                <select id="type" name="type" className="input" defaultValue="Laudo">
                  {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="name" className="label">Nome do documento *</label>
                <input id="name" name="name" required className="input" placeholder="Laudo neuropediátrico - jan/2026" />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="file" className="label">Arquivo *</label>
                <input
                  id="file"
                  name="file"
                  type="file"
                  required
                  accept={ACCEPT_ATTRIBUTE}
                  className="block w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-navy-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-navy-700 hover:file:bg-navy-100"
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  PDF, imagem, Word, Excel ou texto. Até {humanSize(20 * 1024 * 1024)}.
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

              {uploadState.error && (
                <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700 sm:col-span-2">
                  {uploadState.error}
                </p>
              )}
              {uploadState.ok && uploadState.message && (
                <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800 sm:col-span-2">
                  {uploadState.message}
                </p>
              )}

              <div className="sm:col-span-2">
                <SubmitButton><Upload className="h-4 w-4" /> Enviar arquivo</SubmitButton>
              </div>
            </form>
          )}
        </section>
      )}

      {shareState.error && <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{shareState.error}</p>}
      {shareState.ok && shareState.message && <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{shareState.message}</p>}
      {deleteState.error && <p className="rounded-xl bg-coral-50 px-4 py-3 text-sm font-medium text-coral-700">{deleteState.error}</p>}
      {deleteState.ok && deleteState.message && <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-800">{deleteState.message}</p>}

      {documents.length === 0 ? (
        <div className="card flex items-start gap-3 p-6">
          <Inbox className="mt-0.5 h-5 w-5 flex-shrink-0 text-slate-400" />
          <div>
            <p className="font-semibold text-slate-800">Nenhum documento ainda</p>
            <p className="mt-1 text-sm text-slate-600">
              Anexe laudos e relatórios para tê-los sempre junto do prontuário.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {documents.map((d) => (
            <article key={d.id} className="card flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-bold text-navy-800">{d.name}</h3>
                  <p className="truncate text-xs text-slate-500">
                    {d.patientName} · {d.type}
                  </p>
                </div>
                {d.sharedWithMe ? (
                  <span className="flex-shrink-0 rounded-full bg-gold-50 px-2 py-1 text-[10px] font-bold uppercase text-gold-700">
                    Encaminhado
                  </span>
                ) : null}
              </div>

              <p className="mt-3 truncate text-xs text-slate-500">
                {d.originalName ?? "arquivo"} · {humanSize(d.sizeBytes)}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                {d.storedName && (
                  <a
                    href={`/api/documentos/${d.storedName}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-navy-600 transition hover:bg-navy-50"
                  >
                    <Download className="h-4 w-4" /> Abrir
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => setSharing(sharing?.id === d.id ? null : d)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  <Share2 className="h-4 w-4" /> Encaminhar
                </button>

                {(d.sharedCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Users className="h-3.5 w-3.5" /> {d.sharedCount}
                  </span>
                )}

                <form action={deleteAction} className="ml-auto">
                  <input type="hidden" name="documentId" value={d.id} />
                  <button
                    type="submit"
                    className="rounded-lg p-1.5 text-coral-600 transition hover:bg-coral-50"
                    title="Excluir documento"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </div>

              {sharing?.id === d.id && (
                <form action={shareAction} className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
                  <input type="hidden" name="documentId" value={d.id} />
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
                  <SubmitButton className="btn-primary">
                    <Check className="h-4 w-4" /> Encaminhar
                  </SubmitButton>
                </form>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
