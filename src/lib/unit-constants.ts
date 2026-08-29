/**
 * Constantes de unidade sem dependência de servidor.
 *
 * Ficam separadas de units.ts porque aquele módulo importa next/headers, que
 * não pode ser carregado por client components como o UnitSwitcher.
 */
export const UNIT_COOKIE = "kidsaber_unit";

/** Valor sentinela para a visão consolidada (todas as unidades). */
export const ALL_UNITS = "all";
