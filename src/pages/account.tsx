import { useEffect, useState, type ReactNode } from "react";
import {
  AtSign,
  BadgeCheck,
  Bell,
  ChevronDown,
  Clock,
  Cloud,
  Code2,
  Coffee,
  Copy,
  Facebook,
  FileText,
  Gauge,
  Github,
  Globe,
  Globe2,
  Heart,
  HeartHandshake,
  LifeBuoy,
  Linkedin,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  MessageSquare,
  Newspaper,
  RefreshCw,
  Scale,
  Send,
  Server,
  Share2,
  ShieldCheck,
  Sparkles,
  Twitter,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/language-provider";
import { useUpdates } from "@/components/updates-provider";
import {
  subscribe,
  subscribeAvailable,
  submitSupport,
  SupportError,
  getContactCategories,
  getAppMeta,
  type ContactCategory,
} from "@/lib/api";
import { useCachedResource } from "@/hooks/use-cached-resource";
import { openUrl, webLinks, GITHUB } from "@/lib/links";
import { resolveLocaleMap, isValidEmail } from "@/lib/i18n";
import { shareImage, shareText, shareUrls } from "@/lib/share";
import { DonatePanel } from "@/components/donate-panel";
import { changelog, localize } from "@/data/changelog";

export function AccountPage() {
  const { t } = useLang();

  return (
    <div className="space-y-2.5">
      <Hero />

      <Tabs defaultValue="novedades" className="w-full gap-2.5">
        {/* El componente Tabs trae por defecto "gap-2" entre la lista y el
            contenido; lo pisamos a 2.5 para que sea EXACTAMENTE el mismo
            hueco que separa la Cabecera de los tabs (`space-y-2.5` del
            contenedor), y quitamos el mt-2.5 duplicado que llevaba cada
            TabsContent (sumaba un hueco mayor y descuadraba la simetría). */}
        {/* Borde de la pestaña activa: el mismo hairline translúcido que el resto
            de la app (no el `border-input`, más sólido, que traía por defecto). */}
        <TabsList className="w-full">
          <TabsTrigger
            value="novedades"
            className="data-[state=active]:border-foreground/[0.07] dark:data-[state=active]:border-foreground/[0.07]"
          >
            <Newspaper className="size-4" />
            {t("Novedades")}
          </TabsTrigger>
          <TabsTrigger
            value="correo"
            className="data-[state=active]:border-foreground/[0.07] dark:data-[state=active]:border-foreground/[0.07]"
          >
            <Bell className="size-4" />
            {t("Suscripción")}
          </TabsTrigger>
          <TabsTrigger
            value="apoyar"
            className="data-[state=active]:border-foreground/[0.07] dark:data-[state=active]:border-foreground/[0.07]"
          >
            <Heart className="size-4" />
            {t("Apoyar")}
          </TabsTrigger>
          <TabsTrigger
            value="compartir"
            className="data-[state=active]:border-foreground/[0.07] dark:data-[state=active]:border-foreground/[0.07]"
          >
            <Share2 className="size-4" />
            {t("Compartir")}
          </TabsTrigger>
          <TabsTrigger
            value="soporte"
            className="data-[state=active]:border-foreground/[0.07] dark:data-[state=active]:border-foreground/[0.07]"
          >
            <LifeBuoy className="size-4" />
            {t("Soporte")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="novedades">
          {/* 60/40: el hilo de novedades a la izquierda; a la derecha, la
              tarjeta "Sobre ZodHub Pulse" (antes un modal aparte), alineada
              arriba con el hilo (items-start) y fija (sticky) para que solo
              el hilo se mueva al hacer scroll. */}
          <div className="grid items-start gap-2.5 lg:grid-cols-[3fr_2fr]">
            <Changelog />
            <AboutCard />
          </div>
        </TabsContent>

        <TabsContent value="correo">
          <SubscribeTab />
        </TabsContent>

        <TabsContent value="apoyar">
          <SupportTab />
        </TabsContent>

        <TabsContent value="compartir">
          <ShareTab />
        </TabsContent>

        <TabsContent value="soporte">
          <SupportFormTab />
        </TabsContent>
      </Tabs>

      <p className="px-1 pb-1 text-center text-xs text-muted-foreground">
        {t("Hecho con cuidado. Tu equipo, sencillamente limpio y seguro.")}
      </p>
    </div>
  );
}

/* ─────────────────────────────── Cabecera ─────────────────────────────── */

function Hero() {
  const { t, lang } = useLang();
  const u = useUpdates();
  const links = webLinks(lang);

  const state =
    u.status === "available"
      ? t("Hay una versión nueva disponible")
      : u.status === "uptodate"
        ? t("Estás al día")
        : u.status === "checking" || u.status === "idle"
          ? t("Comprobando actualizaciones…")
          : t("No se pudo comprobar");

  return (
    <div data-slot="card" className="rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-medium leading-tight">ZodHub Pulse</h2>
          <p className="text-sm text-muted-foreground">
            {u.currentVersion ? `v${u.currentVersion} · ` : ""}
            {state}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Mismo rol que la campana: si hay versión nueva, instala; si no,
              comprueba. Se bloquea/gira mientras trabaja. */}
          <Button
            variant="secondary"
            size="sm"
            disabled={
              u.status === "checking" ||
              u.status === "downloading" ||
              u.status === "installing"
            }
            onClick={() =>
              void (u.status === "available" ||
              u.status === "downloading" ||
              u.status === "installing"
                ? u.install()
                : u.checkNow())
            }
          >
            <RefreshCw
              className={cn(
                "size-4",
                (u.status === "checking" ||
                  u.status === "downloading" ||
                  u.status === "installing") &&
                  "animate-spin",
              )}
            />
            {t("Actualizar App")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openUrl(links.web)}>
            <Globe className="size-4" />
            {t("Visitar la web")}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openUrl(GITHUB.repo)}>
            <Github className="size-4" />
            {t("Ver en GitHub")}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────── Tab 1 · Muro de novedades (hilo) ─────────────────── */

function Changelog() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div data-slot="card" className="rounded-lg border bg-card p-5">
      <header className="mb-4 flex items-center gap-2">
        <Newspaper className="size-4 text-primary" />
        <h3 className="text-sm font-medium">
          {t("Lo último que hemos traído")} ({t("Actualizaciones")})
        </h3>
      </header>

      <ol className="relative">
        {changelog.map((it, i) => {
          const isOpen = open === it.v;
          const last = i === changelog.length - 1;
          const more = it.more ? localize(it.more, lang) : null;
          return (
            <li key={it.v} className="relative flex gap-3">
              {/* Hilo continuo: la línea se posiciona sobre el <li> y se prolonga
                  por debajo (-bottom) hasta alcanzar el punto del item siguiente,
                  cruzando el hueco entre tarjetas. En el último item no hay línea. */}
              {!last && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[5px] top-3 -bottom-3 w-px -translate-x-1/2 bg-foreground/20"
                />
              )}
              <div className="relative z-10 flex w-2.5 shrink-0 justify-center pt-1.5">
                <span className="size-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
              </div>

              <article
                className={cn(
                  "min-w-0 flex-1 rounded-lg border border-foreground/[0.07] bg-background/40 p-3.5",
                  !last && "mb-3",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-primary/12 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                    v{it.v}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {localize(it.date, lang)}
                  </span>
                </div>
                <h4 className="mt-1.5 text-sm font-semibold leading-snug">
                  {localize(it.title, lang)}
                </h4>
                {/* Máx. 3 líneas con elipsis; el detalle va en el acordeón "Ver más". */}
                <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">
                  {localize(it.body, lang)}
                </p>

                {more && (
                  <>
                    {isOpen && (
                      <p className="mt-2 border-t border-foreground/[0.07] pt-2 text-xs leading-5 text-muted-foreground">
                        {more}
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : it.v)}
                      className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary transition-opacity hover:opacity-80"
                    >
                      {isOpen ? t("Ver menos") : t("Ver más")}
                      <ChevronDown
                        className={cn(
                          "size-3.5 transition-transform",
                          isOpen && "rotate-180",
                        )}
                      />
                    </button>
                  </>
                )}
              </article>
            </li>
          );
        })}
      </ol>

      <Separator className="my-4" />
      <Button
        variant="secondary"
        size="sm"
        onClick={() => openUrl(GITHUB.releases)}
      >
        <FileText className="size-4" />
        {t("Ver historial completo de versiones")}
      </Button>
    </div>
  );
}

/* ──────────── Tab 1 · Tarjeta "Sobre ZodHub Pulse" (antes un modal) ────── */

function AboutFeature({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium leading-tight">{title}</p>
        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
          {children}
        </p>
      </div>
    </div>
  );
}

/** Antes vivía en un modal aparte (botón "i" de Inicio). Ahora es la tarjeta
 *  fija (sticky) junto al hilo de novedades: misma información, siempre a la
 *  vista, y con la versión leída en vivo (nunca escrita a mano). */
function AboutCard() {
  const { t } = useLang();
  const u = useUpdates();

  return (
    // El sticky va en este div ENVOLVENTE, no en el de data-slot="card": el
    // skin Hera define `[data-slot="card"] { position: relative }` con más
    // especificidad CSS que la utilidad `.lg:sticky`, así que puesto en el
    // propio card el "relative" del skin siempre ganaba y el sticky no hacía
    // nada. Envolviendo, el hijo con data-slot="card" mantiene su estilo de
    // cristal intacto y el "sticky" (en un elemento sin ese atributo) manda.
    <div className="lg:sticky lg:top-2.5 lg:self-start">
      <div data-slot="card" className="rounded-lg border bg-card p-5">
        <div className="flex items-center gap-3">
          <span className="logo-badge flex size-10 shrink-0 items-center justify-center rounded-xl text-white">
            <Sparkles className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 className="gradient-text text-base font-semibold leading-tight">
              ZodHub Pulse
            </h3>
            <p className="truncate text-xs text-muted-foreground">
              {t("Tu equipo, sencillamente limpio y seguro.")}
            </p>
          </div>
        </div>

        <p className="mt-3.5 text-xs leading-5 text-muted-foreground">
          {t(
            "ZodHub Pulse es una utilidad de mantenimiento para tu equipo, directa y sin humo: limpia cachés, libera espacio y automatiza el mantenimiento en Mac, Windows y Linux. Lo esencial, bien hecho.",
          )}
        </p>

        <div className="mt-4 flex flex-col gap-3.5">
          <AboutFeature
            icon={<Sparkles className="size-3.5" />}
            title={t("Sencillo de verdad")}
          >
            {t(
              "Solo las operaciones que tu equipo necesita para ir fino. Sin menús interminables ni funciones de relleno.",
            )}
          </AboutFeature>
          <AboutFeature
            icon={<Lock className="size-3.5" />}
            title={t("Privado y en local")}
          >
            {t(
              "Todo se ejecuta en tu equipo. Tus archivos y métricas nunca se suben a la nube. Cero telemetría por defecto.",
            )}
          </AboutFeature>
          <AboutFeature
            icon={<Gauge className="size-3.5" />}
            title={t("Transparente")}
          >
            {t(
              "Te enseña qué va a hacer y con qué datos antes de tocar nada. Sin cajas negras: lo que ves es lo que pasa.",
            )}
          </AboutFeature>
          <AboutFeature
            icon={<HeartHandshake className="size-3.5" />}
            title={t("¿Por qué ZodHub Pulse?")}
          >
            {t(
              "Ligera, clara y respetuosa con tus datos, frente a los limpiadores pesados llenos de avisos y suscripciones. Hace lo justo, y lo hace bien.",
            )}
          </AboutFeature>
        </div>

        <p className="mt-4 border-t border-foreground/[0.07] pt-3 text-[11px] leading-5 text-muted-foreground">
          {t(
            "Nota honesta: ZodHub Pulse no es un antivirus ni un cortafuegos. El radar de red representa el ruido constante de escaneos de internet que recibe cualquier equipo conectado; su intensidad, en vivo, refleja la actividad real de tu red para mantenerte al tanto de lo que pasa de puertas afuera.",
          )}
          {u.currentVersion ? ` · ${t("Versión")} ${u.currentVersion}` : ""}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────── Tab 2 · Suscripción (form + info) ──────────────────── */

function SubscribeTab() {
  return (
    <div className="space-y-2.5">
      <div className="grid gap-2.5 lg:grid-cols-[1.1fr_0.9fr]">
        <Subscribe />
        <SubscribeInfo />
      </div>
      <LegalFooter />
    </div>
  );
}

function SubscribeInfo() {
  const { t } = useLang();
  const points: Array<{ icon: typeof Sparkles; title: string; desc: string }> = [
    {
      icon: Sparkles,
      title: t("Funciones nuevas primero"),
      desc: t("Te contamos las mejoras que valen la pena en cuanto salen."),
    },
    {
      icon: ShieldCheck,
      title: t("Solo lo importante"),
      desc: t("Sin spam ni correos de relleno: escribimos poco y con motivo."),
    },
    {
      icon: Mail,
      title: t("Baja cuando quieras"),
      desc: t("Un clic y fuera. Tus datos son tuyos, siempre."),
    },
  ];
  return (
    <section data-slot="card" className="relative overflow-hidden rounded-lg border bg-card p-5">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-primary/10 blur-3xl"
      />
      <header className="relative mb-3 flex items-center gap-2">
        <Bell className="size-4 text-primary" />
        <h3 className="text-sm font-medium">{t("¿Por qué suscribirte?")}</h3>
      </header>
      <div className="relative space-y-3">
        {points.map((p) => (
          <div key={p.title} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
              <p.icon className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium leading-tight">{p.title}</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                {p.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      <Separator className="relative my-4" />
      <p className="relative text-xs leading-5 text-muted-foreground">
        {t(
          "La app se actualiza sola: suscribirte es solo para enterarte de las novedades, nunca un requisito.",
        )}
      </p>
    </section>
  );
}

/* ────────────────────────────── Suscripción ────────────────────────────── */

function Subscribe() {
  const { t } = useLang();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    subscribeAvailable()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  const emailOk = isValidEmail(email);
  const canSend = emailOk && consent && !sending;

  async function onSubmit() {
    setSending(true);
    try {
      await subscribe(name, email);
      setDone(true);
      toast.success(t("¡Suscripción completada!"));
    } catch (e) {
      toast.error(t("No se pudo completar la suscripción"), {
        description: String(e),
      });
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <section data-slot="card" className="flex flex-col items-center justify-center rounded-lg border bg-card p-5 text-center">
        <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
          <BadgeCheck className="size-5" />
        </span>
        <p className="text-sm font-medium">{t("¡Gracias por suscribirte!")}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("Te escribiremos solo cuando haya algo que merezca la pena.")}
        </p>
      </section>
    );
  }

  return (
    <section data-slot="card" className="rounded-lg border bg-card p-5">
      <header className="mb-1 flex items-center gap-2">
        <Mail className="size-4 text-primary" />
        <h3 className="text-sm font-medium">{t("Novedades por correo")}</h3>
      </header>
      <p className="mb-4 text-sm leading-6 text-muted-foreground">
        {t(
          "Si quieres, te avisamos de las funciones nuevas y las mejoras importantes. Es completamente opcional: la app ya se actualiza sola sin necesidad de esto.",
        )}
      </p>

      {available === false ? (
        <p className="rounded-lg bg-black/10 p-3 text-xs text-muted-foreground">
          {t("La suscripción no está disponible por ahora.")}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="sub-name" className="text-xs">
                {t("Nombre (opcional)")}
              </Label>
              <Input
                id="sub-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("Tu nombre")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sub-email" className="text-xs">
                {t("Correo electrónico")}
              </Label>
              <Input
                id="sub-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
              />
            </div>
          </div>

          {/* Consentimiento explícito y SIN premarcar (requisito del RGPD). */}
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-5 text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
            />
            <span>
              {t(
                "Acepto recibir novedades de ZodHub Pulse y he leído la política de privacidad. Puedo darme de baja cuando quiera.",
              )}
            </span>
          </label>

          <Button className="w-full" disabled={!canSend} onClick={onSubmit}>
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("Enviando…")}
              </>
            ) : (
              <>
                <Mail className="size-4" />
                {t("Suscribirme")}
              </>
            )}
          </Button>

          {/* Matiz de honestidad: la app no envía nada por su cuenta. */}
          <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
            {t(
              "ZodHub Pulse no envía ningún dato de tu equipo. Lo único que sale de aquí es lo que escribas arriba, y solo si pulsas Suscribirme.",
            )}
          </p>
        </div>
      )}
    </section>
  );
}

/* ─────────────────────────── Tab 3 · Apoyar ────────────────────────────── */

function SupportTab() {
  const { t } = useLang();

  const spend: Array<{
    pct: number;
    label: string;
    desc: string;
    icon: typeof Server;
  }> = [
    {
      pct: 45,
      label: t("Servidor y CDN"),
      desc: t("Alojar y servir las descargas rápido en todo el mundo."),
      icon: Server,
    },
    {
      pct: 35,
      label: t("Desarrollo"),
      desc: t("Horas para funciones nuevas, Linux y Windows."),
      icon: Code2,
    },
    {
      pct: 10,
      label: t("Dominio"),
      desc: t("Mantener zodhub.app y los correos activos."),
      icon: Globe2,
    },
    {
      pct: 10,
      label: t("Café e imprevistos"),
      desc: t("Lo que mantiene despierto a quien lo programa."),
      icon: Coffee,
    },
  ];

  const reasons: Array<{ icon: typeof Sparkles; title: string; desc: string }> = [
    {
      icon: Sparkles,
      title: t("Gratis para todos"),
      desc: t("Mantiene Pulse 100% gratis, sin anuncios ni funciones de pago."),
    },
    {
      icon: Gauge,
      title: t("Funciones nuevas"),
      desc: t("Financia el desarrollo y el soporte para Linux y Windows."),
    },
    {
      icon: Lock,
      title: t("Independiente"),
      desc: t("Sin inversores ni intermediarios: tu aporte llega entero."),
    },
  ];

  return (
    <div className="space-y-2.5">
      {/* Módulo de donación (selector + meta del mes), pago dentro de la app. */}
      <DonatePanel />

      <div className="grid gap-2.5 lg:grid-cols-2">
        {/* A dónde va cada euro. */}
        <section data-slot="card" className="rounded-lg border bg-card p-5">
          <header className="mb-1 flex items-center gap-2">
            <Scale className="size-4 text-primary" />
            <h3 className="text-sm font-medium">{t("A dónde va cada euro")}</h3>
          </header>
          <p className="mb-4 text-xs leading-5 text-muted-foreground">
            {t("Sin sueldos millonarios ni humo. Esto es lo que sostiene el proyecto:")}
          </p>
          <div className="space-y-3">
            {spend.map((s) => (
              <div key={s.label} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                  <s.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">{s.label}</p>
                    <span className="text-xs font-semibold tabular-nums text-primary">
                      {s.pct}%
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] leading-4 text-muted-foreground/70">
            {t("Reparto orientativo de los costes del proyecto, no contabilidad exacta.")}
          </p>
        </section>

        {/* Por qué tu apoyo importa — anima a donar, a la misma altura. */}
        <section data-slot="card" className="rounded-lg border bg-card p-5">
          <header className="mb-1 flex items-center gap-2">
            <HeartHandshake className="size-4 text-rose-500" />
            <h3 className="text-sm font-medium">{t("Por qué tu apoyo importa")}</h3>
          </header>
          <p className="mb-4 text-xs leading-5 text-muted-foreground">
            {t("Pulse es gratis y sin anuncios. Tu donación es justo lo que lo mantiene así:")}
          </p>
          <div className="space-y-3">
            {reasons.map((r) => (
              <div key={r.title} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/12 text-rose-500">
                  <r.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{r.title}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    {r.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">
            {t("Con lo que cuesta un café ya ayudas de verdad. Sin cuotas ni compromiso.")}
          </p>
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────── Tab · Soporte ─────────────────────────────── */

// Respaldo si la web no devuelve categorías (idéntico al widget público de
// zodhub.app: una sola opción "General"). Nunca se inventan categorías: las
// reales llegan de /api/app/contact/categories.
const FALLBACK_CATEGORY: ContactCategory = {
  id: "fallback",
  name: { es: "General", en: "General" },
  description: {},
};

function SupportFormTab() {
  const { t, lang } = useLang();
  // Categorías REALES del sistema de contacto de la web (misma tabla, misma
  // query y orden que el formulario público). Se cargan de la API y se cachean;
  // si en /admin/contact/categories se añade/renombra/reordena una, aquí cambia.
  const { data: cats } = useCachedResource(
    "support:categories",
    getContactCategories,
  );
  const categories =
    cats && cats.length > 0 ? cats : [FALLBACK_CATEGORY];

  // Campos EXACTOS del sistema de contacto (name, email, topic, message). No hay
  // apellidos/teléfono/adjuntos en el modelo, así que no se piden: enviarlos
  // solo confundiría y el backend los ignoraría.
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  // Al llegar las categorías (o cambiar), si la elegida no existe seleccionamos
  // la primera — igual que el widget público (topics[0]).
  useEffect(() => {
    if (!categories.some((c) => c.id === topic)) {
      setTopic(categories[0]?.id ?? "");
    }
  }, [categories, topic]);

  const selected = categories.find((c) => c.id === topic);
  const selectedDesc = resolveLocaleMap(selected?.description, lang);

  const emailOk = isValidEmail(email);
  const canSend =
    name.trim() !== "" &&
    emailOk &&
    message.trim().length > 4 &&
    topic !== "" &&
    !sending;

  async function onSubmit() {
    setSending(true);
    try {
      await submitSupport({
        topic,
        // Snapshot del nombre multi-idioma de la categoría, igual que la web.
        topicLabel: selected?.name,
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      });
      setDone(true);
      toast.success(t("Mensaje enviado. Te responderemos por email."));
    } catch (e) {
      if (e instanceof SupportError && e.code === "contact_daily_limit") {
        // Tope diario alcanzado: avisamos de cuántas horas hay que esperar.
        toast.error(t("Has alcanzado el límite diario de soporte"), {
          description: t(
            "Para enviar otro mensaje al soporte, espera unas {h} h.",
            { h: e.retryAfterHours ?? 24 },
          ),
        });
      } else {
        const msg = e instanceof Error ? e.message : "";
        toast.error(t("No se pudo enviar el mensaje."), {
          description: msg || undefined,
        });
      }
    } finally {
      setSending(false);
    }
  }

  const points: Array<{ icon: typeof LifeBuoy; title: string; desc: string }> = [
    {
      icon: Mail,
      title: t("Respuesta por email"),
      desc: t("Te contestamos a la dirección que dejes, en tu idioma."),
    },
    {
      icon: Clock,
      title: t("Leemos todo"),
      desc: t("Es un proyecto pequeño; respondemos en cuanto podemos."),
    },
    {
      icon: ShieldCheck,
      title: t("Tus datos, solo para responderte"),
      desc: t("No se usan para nada más ni se comparten. Cero telemetría."),
    },
  ];

  return (
    <div className="grid items-start gap-2.5 lg:grid-cols-[3fr_2fr]">
      {/* Izquierda (60%): formulario. */}
      <section data-slot="card" className="rounded-lg border bg-card p-5">
        {done ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <BadgeCheck className="size-5" />
            </span>
            <p className="text-sm font-medium">{t("¡Gracias! Mensaje recibido.")}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Te responderemos por email lo antes posible.")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="sup-name" className="text-xs">
                  {t("Nombre")}
                </Label>
                <Input
                  id="sup-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t("Tu nombre")}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sup-email" className="text-xs">
                  {t("Correo electrónico")}
                </Label>
                <Input
                  id="sup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-topic" className="text-xs">
                {t("Asunto")}
              </Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger id="sup-topic" className="w-full">
                  <SelectValue placeholder={t("Elige un asunto")} />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={6} className="w-[--radix-select-trigger-width]">
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {resolveLocaleMap(c.name, lang)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDesc && (
                <p className="text-[11px] leading-4 text-muted-foreground">
                  {selectedDesc}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sup-msg" className="text-xs">
                {t("Descripción")}
              </Label>
              <Textarea
                id="sup-msg"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={7}
                className="resize-y leading-6"
                placeholder={t("Cuéntanos qué pasa, con el máximo detalle posible.")}
              />
            </div>
            <Button className="w-full" disabled={!canSend} onClick={onSubmit}>
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {t("Enviando…")}
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  {t("Enviar mensaje")}
                </>
              )}
            </Button>
            <p className="flex items-start gap-2 text-[11px] leading-4 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-emerald-500" />
              {t(
                "Solo se envía lo que escribas aquí, y solo al pulsar Enviar. Se gestiona con las mismas reglas que el soporte de zodhub.app.",
              )}
            </p>
          </div>
        )}
      </section>

      {/* Derecha (40%): info de soporte. */}
      <section data-slot="card" className="rounded-lg border bg-card p-5">
        <header className="mb-1 flex items-center gap-2">
          <LifeBuoy className="size-4 text-primary" />
          <h3 className="text-sm font-medium">{t("¿Algo no funciona?")}</h3>
        </header>
        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          {t(
            "Cuéntanos el problema, el error o lo que echas en falta. Cuanto más detalle, mejor te ayudamos.",
          )}
        </p>
        <div className="space-y-3">
          {points.map((p) => (
            <div key={p.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
                <p.icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium leading-tight">{p.title}</p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <p className="text-[11px] leading-4 text-muted-foreground">
          {t(
            "Para una captura, descríbela o pega un enlace a la imagen en el mensaje.",
          )}
        </p>
      </section>
    </div>
  );
}

/* ─────────────────────────── Tab · Compartir ───────────────────────────── */

function ShareTab() {
  const { t, lang } = useLang();
  const text = shareText(lang);
  const urls = shareUrls(lang);
  // og:image REAL que sirve la web ahora mismo (getAppMeta la lee de la propia
  // página, así que aunque la renombren la app la sigue). Respaldo: shareImage.
  const { data: meta } = useCachedResource(`share:meta:${lang}`, () =>
    getAppMeta(lang),
  );
  const ogImage = meta?.ogImage ?? shareImage(lang);
  const webHost = webLinks(lang).web.replace(/^https?:\/\//, "");
  // Si la imagen no cargara (sin red), caemos a la tarjeta de marca.
  const [imgFailed, setImgFailed] = useState(false);

  const socials: Array<{
    icon: typeof Share2;
    label: string;
    url: string;
    color: string;
  }> = [
    { icon: MessageCircle, label: t("Compartir en WhatsApp"), url: urls.whatsapp, color: "text-[#25d366]" },
    { icon: Twitter, label: t("Compartir en X"), url: urls.x, color: "text-foreground" },
    { icon: Send, label: t("Compartir en Telegram"), url: urls.telegram, color: "text-[#229ed9]" },
    { icon: Mail, label: t("Enviar por Gmail"), url: urls.gmail, color: "text-[#ea4335]" },
    { icon: AtSign, label: t("Enviar por Yahoo"), url: urls.yahoo, color: "text-[#6001d2]" },
    { icon: Facebook, label: t("Compartir en Facebook"), url: urls.facebook, color: "text-[#1877f2]" },
    { icon: Linkedin, label: t("Compartir en LinkedIn"), url: urls.linkedin, color: "text-[#0a66c2]" },
    { icon: MessageSquare, label: t("Compartir en Reddit"), url: urls.reddit, color: "text-[#ff4500]" },
    { icon: Cloud, label: t("Compartir en Bluesky"), url: urls.bluesky, color: "text-[#0085ff]" },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("Texto copiado"));
    } catch {
      toast.error(t("No se pudo copiar"));
    }
  }

  return (
    <div className="grid items-start gap-2.5 lg:grid-cols-[3fr_2fr]">
      {/* Izquierda: UNA sola card que imita cómo se verá al compartir —el texto
          arriba (el post) y debajo la tarjeta del enlace con la imagen real. */}
      <section data-slot="card" className="rounded-lg border bg-card p-5">
        <header className="mb-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <Share2 className="size-4 text-primary" />
            <h3 className="text-sm font-medium">{t("Vista previa de lo que compartirás")}</h3>
          </span>
          <Button variant="secondary" size="sm" onClick={copy}>
            <Copy className="size-3.5" />
            {t("Copiar texto")}
          </Button>
        </header>

        <div className="rounded-lg border border-foreground/[0.07] bg-background/40 p-3">
          {/* Texto del post */}
          <p className="whitespace-pre-line text-sm leading-6">{text}</p>

          {/* Tarjeta del enlace (imagen + título + dominio), como en una red. */}
          <div className="mt-3 overflow-hidden rounded-lg border border-foreground/[0.07] bg-card">
            {imgFailed ? (
              // Sin imagen (sin red): tarjeta de marca con una altura mínima.
              <div className="flex h-48 items-center justify-center bg-background/40">
                <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <span className="logo-badge flex size-12 items-center justify-center rounded-xl text-white">
                    <Sparkles className="size-6" />
                  </span>
                  <span className="gradient-text text-xl font-bold">ZodHub Pulse</span>
                </div>
              </div>
            ) : (
              // La imagen manda su propia proporción: ancho completo, alto
              // automático. Cuadrada se ve cuadrada; panorámica, panorámica.
              <img
                src={ogImage}
                alt={t("Imagen del enlace")}
                loading="lazy"
                onError={() => setImgFailed(true)}
                className="block h-auto w-full"
              />
            )}
            <div className="border-t border-foreground/[0.07] px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {webHost}
              </p>
              <p className="mt-0.5 text-sm font-semibold leading-tight">ZodHub Pulse</p>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
                {t("Mantenimiento inteligente para Mac, Windows y Linux · gratis")}
              </p>
            </div>
          </div>
        </div>

        <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
          {t(
            "Se comparte en el idioma de la app. Así es más o menos como se verá al publicarlo.",
          )}
        </p>
      </section>

      {/* Derecha: redes para compartir. Altura natural (no se estira a la de la
          vista previa) y STICKY. El sticky va en este div ENVOLVENTE, no en el
          data-slot="card": el skin Hera fija position:relative sobre las cards
          con más especificidad y anularía el sticky si se pusiera en la propia
          card (mismo patrón que AboutCard). */}
      <div className="lg:sticky lg:top-2.5 lg:self-start">
        <section data-slot="card" className="rounded-lg border bg-card p-5">
        <header className="mb-1 flex items-center gap-2">
          <Share2 className="size-4 text-primary" />
          <h3 className="text-sm font-medium">{t("Compartir en")}</h3>
        </header>
        <p className="mb-4 text-xs leading-5 text-muted-foreground">
          {t("Un clic y llega a más gente que cualquier anuncio. Gracias por correr la voz.")}
        </p>
        <div className="flex flex-col gap-1.5">
          {socials.map((s) => (
            <button
              key={s.label}
              onClick={() => openUrl(s.url)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-foreground/[0.07] px-3 py-2.5 text-left text-sm transition-colors hover:bg-white/5"
            >
              <s.icon className={cn("size-4 shrink-0", s.color)} />
              <span className="flex-1">{s.label}</span>
              <ChevronDown className="size-3.5 -rotate-90 text-muted-foreground" />
            </button>
          ))}
        </div>
        </section>
      </div>
    </div>
  );
}

/* ─────────────────────────── Pie · Acerca de y legal ───────────────────── */

function LegalFooter() {
  const { t, lang } = useLang();
  const links = webLinks(lang);
  const rows: Array<{ icon: typeof FileText; label: string; url: string }> = [
    { icon: ShieldCheck, label: t("Política de privacidad"), url: links.privacy },
    { icon: FileText, label: t("Términos de uso"), url: links.terms },
    { icon: Scale, label: t("Licencia y atribuciones"), url: GITHUB.repo },
  ];

  return (
    <section data-slot="card" className="rounded-lg border bg-card p-5">
      <header className="mb-3 flex items-center gap-2">
        <Scale className="size-4 text-primary" />
        <h3 className="text-sm font-medium">{t("Acerca de")}</h3>
      </header>
      <div className="flex flex-wrap gap-2">
        {rows.map((r) => (
          <button
            key={r.label}
            onClick={() => openUrl(r.url)}
            className="flex items-center gap-2 rounded-lg border border-foreground/[0.07] px-3 py-2 text-left text-sm transition-colors hover:bg-white/5"
          >
            <r.icon className="size-4 shrink-0 text-muted-foreground" />
            <span>{r.label}</span>
          </button>
        ))}
      </div>
      <Separator className="my-3" />
      <p className="text-xs leading-5 text-muted-foreground">
        {t(
          "ZodHub Pulse funciona en local: los análisis y las limpiezas se hacen en tu equipo y no se envía información a ningún servidor.",
        )}
      </p>
    </section>
  );
}
