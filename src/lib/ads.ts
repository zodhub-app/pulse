/**
 * Ads client for Pulse.
 *
 * Pulse declares itself to ZodHub (name, languages, slots) and then asks for the
 * banner of each slot in the current language. The server is the source of the
 * images; here we only register + fetch + render.
 */

import { API_BASE, APP_HEADERS } from "./config";

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
		// Image URLs come relative to the ZodHub server; make them absolute.
		return banners.map((b) => ({
			...b,
			imageUrl: b.imageUrl?.startsWith("/") ? `${API_BASE}${b.imageUrl}` : b.imageUrl,
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
