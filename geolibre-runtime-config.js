// MTH: hand-maintained on the deploy branch (see README-DEPLOY.txt) --
// this file is NOT overwritten by the ordinary dist mirror, the same way
// _mth-app-index.html isn't. It plays the role Docker's entrypoint.sh plays
// for a container deployment (see deployment-env.ts): a small operator-edited
// file, loaded before the app bundle, that sets runtime config without a
// rebuild.
//
// Two things enabled here:
//   - VITE_GEOLIBRE_MEMBERSHIP_GATE: turns on the branded sign-in gate for
//     the bare https://gis.mth.site landing page (see lib/membership-gate.ts
//     and components/auth/MembershipGate.tsx). A visitor arriving with a
//     project link (?url=, ?project=, ...) is never gated -- only the bare
//     root is. On success (or an already-valid session) it hands off to
//     /app/, MTHoejgaard's own portal wrapper.
//   - VITE_GEOLIBRE_SHARE_URL: without this, the sign-in/membership calls
//     (lib/server-api-auth.ts) fall back to the public share.geolibre.app
//     host instead of this deployment's own backend/geolibre_server_api
//     (confirmed live at https://gis.mth.site/api/... this session). Pointed
//     at this same origin since Caddy proxies /api/* to that service here.
window.__GEOLIBRE_DEPLOYMENT_ENV__ = {
  VITE_GEOLIBRE_MEMBERSHIP_GATE: "1",
  VITE_GEOLIBRE_SHARE_URL: "https://gis.mth.site"
};
