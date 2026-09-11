// Sign-in dialog for `backend/geolibre_server_api`'s membership system. Two
// modes, since a guest account (minted by a project owner's guest link) has
// no username or password at all — redeeming its token directly is the only
// way that recipient can ever sign in:
//   - "Username & password" -> POST /api/auth/token
//   - "I have a token"      -> validated via GET /api/account
// On success the resulting {account, token} is written to useAuthStore, which
// persists it (see hooks/useAuthStore.ts) so the session survives a reload.

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@geolibre/ui";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useAuthStore } from "../../hooks/useAuthStore";
import { shareHostLabel } from "../../lib/share-geolibre";
import { login, redeemToken, ServerApiError } from "../../lib/server-api-auth";

type SignInMode = "credentials" | "token";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const { t } = useTranslation();
  const setSession = useAuthStore((s) => s.setSession);
  const [mode, setMode] = useState<SignInMode>("credentials");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset transient state each time the dialog opens, and abort an in-flight
  // request if it's closed mid-submit.
  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword("");
      setToken("");
      setError(null);
      setSubmitting(false);
    } else {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [open]);

  const handleSubmit = async (event: React.FormEvent) => {
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
      setSession(session.account, session.token);
      onOpenChange(false);
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
    mode === "credentials" ? username.trim().length > 0 && password.length > 0 : token.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("serverAuth.dialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("serverAuth.dialogDescription", { shareHost: shareHostLabel() })}
          </DialogDescription>
        </DialogHeader>

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
                <Label htmlFor="auth-username">{t("serverAuth.usernameLabel")}</Label>
                <Input
                  id="auth-username"
                  autoComplete="username"
                  autoFocus
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="auth-password">{t("serverAuth.passwordLabel")}</Label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="auth-token">{t("serverAuth.tokenLabel")}</Label>
              <Input
                id="auth-token"
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
      </DialogContent>
    </Dialog>
  );
}
