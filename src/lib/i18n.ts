// Utilidades de idioma compartidas. Antes estaban duplicadas: `localize` en
// data/changelog.ts (ingenuo) y `pickLocale` en account.tsx (con fallback), y
// la validación de email repetida en dos formularios. Un solo sitio evita que
// diverjan.

import type { Lang } from "@/components/language-provider";

/**
 * Resuelve un mapa multi-idioma (`{es, en, …}`) al idioma actual, con la misma
 * cadena de respaldos que la web: idioma → inglés → español → primero disponible.
 * Sirve tanto para mapas garantizados (`{es, en}`) como para parciales.
 */
export function resolveLocaleMap(
  map: Record<string, string> | undefined,
  lang: Lang,
): string {
  if (!map) return "";
  return map[lang] || map.en || map.es || Object.values(map)[0] || "";
}

/** Validación de email única para todos los formularios de la app. */
export function isValidEmail(email: string): boolean {
  const v = email.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
