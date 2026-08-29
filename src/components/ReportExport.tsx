"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Download, Loader2, CheckCircle2 } from "lucide-react";
import { exportMonthlyReportAction, type CsvState } from "@/lib/report-actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Baixar planilha
    </button>
  );
}

export default function ReportExport({
  month,
  unitId,
}: {
  month: string;
  unitId?: string | null;
}) {
  const [state, action] = useFormState<CsvState, FormData>(exportMonthlyReportAction, { ok: false });
  const baixadoRef = useRef<string | null>(null);

  useEffect(() => {
    if (!state.ok) return;
    if (baixadoRef.current === state.fileName) return;

    baixadoRef.current = state.fileName;
    const blob = new Blob([state.content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = state.fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [state]);

  return (
    <div>
      <form action={action} className="flex items-center gap-3">
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="unitId" value={unitId ?? ""} />
        <SubmitButton />
      </form>

      {"error" in state && state.error && (
        <p className="mt-2 text-xs font-medium text-coral-700">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-teal-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {state.fileName} baixado
        </p>
      )}
    </div>
  );
}
