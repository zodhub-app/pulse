/**
 * Ads client for Pulse.
 *
 * Pulse declares itself to ZodHub (name, languages, slots) and then asks for the
 * banner of each slot in the current language. The server is the source of the
 * images; here we only register + fetch + render.
 */

import { API_BASE, APP_HEADERS } from "./config";

/**
 * Normaliza el enlace de un anuncio a una URL ABSOLUTA y válida:
 *  - ya con esquema (`https://…`, `mailto:`, `tel:`) → tal cual;
 *  - ruta absoluta (`/es`, `/descargas`) → contra el servidor de ZodHub;
 *  - dominio pelado (`zodhub.app`) → se le antepone `https://`.
 * Sin esto, `openUrl("zodhub.app")` o `openUrl("/es")` no abrían nada.
 */
function normalizeLink(raw?: string): string | undefined {
	const s = raw?.trim();
	if (!s) return undefined;
	if (/^[a-z][a-z0-9+.-]*:/i.test(s)) return s; // tiene esquema (http:, mailto:, tel:…)
	if (s.startsWith("/")) return `${API_BASE}${s}`; // ruta absoluta del servidor
	return `https://${s}`; // dominio pelado
}

/** This app's identity + the slots it offers. Declared on every launch. */
export const ADS_APP = {
	app: "pulse",
	name: "ZodHub Pulse",
	locales: ["es", "en"],
	slots: [{ id: "sidebar", label: "Barra lateral", width: 440, height: 440 }],
};

/** One banner as served for a slot. */
export interface ServeBanner {
	slotId: string;
	imageUrl: string;
	linkUrl?: string;
	width: number;
	height: number;
}

/** Register this app + its slots with ZodHub (idempotent; also a heartbeat). */
export async function registerAds(): Promise<void> {
	try {
		await fetch(`${API_BASE}/api/app/ads/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...APP_HEADERS },
			body: JSON.stringify(ADS_APP),
		});
	} catch {
		/* offline / no server — the slot just shows its own content */
	}
}

/** Fetch the banners for this app's slots in a language. Empty on any failure. */
export async function serveAds(locale: string): Promise<ServeBanner[]> {
	try {
		const res = await fetch(
			`${API_BASE}/api/app/ads/serve?app=${encodeURIComponent(ADS_APP.app)}&locale=${encodeURIComponent(locale)}`,
			{ headers: { ...APP_HEADERS } },
		);
		if (!res.ok) return [];
		const data = (await res.json()) as { banners?: ServeBanner[] };
		const banners = Array.isArray(data.banners) ? data.banners : [];
		// La imagen y el enlace pueden llegar en cualquier formato desde el admin
		// de Ads; se normalizan a una URL ABSOLUTA y válida para que `openUrl`
		// abra siempre (una URL a medias como "zodhub.app" o "/es" no abre nada).
		return banners.map((b) => ({
			...b,
			imageUrl: b.imageUrl?.startsWith("/") ? `${API_BASE}${b.imageUrl}` : b.imageUrl,
			linkUrl: normalizeLink(b.linkUrl),
		}));
	} catch {
		return [];
	}
}

/**
 * Report a banner click to ZodHub (best-effort). Sends the app + slot + locale
 * and a coarse country from the system region (e.g. "es-ES" -> "ES"). Never
 * throws — a failed report must not break opening the link.
 */
export async function clickAds(slotId: string, locale: string): Promise<void> {
	try {
		const region =
			typeof navigator !== "undefined" ? navigator.language?.split("-")[1] : undefined;
		const country = region ? region.toUpperCase() : undefined;
		await fetch(`${API_BASE}/api/app/ads/click`, {
			method: "POST",
			headers: { "Content-Type": "application/json", ...APP_HEADERS },
			body: JSON.stringify({ app: ADS_APP.app, slotId, locale, country }),
		});
	} catch {
		/* offline / no server — clicks just aren't counted */
	}
}
