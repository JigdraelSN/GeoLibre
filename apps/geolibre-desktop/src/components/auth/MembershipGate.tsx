// Branded "landing" sign-in gate for `backend/geolibre_server_api`'s
// membership system. Deployments that opt in (see lib/membership-gate.ts)
// show this instead of opening straight into an empty project when nobody's
// signed in yet. A visitor arriving with a shared project link (`?url=`,
// `?project=`, …) is a different case — a member, or the public, depending on
// that project's visibility — who must never be asked to make an account, so
// main.tsx skips wrapping <App/> in this gate whenever
// `projectUrlFromLocation()` finds one.
//
// This is a sibling to Auth0Gate/ClerkGate, not a replacement: those gate an
// entire deployment behind third-party SSO for every request. This gates only
// the bare landing page behind this deployment's own membership system, which
// already backs the toolbar's sign-in (AccountMenu) and the "Assigned to me"
// gallery tab — reusing the same `login`/`redeemToken` calls and session store
// (useAuthStore) rather than standing up a parallel identity system.

import { Button, Input, Label } from "@geolibre/ui";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAuthStore } from "../../hooks/useAuthStore";
import { shareHostLabel } from "../../lib/share-geolibre";
import { login, redeemToken, ServerApiError } from "../../lib/server-api-auth";

type SignInMode = "credentials" | "token";

function authErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ServerApiError) {
    switch (error.code) {
      case "invalid-credentials":
        return t("serverAuth.errorInvalidCredentials");
      case "unauthorized":
        return t("serverAuth.errorUnauthorized");
      case "timeout":
        return t("serverAuth.errorTimeout");
      case "network":
        return t("serverAuth.errorNetwork", { shareHost: shareHostLabel() });
      case "not-configured":
        return t("serverAuth.errorNotConfigured");
      default:
        return t("serverAuth.errorFallback");
    }
  }
  return error instanceof Error ? error.message : t("serverAuth.errorFallback");
}

/**
 * The MTHøjgaard wordmark (`public/branding/mth-logo.png`), on a light plate
 * so the navy mark stays legible regardless of the app's own theme — the gate
 * backdrop behind it is dark in both light and dark mode.
 */
function BrandMark() {
  const { t } = useTranslation();
  return (
    <div className="rounded-md bg-white px-4 py-2.5 shadow-sm">
      <img src="/branding/mth-logo.png" alt={t("serverAuth.logoAlt")} className="h-6 w-auto" />
    </div>
  );
}

/**
 * Decorative full-screen backdrop: a soft glowing globe silhouette over a
 * starfield, matching the look of the app's own empty-project background —
 * built purely from CSS gradients, since no map is mounted before sign-in.
 */
function GateBackdrop() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-background">
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(1px 1px at 20px 30px, hsl(var(--foreground) / 0.6), transparent), " +
            "radial-gradient(1px 1px at 120px 80px, hsl(var(--foreground) / 0.5), transparent), " +
            "radial-gradient(1.5px 1.5px at 60px 140px, hsl(var(--foreground) / 0.4), transparent), " +
            "radial-gradient(1px 1px at 200px 60px, hsl(var(--foreground) / 0.5), transparent), " +
            "radial-gradient(1.5px 1.5px at 240px 180px, hsl(var(--foreground) / 0.35), transparent), " +
            "radial-gradient(1px 1px at 320px 40px, hsl(var(--foreground) / 0.5), transparent)",
          backgroundSize: "360px 220px",
          backgroundRepeat: "repeat",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 30%, hsl(var(--primary) / 0.55), hsl(var(--primary) / 0.15) 55%, transparent 72%)",
          boxShadow: "0 0 140px 40px hsl(var(--primary) / 0.25)",
        }}
      />
    </div>
  );
}

/**
 * The sign-in card: the same two modes (credentials / token) as LoginDialog,
 * rendered inline as a permanent screen rather than a closable Dialog.
 */
