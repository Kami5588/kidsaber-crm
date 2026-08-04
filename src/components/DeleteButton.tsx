"use client";

import { Trash2 } from "lucide-react";

export default function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Tem certeza que deseja excluir este registro?")) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className="rounded-lg p-1.5 text-coral-500 hover:bg-coral-50" title="Excluir">
        <Trash2 className="h-4 w-4" />
      </button>
    </form>
  );
}
