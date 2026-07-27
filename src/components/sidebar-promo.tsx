import { ArrowRight, Megaphone } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/components/language-provider";
import { clickAds, registerAds, type ServeBanner, serveAds } from "@/lib/ads";
import { openUrl } from "@/lib/links";

/** The sidebar slot id this component fills (must match the declared slot). */
const SLOT = "sidebar";

/**
 * Sidebar slot: a SUNKEN (inset) well that gives depth. The well border + inset
 * shadow are ALWAYS there whether or not there is a banner.
 *
 * Squareness is driven by CONTENT, not by a CSS `aspect-square` on the well
 * (which renders a hair non-square inside the sidebar flex column and made the
 * banner crop). The banner image is square (1254×1254), so letting it drive the
 * height makes the well a perfect square AND shows the image whole — no crop.
 * The "Novedades" fallback uses `aspect-square` on its own box to keep the empty
 * well square. Hidden when the sidebar is collapsed.
 */
export function SidebarPromo({ onOpen }: { onOpen?: () => void }) {
	const { t, lang } = useLang();
	const [banner, setBanner] = useState<ServeBanner | null>(null);

	useEffect(() => {
		let cancelled = false;
		void (async () => {
			await registerAds();
			const banners = await serveAds(lang);
			if (!cancelled) setBanner(banners.find((b) => b.slotId === SLOT) ?? null);
		})();
		return () => {
			cancelled = true;
		};
	}, [lang]);

	function openBanner() {
		if (!banner) return;
		void clickAds(SLOT, lang);
		if (banner.linkUrl) void openUrl(banner.linkUrl);
	}

	return (
		<div className="mt-auto px-2 pb-1 group-data-[collapsible=icon]:hidden">
			{/* Sunken well — border + inset shadow = depth. Height comes from content. */}
			<div className="relative w-full shrink-0 rounded-[10px] border border-black/[0.06] bg-black/[0.03] p-2 shadow-[inset_0_1px_4px_rgba(15,23,42,0.06)] dark:border-black/40 dark:bg-black/25 dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(255,255,255,0.05)]">
				{banner ? (
					<button
						type="button"
						onClick={openBanner}
						className="block w-full cursor-pointer overflow-hidden rounded-[8px]"
					>
						<img
							src={banner.imageUrl}
							alt=""
							className="block h-auto w-full select-none"
							draggable={false}
						/>
					</button>
				) : (
					/* Fallback: own "Novedades" content when there is no banner. */
					<div className="flex aspect-square w-full flex-col overflow-hidden rounded-[8px] bg-gradient-to-br from-primary/15 via-primary/[0.06] to-transparent p-2.5 dark:from-primary/25 dark:via-primary/10">
						<div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-primary">
							<Megaphone className="size-3" />
							{t("Novedades")}
						</div>
						<div className="mt-1.5 flex flex-1 flex-col justify-center gap-1">
							<span className="text-[13px] font-semibold leading-tight">
								{t("Bienvenido a ZodHub Pulse")}
							</span>
							<span className="text-[10px] leading-snug text-muted-foreground">
								{t("Este espacio mostrará novedades y avisos nuestros, en tu idioma.")}
							</span>
						</div>
						<button
							type="button"
							onClick={onOpen}
							className="mt-1.5 flex cursor-pointer items-center justify-center gap-1 rounded-md bg-primary/20 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/30"
						>
							{t("Saber más")}
							<ArrowRight className="size-3" />
						</button>
					</div>
				)}
			</div>
		</div>
	);
}

export default SidebarPromo;
