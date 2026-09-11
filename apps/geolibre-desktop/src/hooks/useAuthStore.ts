// Session state for `backend/geolibre_server_api`'s membership system: the
// signed-in account and its bearer token, persisted to localStorage the same
// way `useDesktopSettingsStore` persists everything else (see
// useDesktopSettings.ts). This is a *different* auth path from that store's
// `shareToken` (a personal API token pasted in Settings, used only for the
// existing "My projects" gallery tab and Share upload) — this one backs real
// sign-in (username/password, or redeeming a guest-link token) and the
// membership-filtered gallery.

import { create } from "zustand";
import type { ServerAccount } from "../lib/server-api-auth";
import { SERVER_AUTH_STORAGE_KEY } from "../lib/storage-keys";

export interface AuthState {
  account: ServerAccount | null;
  token: string | null;
  setSession: (account: ServerAccount, token: string) => void;
  clearSession: () => void;
}

interface PersistedSession {
  account: ServerAccount;
  token: string;
}

function loadSession(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem(SERVER_AUTH_STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as Partial<PersistedSession> | null;
    if (
      !parsed ||
      typeof parsed.token !== "string" ||
      !parsed.token ||
      !parsed.account ||
      typeof parsed.account.id !== "string" ||
      !parsed.account.id
    ) {
      return null;
    }
    return {
      token: parsed.token,
      account: {
        id: parsed.account.id,
        username: typeof parsed.account.username === "string" ? parsed.account.username : null,
        createdAt: typeof parsed.account.createdAt === "string" ? parsed.account.createdAt : "",
      },
    };
  } catch {
    return null;
  }
}

function saveSession(session: PersistedSession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) {
      window.localStorage.setItem(SERVER_AUTH_STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(SERVER_AUTH_STORAGE_KEY);
    }
  } catch {
    // Persistence is best-effort; ignore quota or disabled-storage errors.
  }
}

const initial = loadSession();

/**
 * The signed-in `geolibre_server_api` session, if any. `account`/`token` are
 * both null or both set — never partially populated — so callers can gate on
 * either one interchangeably.
 */
export const useAuthStore = create<AuthState>((set) => ({
  account: initial?.account ?? null,
  token: initial?.token ?? null,
  setSession: (account, token) => {
    saveSession({ account, token });
    set({ account, token });
  },
  clearSession: () => {
    saveSession(null);
    set({ account: null, token: null });
  },
}));
