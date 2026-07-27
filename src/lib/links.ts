import { openUrl as tauriOpenUrl } from "@tauri-apps/plugin-opener";
import type { Lang } from "@/components/language-provider";

/** Base pública de la web. Único sitio donde vive el dominio. */
export const WEB_BASE = "https://zodhub.app";

/** Repositorio y sus vistas (estables, no dependen de idioma). */
export const GITHUB = {
  repo: "https://github.com/zodhub-app/pulse",
  releases: "https://github.com/zodhub-app/pulse/releases",
} as const;

export type WebLinks = {
  web: string;
  donate: string;
  downloads: string;
  privacy: string;
  terms: string;
};

/**
 * Enlaces públicos de la web POR IDIOMA (mismos slugs localizados que sirve
 * zodhub.app: donar/descargas/privacidad/terminos en ES, donate/downloads/…
 * en EN). Fuente única y correcta — antes estaban obsoletos apuntando a
 * `zodhub-app.github.io`. El endpoint `/api/app/meta` devuelve estos mismos,
 * por si en el futuro se quieren 100% dinámicos.
 */
export function webLinks(lang: Lang): WebLinks {
  return lang === "es"
    ? {
        web: `${WEB_BASE}/es`,
        donate: `${WEB_BASE}/es/donar`,
        downloads: `${WEB_BASE}/es/descargas`,
        privacy: `${WEB_BASE}/es/privacidad`,
        terms: `${WEB_BASE}/es/terminos`,
      }
    : {
        web: WEB_BASE,
        donate: `${WEB_BASE}/donate`,
        downloads: `${WEB_BASE}/downloads`,
        privacy: `${WEB_BASE}/privacy`,
        terms: `${WEB_BASE}/terms`,
      };
}

/**
 * Abre un enlace en el navegador del sistema (no dentro de la app).
 *
 * Importante: las páginas externas se abren SIEMPRE fuera, en el navegador del
 * usuario. Así la app no incrusta contenido remoto ni carga nada de terceros,
 * que es lo coherente con ser local-first.
 */
export async function openUrl(url: string): Promise<void> {
  try {
    await tauriOpenUrl(url);
  } catch {
    // En el navegador (modo dev con vite) el plugin no existe: abrimos normal.
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
