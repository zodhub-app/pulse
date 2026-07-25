// Texto y enlaces para compartir la app en redes.
//
// El texto se sirve en el IDIOMA de la app (si el usuario la tiene en inglés,
// comparte en inglés; en español, en español). Lo consumen el tab «Compartir» y
// los botones de compartir.

export type ShareLang = "es" | "en";

/**
 * URL pública que se comparte, POR IDIOMA. En español la web vive bajo `/es`;
 * en inglés, en la raíz.
 */
export function shareUrl(lang: ShareLang): string {
  return lang === "en" ? "https://zodhub.app" : "https://zodhub.app/es";
}

/** Copia de marketing lista para pegar (con emojis), por idioma. */
export function shareText(lang: ShareLang): string {
  const url = shareUrl(lang);
  if (lang === "en") {
    return [
      "🚀 Pulse — Keep your Mac, Windows, and Linux running like new. 100% free, no fine print, and no monthly fees.",
      "",
      "✨ 100% Free forever",
      "🔒 No hidden fees or subscriptions",
      "💻 Cross-platform",
      "",
      `Give it a try: ${url}`,
    ].join("\n");
  }
  return [
    "🚀 Pulse — Mantén tu Mac, Windows y Linux como nuevos. 100% gratis, sin letra pequeña y sin cuotas mensuales.",
    "",
    "✨ 100% gratis para siempre",
    "🔒 Sin costes ocultos ni suscripciones",
    "💻 Multiplataforma",
    "",
    `Pruébalo: ${url}`,
  ].join("\n");
}

/**
 * Imagen Open Graph real que acompaña al enlace en redes, POR IDIOMA (la misma
 * que sirve zodhub.app en su `og:image`). En español es la variante `-2`.
 *
 * ÚNICO punto donde vive la URL de la imagen: si en la web cambiáis el archivo
 * o el tamaño (p. ej. a 1:1), basta actualizar aquí — y si conserváis la MISMA
 * URL (mismo path), el visor coge la nueva sola. El tab la muestra con
 * `object-contain`, así que cualquier proporción se ve entera sin recortes.
 *
 * (Automatización futura: un endpoint `/api/app/meta?lang=` en zodhub.app que
 * devuelva la og:image vigente evitaría tener que tocar esto nunca.)
 */
export function shareImage(lang: ShareLang): string {
  return lang === "en"
    ? "https://zodhub.app/og-images/page-uploads/home_og.webp"
    : "https://zodhub.app/og-images/page-uploads/home_og-2.webp";
}

/** Título corto para redes que piden título/asunto (Reddit, email). */
export function shareTitle(lang: ShareLang): string {
  return lang === "en"
    ? "Pulse — free, honest, cross-platform maintenance"
    : "Pulse — mantenimiento honesto y multiplataforma, gratis";
}

/**
 * URLs de intención por red. Nota honesta sobre cada una:
 *  - X, WhatsApp, Telegram, Bluesky y email prefills el texto/asunto.
 *  - Facebook: `quote` a veces se rellena, a veces no (depende de FB).
 *  - LinkedIn y Reddit toman la URL (y su metadata Open Graph). Por eso en el
 *    tab también se muestra el texto para copiar, funcione o no el prefill.
 */
export function shareUrls(lang: ShareLang): {
  x: string;
  whatsapp: string;
  telegram: string;
  gmail: string;
  yahoo: string;
  facebook: string;
  linkedin: string;
  reddit: string;
  bluesky: string;
} {
  const url = encodeURIComponent(shareUrl(lang));
  const text = encodeURIComponent(shareText(lang));
  const title = encodeURIComponent(shareTitle(lang));
  return {
    x: `https://twitter.com/intent/tweet?text=${text}`,
    whatsapp: `https://wa.me/?text=${text}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`,
    // Redacción web de Gmail y Yahoo (prefills asunto + cuerpo). El cuerpo lleva
    // el enlace, así que el cliente que despliega enlaces mostrará la og:image.
    gmail: `https://mail.google.com/mail/?view=cm&fs=1&su=${title}&body=${text}`,
    yahoo: `https://compose.mail.yahoo.com/?subject=${title}&body=${text}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
    reddit: `https://www.reddit.com/submit?url=${url}&title=${title}`,
    bluesky: `https://bsky.app/intent/compose?text=${text}`,
  };
}
