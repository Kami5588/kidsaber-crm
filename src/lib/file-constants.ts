/**
 * Constantes de arquivo sem dependência de servidor.
 *
 * Ficam separadas de files.ts porque aquele módulo importa node:fs e não pode
 * ser carregado por componentes que rodam no navegador.
 */

export const MAX_FILE_BYTES = 20 * 1024 * 1024; // 20 MB

export const ACCEPT_ATTRIBUTE = ".pdf,.jpg,.jpeg,.png,.webp,.heic,.doc,.docx,.xls,.xlsx,.txt";

export function humanSize(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
