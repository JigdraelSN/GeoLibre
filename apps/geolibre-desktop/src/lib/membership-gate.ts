// Whether this deployment gates its bare landing page behind
// `backend/geolibre_server_api`'s membership sign-in (see
// components/auth/MembershipGate.tsx), rather than opening straight into an
// empty project. Same shape as clerk-auth.ts's waitlist flag: an opt-in
// deployment env read through the same build/runtime precedence as every
// other GEOLIBRE_* setting (see deployment-env.ts).

import { readDeploymentEnvValue, type EnvRecord } from "./deployment-env";

export const MEMBERSHIP_GATE_ENV = "VITE_GEOLIBRE_MEMBERSHIP_GATE";

// Same "1"/"true" opt-in convention as the other deployment env flags (see
// clerk-auth.ts's CLERK_WAITLIST_ENV).
const GATE_ENABLED_VALUES = new Set(["1", "true"]);

/**
 * Whether the membership gate is configured for this deployment.
 *
 * This is a *different* concept from {@link resolveAuthGate}'s Auth0/Clerk
 * providers: those gate every request to the deployment behind third-party
 * SSO. This gates only the bare landing page — a visitor arriving with a
 * shared project link (`?url=`, `?project=`, …) must never be asked to sign
 * in, since that link may have gone to a client with no account at all. This
 * function only reports whether the gate is *configured*; the caller in
 * main.tsx is responsible for also checking `projectUrlFromLocation()` before
 * actually wrapping `<App/>` in it.
 *
 * `webApp` carries the same meaning as in the other gate resolvers — a
 * build-time fact, never a runtime signal the visitor controls (such as
 * `?embed=1`), so native, Tauri, and embedded builds can never render this
 * gate no matter how this env var is set.
 *
 * @param webApp - Whether this is the hosted web build.
 * @param deploymentEnv - Runtime env; defaults to the value on `window`.
 * @param buildEnv - Build-time env; defaults to the allowlisted build env.
 */
export function resolveMembershipGateEnabled(
  webApp: boolean,
  deploymentEnv?: EnvRecord,
  buildEnv?: EnvRecord,
): boolean {
  if (!webApp) return false;
  const value = readDeploymentEnvValue(MEMBERSHIP_GATE_ENV, deploymentEnv, buildEnv);
  return GATE_ENABLED_VALUES.has(value?.trim().toLowerCase() ?? "");
}
