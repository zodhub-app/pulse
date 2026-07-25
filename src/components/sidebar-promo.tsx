import { Megaphone, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLang } from "@/components/language-provider";
import { openUrl } from "@/lib/links";
import { type Ad, adClickUrl, adImpression, serveAd } from "@/lib/api";
import { getDeviceId } from "@/lib/device";

/** Clave del hueco de anuncios de este banner (crear en ZodHub → Ads → Huecos). */
const PLACEMENT = "pulse-sidebar";

/**
 * Espacio privilegiado del sidebar con aspecto de HENDIDURA (hundido, con
 * profundidad) para banners/anuncios controlados por nosotros.
 *
 * Pide un anuncio al servidor de ZodHub (`GET /api/app/ads/serve`) segmentado
 * por idioma (el elegido en la app) y país (región del sistema); cuenta la
 * impresión al mostrarse y abre el clic en el navegador. Si no hay anuncio
 * elegible (o falla la red), muestra el contenido propio de «Novedades».
 * Se oculta cuando el sidebar está colapsado.
 */
export function SidebarPromo({ onOpen }: { onOpen?: () => void }) {
  const { t, lang } = useLang();
  const [ad, setAd] = useState<Ad | null>(null);
  const firedRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const country =
        typeof navigator !== "undefined"
          ? navigator.language?.split("-")[1]?.toUpperCase()
          : undefined;
      const got = await serveAd({
        placement: PLACEMENT,
        locale: lang,
        country,
        deviceId: getDeviceId(),
        deviceType: "desktop",
      });
      // El sidebar (cuadrado pequeño) solo pinta imagen/nativo; otros tipos → fallback.
      if (!cancelled) setAd(got && (got.type === "image" || got.type === "native") ? got : null);
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    if (ad && firedRef.current !== ad.impressionToken) {
      firedRef.current = ad.impressionToken;
      void adImpression(ad.impressionToken);
    }
  }, [ad]);

  function openAd() {
    if (!ad) return;
    const url = adClickUrl(ad);
    if (url) void openUrl(url);
  }

  return (
    <div className="mt-auto px-2 pb-1 group-data-[collapsible=icon]:hidden">
      <div className="relative aspect-square w-full rounded-lg border border-black/[0.06] bg-black/[0.03] p-2 shadow-[inset_0_1px_4px_rgba(15,23,42,0.06)] dark:border-black/40 dark:bg-black/25 dark:shadow-[inset_0_2px_10px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(255,255,255,0.05)]">
        {ad && ad.type === "image" ? (
          <button
            type="button"
            onClick={openAd}
            className="block h-full w-full overflow-hidden rounded-md"
          >
            <img
              src={ad.imageUrl}
              alt={ad.alt ?? ""}
              className="h-full w-full object-cover"
            />
          </button>
        ) : ad && ad.type === "native" ? (
          <button
            type="button"
            onClick={openAd}
            className="flex h-full w-full flex-col overflow-hidden rounded-md bg-gradient-to-br from-primary/15 via-primary/[0.06] to-transparent p-2.5 text-left dark:from-primary/25 dark:via-primary/10"
          >
            {ad.imageUrl && (
              <img
                src={ad.imageUrl}
                alt={ad.alt ?? ""}
                className="mb-1.5 h-12 w-full shrink-0 rounded object-cover"
              />
            )}
            <span className="text-[13px] font-semibold leading-tight line-clamp-2">
              {ad.title}
            </span>
            {ad.body && (
              <span className="mt-0.5 text-[10px] leading-snug text-muted-foreground line-clamp-3">
                {ad.body}
              </span>
            )}
            {ad.ctaText && (
              <span className="mt-auto flex items-center gap-1 pt-1 text-[10px] font-medium text-primary">
                {ad.ctaText}
                <ArrowRight className="size-3" />
              </span>
            )}
          </button>
        ) : (
          /* Fallback propio: contenido de «Novedades» cuando no hay anuncio. */
          <div className="flex h-full flex-col overflow-hidden rounded-md bg-gradient-to-br from-primary/15 via-primary/[0.06] to-transparent p-2.5 dark:from-primary/25 dark:via-primary/10">
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
              className="mt-1.5 flex items-center justify-center gap-1 rounded-md bg-primary/20 py-1 text-[10px] font-medium text-primary transition-colors hover:bg-primary/30"
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