function GateCard() {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<SignInMode>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Abort an in-flight request if the gate unmounts mid-submit (i.e. the app
  // is closed/navigated away, not a normal success — success unmounts this
  // component by rendering `children` instead, which does not race this).
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const session =
        mode === "credentials"
          ? await login({ username: username.trim(), password, signal: controller.signal })
          : await redeemToken({ token: token.trim(), signal: controller.signal });
      if (controller.signal.aborted) return;
      // Triggers MembershipGate's own re-render, which swaps this card for
      // `children` — there is no separate "close" step like LoginDialog's.
      setSession(session.account, session.token);
    } catch (err) {
      if (controller.signal.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("Sign-in failed", err);
      setError(authErrorMessage(err, t));
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      if (!controller.signal.aborted) setSubmitting(false);
    }
  };

  const canSubmit =
    mode === "credentials"
      ? username.trim().length > 0 && password.length > 0
      : token.trim().length > 0;

  return (
    <div className="relative z-10 flex w-full max-w-sm flex-col gap-6 rounded-xl border border-border/40 bg-background/90 p-8 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <BrandMark />
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-foreground">{t("serverAuth.gateTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("serverAuth.gateDescription")}</p>
        </div>
      </div>

      <div className="flex w-full gap-1 rounded-md bg-muted p-1">
        <button
          type="button"
          aria-pressed={mode === "credentials"}
          onClick={() => setMode("credentials")}
          className={`flex-1 rounded px-3 py-1 text-sm font-medium transition-colors ${
            mode === "credentials"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("serverAuth.modeCredentials")}
        </button>
        <button
          type="button"
          aria-pressed={mode === "token"}
          onClick={() => setMode("token")}
          className={`flex-1 rounded px-3 py-1 text-sm font-medium transition-colors ${
            mode === "token"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("serverAuth.modeToken")}
        </button>
      </div>

      <form className="flex flex-col gap-3" onSubmit={(event) => void handleSubmit(event)}>
        {mode === "credentials" ? (
          <>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gate-username">{t("serverAuth.usernameLabel")}</Label>
              <Input
                id="gate-username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="gate-password">{t("serverAuth.passwordLabel")}</Label>
              <Input
                id="gate-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="gate-token">{t("serverAuth.tokenLabel")}</Label>
            <Input
              id="gate-token"
              type="password"
              autoFocus
              placeholder={t("serverAuth.tokenPlaceholder")}
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("serverAuth.tokenHint")}</p>
          </div>
        )}

        {error ? (
          <p className="flex items-start gap-1.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </p>
        ) : null}

        <Button type="submit" disabled={!canSubmit || submitting} className="mt-1">
          {submitting ? (
            <>
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
              {t("serverAuth.signingIn")}
            </>
          ) : (
            t("serverAuth.submit")
          )}
        </Button>
      </form>
    </div>
  );
}

/**
 * Full-screen membership sign-in gate for the bare landing page (see
 * lib/membership-gate.ts for when this is enabled and `main.tsx` for the
 * `projectUrlFromLocation()` check that keeps shared project links working
 * without an account).
 *
 * Renders the branded globe backdrop and sign-in card until a session exists
 * in `useAuthStore`, then hands off to `/app/` — MTHøjgaard's own
 * project-browser page (a separate static bundle deployed alongside this
 * app, see the VPS Caddyfile's `handle /app/*` block) — rather than opening
 * GeoLibre's own empty-project canvas. This gate's job is "is someone signed
 * in", not "what they should see once they are"; `/app/` is deliberately not
 * wrapped in its own auth check here, since it was folded into this same
 * gate rather than kept behind its previous separate Basic Auth login.
 *
 * `useAuthStore` hydrates synchronously from localStorage at module load
 * (see hooks/useAuthStore.ts), so a returning signed-in visitor's very first
 * render already knows to redirect — there is no flash of the sign-in card
 * first. `children` (App) still renders as a fallback for the brief instant
 * before the redirect takes effect, rather than leaving the screen blank.
 */
export function MembershipGate({ children }: { children: ReactNode }) {
  const account = useAuthStore((s) => s.account);
  const token = useAuthStore((s) => s.token);
  const authenticated = Boolean(account && token);

  useEffect(() => {
    if (authenticated) {
      window.location.replace("/app/");
    }
  }, [authenticated]);

  if (authenticated) return <>{children}</>;

  return (
    <main className="relative flex min-h-screen items-center justify-center p-6">
      <GateBackdrop />
      <GateCard />
    </main>
  );
}
