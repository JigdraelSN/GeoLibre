// Client for the account/membership endpoints of `backend/geolibre_server_api`
// (see docs/server-api.md): username/password login, redeeming a bearer token
// directly (the only way a guest-link recipient can sign in — a guest account
// has no username/password), the membership-aware project listing
// (`GET /api/me/projects`), and per-project member/guest-link management.
//
// This is a sibling to `share-gallery.ts`/`share-geolibre.ts`, not a
// replacement: those cover the existing personal-API-token "My projects" tab
// and project upload. This module covers the newer per-project membership
// system (`docs/server-api.md`'s "Project membership" section) — real sign-in,
// and seeing exactly the projects one has been assigned to (owned, or granted
// as a member/guest), not just one's own uploads.

import { getShareFetch } from "./share-fetch";
import { resolveShareBaseUrl } from "./share-geolibre";
import { resolveThumbnailUrl, type SharedProject } from "./share-gallery";

/**
 * Machine-readable cause for a request failure. This module is a non-React
 * library and cannot call `t()` (see CLAUDE.md's i18n rule); callers map each
 * code to a translated message.
 */
export type ServerApiErrorCode =
  | "timeout"
  | "network"
  | "invalid-response"
  | "not-configured"
  | "invalid-credentials"
  | "unauthorized"
  | "forbidden"
  | "not-found"
  | "conflict"
  | "http";

/** Error thrown by every function in this module, carrying a translatable {@link ServerApiErrorCode}. */
export class ServerApiError extends Error {
  readonly code: ServerApiErrorCode;
  /** HTTP status, when `code` is `"http"`. */
  readonly status?: number;

  constructor(code: ServerApiErrorCode, status?: number) {
    super(code);
    // Preserve the prototype chain so `instanceof ServerApiError` holds even
    // when transpiled to a target where `extends Error` would otherwise lose
    // it (mirrors GalleryError in share-gallery.ts).
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = "ServerApiError";
    this.code = code;
    this.status = status;
  }
}

/**
 * The share host for a request, with a trailing slash stripped.
 *
 * @throws {ServerApiError} `not-configured` when the deployment disabled
 *   sharing or named a host that was rejected.
 */
function requireBase(override?: string): string {
  const base = override ?? resolveShareBaseUrl();
  if (!base) throw new ServerApiError("not-configured");
  return base.replace(/\/+$/, "");
}

// Bound every request so a hung server can't leave a dialog spinning forever.
const REQUEST_TIMEOUT_MS = 20_000;

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE";
  token?: string;
  body?: unknown;
  baseUrl?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

/**
 * Issue one JSON request against the server API and return the parsed body
 * (or `null` for a 204). Centralizes timeout/abort handling, auth headers, and
 * status-code-to-{@link ServerApiErrorCode} mapping so every exported function
 * below shares the same failure shape.
 */
async function request(base: string, path: string, options: RequestOptions = {}): Promise<unknown> {
  const fetchImpl = options.fetchImpl ?? getShareFetch();
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.body !== undefined) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetchImpl(`${base}${path}`, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === "AbortError") throw error;
      if (error.name === "TimeoutError") throw new ServerApiError("timeout");
    }
    throw new ServerApiError("network");
  }

  if (response.status === 204) return null;

  if (!response.ok) {
    if (response.status === 401) {
      throw new ServerApiError(
        path === "/api/auth/token" ? "invalid-credentials" : "unauthorized",
      );
    }
    if (response.status === 403) throw new ServerApiError("forbidden");
    if (response.status === 404) throw new ServerApiError("not-found");
    if (response.status === 409) throw new ServerApiError("conflict");
    throw new ServerApiError("http", response.status);
  }

  try {
    return (await response.json()) as unknown;
  } catch {
    throw new ServerApiError("invalid-response");
  }
}

export interface ServerAccount {
  id: string;
  /** Null for a guest account — guests never have a username or password. */
  username: string | null;
  createdAt: string;
}

interface RawAccount {
  id?: unknown;
  username?: unknown;
  createdAt?: unknown;
}

function normalizeAccount(raw: RawAccount): ServerAccount {
  return {
    id: typeof raw.id === "string" ? raw.id : "",
    username: typeof raw.username === "string" ? raw.username : null,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : "",
  };
}

