"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import type { FieldConfig } from "@/lib/entities";

export interface RelationOption {
  id: string;
  label: string;
}

interface Props {
  fields: FieldConfig[];
  initial?: Record<string, any>;
  action: (formData: FormData) => Promise<void>;
  relationOptions: Record<string, RelationOption[]>;
  cancelHref: string;
}

function toDateInputValue(v: any) {
  if (!v) return "";
  const s = String(v);
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function toDateTimeInputValue(v: any) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EntityForm({ fields, initial, action, relationOptions, cancelHref }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      action={async (formData) => {
        setSubmitting(true);
        try {
          await action(formData);
        } finally {
          setSubmitting(false);
        }
      }}
      className="card grid grid-cols-1 gap-5 p-6 sm:grid-cols-2"
    >
      {fields.map((field) => {
        const value = initial?.[field.name];
        const span = field.colSpan2 ? "sm:col-span-2" : "";

        if (field.type === "textarea") {
          return (
            <div key={field.name} className={span}>
              <label className="label">{field.label}{field.required && " *"}</label>
              <textarea
                name={field.name}
                required={field.required}
                defaultValue={value ?? ""}
                rows={3}
                className="input"
              />
            </div>
          );
        }

        if (field.type === "checkbox") {
          return (
            <div key={field.name} className={`flex items-center gap-2 ${span}`}>
              <input
                type="checkbox"
                id={field.name}
                name={field.name}
                defaultChecked={value === undefined ? !!field.default : !!value}
                className="h-4 w-4 rounded border-slate-300 text-navy-700 focus:ring-navy-500"
              />
              <label htmlFor={field.name} className="text-sm font-medium text-slate-700">{field.label}</label>
            </div>
          );
        }

        if (field.type === "multiselect") {
          const current = typeof value === "string" ? value.split(",").filter(Boolean) : [];
          return (
            <div key={field.name} className={span}>
              <label className="label">{field.label}</label>
              <div className="flex flex-wrap gap-2">
                {(field.options ?? []).map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 has-[:checked]:border-navy-500 has-[:checked]:bg-navy-50 has-[:checked]:text-navy-700"
                  >
                    <input type="checkbox" name={field.name} value={opt} defaultChecked={current.includes(opt)} className="h-3.5 w-3.5" />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          );
        }

        if (field.type === "select") {
          const options = field.relation ? relationOptions[field.name] ?? [] : (field.options ?? []).map((o) => ({ id: o, label: o }));
          return (
            <div key={field.name} className={span}>
              <label className="label">{field.label}{field.required && " *"}</label>
              <select name={field.name} required={field.required} defaultValue={value ?? field.default ?? ""} className="input">
                <option value="">Selecione...</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
            </div>
          );
        }

        if (field.type === "date") {
          return (
            <div key={field.name} className={span}>
              <label className="label">{field.label}{field.required && " *"}</label>
              <input type="date" name={field.name} required={field.required} defaultValue={toDateInputValue(value)} className="input" />
            </div>
          );
        }

        if (field.type === "datetime") {
          return (
            <div key={field.name} className={span}>
              <label className="label">{field.label}{field.required && " *"}</label>
              <input type="datetime-local" name={field.name} required={field.required} defaultValue={toDateTimeInputValue(value)} className="input" />
            </div>
          );
        }

        return (
          <div key={field.name} className={span}>
            <label className="label">{field.label}{field.required && " *"}</label>
            <input
              type={field.type === "number" ? "number" : field.type === "email" ? "email" : "text"}
              step={field.type === "number" ? "any" : undefined}
              name={field.name}
              required={field.required}
              defaultValue={value ?? field.default ?? ""}
              className="input"
            />
          </div>
        );
      })}

      <div className="flex items-center gap-3 pt-2 sm:col-span-2">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar
        </button>
        <button type="button" onClick={() => router.push(cancelHref)} className="btn-secondary">
          Cancelar
        </button>
      </div>
    </form>
  );
}
