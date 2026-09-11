// Sign-in / account entry point for `backend/geolibre_server_api`'s per-project
// membership system, mounted in the toolbar next to Settings. Self-contained
// like SettingsDialog: owns its own trigger button and the LoginDialog it
// opens, so TopToolbar only needs to render `<AccountMenu chrome={chrome} />`.
//
// This is a different concept from the Auth0/Clerk deployment gate
// (components/auth/{Auth0,Clerk}Gate.tsx, the "auth.*" i18n namespace), which
// can wall off the whole app behind SSO before it is usable at all. That is a
// deployment-wide login some hosts require; this is an optional per-project
// membership sign-in (the "serverAuth.*" namespace) that unlocks the
// membership-aware gallery scope and per-project member management —
// unrelated, and can be signed out independently.

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@geolibre/ui";
import { LogIn, LogOut, UserCircle2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../hooks/useAuthStore";
import { revokeToken } from "../../lib/server-api-auth";
import { LoginDialog } from "../auth/LoginDialog";
import type { ToolbarChrome } from "./toolbar/constants";

export function AccountMenu({ chrome }: { chrome: ToolbarChrome }) {
  const { t } = useTranslation();
  const account = useAuthStore((s) => s.account);
  const token = useAuthStore((s) => s.token);
  const clearSession = useAuthStore((s) => s.clearSession);
  const [loginOpen, setLoginOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (!token || signingOut) return;
    setSigningOut(true);
    try {
      await revokeToken({ token });
    } catch (err) {
      // Best-effort: the token may already be invalid/expired server-side —
      // the local session is cleared below regardless.
      console.error("Failed to revoke session token", err);
    } finally {
      setSigningOut(false);
      clearSession();
    }
  };

  if (!account || !token) {
    return (
      <>
        <Button
          className={chrome.buttonClass}
          variant="ghost"
          size={chrome.buttonSize}
          aria-label={t("serverAuth.signIn")}
          title={t("serverAuth.signIn")}
          onClick={() => setLoginOpen(true)}
        >
          <LogIn className={chrome.iconClassName} />
          {chrome.renderLabel(t("serverAuth.signIn"))}
        </Button>
        <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
      </>
    );
  }

  const fullLabel = account.username
    ? t("serverAuth.signedInAs", { username: account.username })
    : t("serverAuth.signedInAsGuest");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={chrome.buttonClass}
          variant="ghost"
          size={chrome.buttonSize}
          aria-label={fullLabel}
          title={fullLabel}
        >
          <UserCircle2 className={chrome.iconClassName} />
          {chrome.renderLabel(account.username ?? t("serverAuth.signedInAsGuest"))}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="max-w-56 truncate" title={fullLabel}>
          {fullLabel}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void handleSignOut()} disabled={signingOut}>
          <LogOut className="me-2 h-3.5 w-3.5" />
          {t("serverAuth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
