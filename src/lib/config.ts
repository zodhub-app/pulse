/**
 * Configuración de red de la app.
 *
 * El backend de la plataforma ZodHub expone la superficie `/api/app/*` que la
 * app usa para suscripción, donaciones, soporte, meta, etc.
 *
 * 🛑 El DEFAULT es producción (`https://zodhub.app`), NO localhost. Motivo: el
 * `.env` está en `.gitignore` y NO viaja al build de CI, así que una release
 * compilada sin `VITE_API_BASE` DEBE seguir apuntando al dominio real; si el
 * default fuese localhost, la app publicada intentaría hablar con el equipo del
 * usuario y toda petición fallaría con "Load failed" (fue justo ese el bug).
 *
 * Para desarrollar contra un ZodHub LOCAL, crea un `.env` con
 * `VITE_API_BASE=http://localhost:3000` (Vite lo hornea en el build de dev).
 */
export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/+$/, "") ||
  "https://zodhub.app";

/** Marcador "esta petición viene del cliente app" que el backend exige. No es secreto ni auth. */
export const APP_HEADERS: Record<string, string> = { "X-ZodHub-App": "1" };