export interface LoginOptions {
  username: string;
  password: string;
  baseUrl?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export interface AuthSession {
  account: ServerAccount;
  token: string;
}

/**
 * Sign in with a username and password (`POST /api/auth/token`).
 *
 * @throws {ServerApiError} `invalid-credentials` on a wrong username/password
 *   (the server itself does not distinguish the two, to avoid enumerating
 *   accounts — see `main.py`'s `login` handler).
 */
export async function login(options: LoginOptions): Promise<AuthSession> {
  const base = requireBase(options.baseUrl);
  const payload = (await request(base, "/api/auth/token", {
    method: "POST",
    body: { username: options.username, password: options.password },
    baseUrl: options.baseUrl,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  })) as { account?: RawAccount; token?: string } | null;
  if (!payload?.token || !payload.account) throw new ServerApiError("invalid-response");
  return { account: normalizeAccount(payload.account), token: payload.token };
}

export interface RedeemTokenOptions {
  /** A bearer token issued directly — e.g. handed out via a guest link, which
   * has no username/password to log in with. */
  token: string;
  baseUrl?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

/**
 * Validate a bearer token by fetching the account it belongs to
 * (`GET /api/account`), for the "I have a token" sign-in path (guest links,
 * or a personal API token from Settings). A guest account has no
 * username/password, so this is the *only* way a guest-link recipient can
 * sign in.
 *
 * @throws {ServerApiError} `unauthorized` when the token is invalid.
 */
export async function redeemToken(options: RedeemTokenOptions): Promise<AuthSession> {
  const base = requireBase(options.baseUrl);
  const payload = (await request(base, "/api/account", {
    token: options.token,
    baseUrl: options.baseUrl,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  })) as { account?: RawAccount } | null;
  if (!payload?.account) throw new ServerApiError("invalid-response");
  return { account: normalizeAccount(payload.account), token: options.token };
}

/** Revoke the current session's token (`DELETE /api/auth/token`), so it can no longer authenticate. */
export async function revokeToken(options: RedeemTokenOptions): Promise<void> {
  const base = requireBase(options.baseUrl);
  await request(base, "/api/auth/token", {
    method: "DELETE",
    token: options.token,
    baseUrl: options.baseUrl,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  });
}

export type MembershipRole = "owner" | "member" | "guest";

/** A project as returned by `GET /api/me/projects`: the shared listing shape plus the caller's role on it. */
export interface AssignedProject extends SharedProject {
  role: MembershipRole;
}

interface RawAssignedProject {
  id?: unknown;
  username?: unknown;
  slug?: unknown;
  title?: unknown;
  description?: unknown;
  visibility?: unknown;
  thumbnailUrl?: unknown;
  views?: unknown;
  forkCount?: unknown;
  versionCount?: unknown;
  featured?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
  tags?: unknown;
  rawJsonUrl?: unknown;
  projectUrl?: unknown;
  viewerUrl?: unknown;
  role?: unknown;
}

const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : fallback;
const asNumber = (value: unknown): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;
const asRole = (value: unknown): MembershipRole =>
  value === "owner" || value === "member" || value === "guest" ? value : "member";

function normalizeAssignedProject(raw: RawAssignedProject, base: string): AssignedProject | null {
  const id = asString(raw.id);
  const rawJsonUrl = asString(raw.rawJsonUrl);
  if (!id || !rawJsonUrl) return null;
  return {
    id,
    username: asString(raw.username),
    slug: asString(raw.slug),
    title: asString(raw.title),
    description: asString(raw.description),
    visibility: asString(raw.visibility),
    thumbnailUrl: resolveThumbnailUrl(raw.thumbnailUrl, base),
    views: asNumber(raw.views),
    forkCount: asNumber(raw.forkCount),
    versionCount: asNumber(raw.versionCount),
    featured: raw.featured === true,
    createdAt: asString(raw.createdAt),
    updatedAt: asString(raw.updatedAt),
    tags: Array.isArray(raw.tags) ? raw.tags.filter((t): t is string => typeof t === "string") : [],
    rawJsonUrl,
    projectUrl: asString(raw.projectUrl),
    viewerUrl: asString(raw.viewerUrl),
    role: asRole(raw.role),
  };
}

export interface FetchAssignedProjectsOptions {
  /** Session or personal API token; either kind of bearer token works. */
  token: string;
  limit?: number;
  offset?: number;
  baseUrl?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

export interface FetchAssignedProjectsResult {
  projects: AssignedProject[];
  total: number;
  limit: number;
  offset: number;
}

/**
 * List every project the signed-in account can open right now: owned, plus
 * every non-expired membership (`GET /api/me/projects`) — the listing a
 * signed-in gallery should call so a member or guest sees exactly what
 * they've been assigned, and nothing else. Unlike `fetchMyProjects` in
 * `share-gallery.ts` (which lists only the token owner's *own* uploads via
 * `/api/users/{username}/projects`), this reflects real per-project
 * membership and is paginated.
 */
export async function fetchAssignedProjects(
  options: FetchAssignedProjectsOptions,
): Promise<FetchAssignedProjectsResult> {
  const base = requireBase(options.baseUrl);
  const params = new URLSearchParams();
  if (options.limit != null) params.set("limit", String(options.limit));
  if (options.offset) params.set("offset", String(options.offset));
  const query = params.toString();
  const payload = (await request(base, `/api/me/projects${query ? `?${query}` : ""}`, {
    token: options.token,
    baseUrl: options.baseUrl,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  })) as { projects?: RawAssignedProject[]; total?: unknown; limit?: unknown; offset?: unknown } | null;

  const rawProjects = Array.isArray(payload?.projects) ? payload.projects : [];
  const projects = rawProjects
    .map((raw) => normalizeAssignedProject(raw, base))
    .filter((p): p is AssignedProject => p !== null);

  return {
    projects,
    total: asNumber(payload?.total),
    limit: asNumber(payload?.limit) || options.limit || projects.length,
    offset: asNumber(payload?.offset),
  };
}

export interface ProjectMember {
  id: string;
  accountId: string;
  /** Null for a guest — guest accounts have no username. */
  username: string | null;
  role: "member" | "guest";
  /** ISO 8601, or null for a standing (non-expiring) member grant. */
  expiresAt: string | null;
  createdAt: string;
}

interface RawMember {
  id?: unknown;
  accountId?: unknown;
  username?: unknown;
  role?: unknown;
  expiresAt?: unknown;
  createdAt?: unknown;
}

function normalizeMember(raw: RawMember): ProjectMember | null {
  const id = asString(raw.id);
  const accountId = asString(raw.accountId);
  if (!id || !accountId) return null;
  return {
    id,
    accountId,
    username: typeof raw.username === "string" ? raw.username : null,
    role: raw.role === "guest" ? "guest" : "member",
    expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : null,
    createdAt: asString(raw.createdAt),
  };
}

interface ProjectScopedOptions {
  projectId: string;
  token: string;
  baseUrl?: string;
  signal?: AbortSignal;
  fetchImpl?: typeof fetch;
}

/** List a project's members (`GET /api/projects/{id}/members`). Owner-only. */
export async function fetchProjectMembers(options: ProjectScopedOptions): Promise<ProjectMember[]> {
  const base = requireBase(options.baseUrl);
  const payload = (await request(base, `/api/projects/${encodeURIComponent(options.projectId)}/members`, {
    token: options.token,
    baseUrl: options.baseUrl,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  })) as { members?: RawMember[] } | null;
  const rawMembers = Array.isArray(payload?.members) ? payload.members : [];
  return rawMembers.map(normalizeMember).filter((m): m is ProjectMember => m !== null);
}

export interface AddMemberOptions extends ProjectScopedOptions {
  username: string;
  role: "member" | "guest";
}

/**
 * Grant `username` standing (non-expiring) access to a project
 * (`POST /api/projects/{id}/members`). Owner-only.
 *
 * @throws {ServerApiError} `not-found` when no account has that username,
 *   `conflict` when it names the project's own owner.
 */
export async function addProjectMember(options: AddMemberOptions): Promise<ProjectMember> {
  const base = requireBase(options.baseUrl);
  const payload = (await request(base, `/api/projects/${encodeURIComponent(options.projectId)}/members`, {
    method: "POST",
    token: options.token,
    body: { username: options.username, role: options.role },
    baseUrl: options.baseUrl,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  })) as { member?: RawMember } | null;
  const member = payload?.member ? normalizeMember(payload.member) : null;
  if (!member) throw new ServerApiError("invalid-response");
  return member;
}

/** Revoke `accountId`'s access to a project immediately (`DELETE /api/projects/{id}/members/{accountId}`). Owner-only. */
export async function removeProjectMember(
  options: ProjectScopedOptions & { accountId: string },
): Promise<void> {
  const base = requireBase(options.baseUrl);
  await request(
    base,
    `/api/projects/${encodeURIComponent(options.projectId)}/members/${encodeURIComponent(options.accountId)}`,
    {
      method: "DELETE",
      token: options.token,
      baseUrl: options.baseUrl,
      signal: options.signal,
      fetchImpl: options.fetchImpl,
    },
  );
}

export interface CreateGuestLinkOptions extends ProjectScopedOptions {
  label?: string;
  /** 1 to 2160 (90 days) — capped server-side so a guest link cannot stand in for a real account indefinitely. */
  expiresInHours: number;
}

export interface GuestLink {
  guestAccountId: string;
  label: string | null;
  /** Bearer token for the new guest account — hand this to the guest; it is
   * shown only once and cannot be recovered afterward. */
  token: string;
  expiresAt: string;
}

/**
 * Mint a standalone, username-less guest account plus a bearer token good
 * only for this project and only until it expires
 * (`POST /api/projects/{id}/guest-links`). The guest signs in by redeeming
 * the token directly ({@link redeemToken}) — there is no signup step and no
 * username/password for a guest account. Owner-only.
 */
export async function createGuestLink(options: CreateGuestLinkOptions): Promise<GuestLink> {
  const base = requireBase(options.baseUrl);
  const payload = (await request(base, `/api/projects/${encodeURIComponent(options.projectId)}/guest-links`, {
    method: "POST",
    token: options.token,
    body: { label: options.label ?? null, expiresInHours: options.expiresInHours },
    baseUrl: options.baseUrl,
    signal: options.signal,
    fetchImpl: options.fetchImpl,
  })) as { guestAccountId?: unknown; label?: unknown; token?: unknown; expiresAt?: unknown } | null;
  if (!payload?.guestAccountId || !payload.token || !payload.expiresAt) {
    throw new ServerApiError("invalid-response");
  }
  return {
    guestAccountId: asString(payload.guestAccountId),
    label: typeof payload.label === "string" ? payload.label : null,
    token: asString(payload.token),
    expiresAt: asString(payload.expiresAt),
  };
}
