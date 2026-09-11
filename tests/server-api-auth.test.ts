import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addProjectMember,
  createGuestLink,
  fetchAssignedProjects,
  fetchProjectMembers,
  login,
  redeemToken,
  removeProjectMember,
  revokeToken,
  ServerApiError,
} from "../apps/geolibre-desktop/src/lib/server-api-auth";

const BASE = "https://share.geolibre.app";

function fakeFetch(status: number, body: unknown): { fn: typeof fetch; calls: string[] } {
  const calls: string[] = [];
  const fn = (async (url: string) => {
    calls.push(url);
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response;
  }) as unknown as typeof fetch;
  return { fn, calls };
}

// A routing fake: maps a URL path to a {status, body} response and records the
// Authorization header and method each call carried, mirroring the pattern in
// share-gallery.test.ts's routedFetch.
function routedFetch(routes: Record<string, { status: number; body: unknown }>): {
  fn: typeof fetch;
  requests: { path: string; method: string; auth: string | null; body: unknown }[];
} {
  const requests: { path: string; method: string; auth: string | null; body: unknown }[] = [];
  const fn = (async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname;
    const headers = new Headers(init.headers);
    requests.push({
      path,
      method: init.method ?? "GET",
      auth: headers.get("Authorization"),
      body: typeof init.body === "string" ? JSON.parse(init.body) : null,
    });
    const route = routes[path] ?? { status: 404, body: null };
    if (route.status === 204) {
      return { ok: true, status: 204, json: async () => null } as unknown as Response;
    }
    return {
      ok: route.status >= 200 && route.status < 300,
      status: route.status,
      json: async () => route.body,
    } as Response;
  }) as unknown as typeof fetch;
  return { fn, requests };
}

function rawAccount(overrides: Record<string, unknown> = {}) {
  return {
    id: "acct-1",
    username: "jiggy",
    createdAt: "2026-06-23T15:48:15.000Z",
    ...overrides,
  };
}

describe("login", () => {
  it("signs in and normalizes the account", async () => {
    const { fn, requests } = routedFetch({
      "/api/auth/token": { status: 200, body: { account: rawAccount(), token: "sess_tok" } },
    });
    const session = await login({
      username: "jiggy",
      password: "hunter2",
      baseUrl: BASE,
      fetchImpl: fn,
    });
    assert.equal(session.token, "sess_tok");
    assert.equal(session.account.username, "jiggy");
    assert.deepEqual(requests[0].body, { username: "jiggy", password: "hunter2" });
  });

  it("throws 'invalid-credentials' on a 401, without distinguishing username from password", async () => {
    const { fn } = routedFetch({
      "/api/auth/token": { status: 401, body: { error: "Unauthorized" } },
    });
    await assert.rejects(
      () => login({ username: "jiggy", password: "wrong", baseUrl: BASE, fetchImpl: fn }),
      (err: unknown) => err instanceof ServerApiError && err.code === "invalid-credentials",
    );
  });

  it("throws 'invalid-response' when the payload is missing account or token", async () => {
    const { fn } = routedFetch({
      "/api/auth/token": { status: 200, body: { account: rawAccount() } },
    });
    await assert.rejects(
      () => login({ username: "jiggy", password: "x", baseUrl: BASE, fetchImpl: fn }),
      (err: unknown) => err instanceof ServerApiError && err.code === "invalid-response",
    );
  });
});

describe("redeemToken", () => {
  it("validates a bearer token via GET /api/account", async () => {
    const { fn, requests } = routedFetch({
      "/api/account": { status: 200, body: { account: rawAccount({ username: null }) } },
    });
    const session = await redeemToken({ token: "guest_tok", baseUrl: BASE, fetchImpl: fn });
    assert.equal(session.token, "guest_tok");
    assert.equal(session.account.username, null);
    assert.equal(requests[0].auth, "Bearer guest_tok");
  });

  it("throws 'unauthorized' when the token is invalid", async () => {
    const { fn } = routedFetch({
      "/api/account": { status: 401, body: null },
    });
    await assert.rejects(
      () => redeemToken({ token: "bad", baseUrl: BASE, fetchImpl: fn }),
      (err: unknown) => err instanceof ServerApiError && err.code === "unauthorized",
    );
  });
});

describe("revokeToken", () => {
  it("sends DELETE with the bearer token", async () => {
    const { fn, requests } = routedFetch({
      "/api/auth/token": { status: 204, body: null },
    });
    await revokeToken({ token: "sess_tok", baseUrl: BASE, fetchImpl: fn });
    assert.equal(requests[0].method, "DELETE");
    assert.equal(requests[0].auth, "Bearer sess_tok");
  });
});

function rawAssignedProject(overrides: Record<string, unknown> = {}) {
  return {
    id: "abc-123",
    username: "giswqs",
    slug: "my-map",
    title: "My Map",
    description: "",
    visibility: "private",
    thumbnailUrl: "/api/thumbnails/abc-123?v=1",
    views: 7,
    forkCount: 0,
    versionCount: 1,
    featured: false,
    createdAt: "2026-06-23T15:48:15.000Z",
    updatedAt: "2026-06-23T15:48:15.000Z",
    tags: [],
    rawJsonUrl: `${BASE}/giswqs/my-map.geolibre.json`,
    projectUrl: `${BASE}/giswqs/my-map`,
    viewerUrl: `https://web.geolibre.app/?url=${BASE}/giswqs/my-map.geolibre.json`,
    role: "owner",
    ...overrides,
  };
}

describe("fetchAssignedProjects", () => {
  it("normalizes projects and preserves the caller's role", async () => {
    const { fn } = fakeFetch(200, {
      projects: [
        rawAssignedProject({ id: "p1", role: "owner" }),
        rawAssignedProject({ id: "p2", role: "member" }),
        rawAssignedProject({ id: "p3", role: "guest" }),
      ],
      total: 3,
      limit: 24,
      offset: 0,
    });
    const result = await fetchAssignedProjects({ token: "tok", baseUrl: BASE, fetchImpl: fn });
    assert.deepEqual(
      result.projects.map((p) => [p.id, p.role]),
      [
        ["p1", "owner"],
        ["p2", "member"],
        ["p3", "guest"],
      ],
    );
    assert.equal(result.total, 3);
  });

  it("defaults an unrecognized role to 'member'", async () => {
    const { fn } = fakeFetch(200, { projects: [rawAssignedProject({ role: "nonsense" })] });
    const result = await fetchAssignedProjects({ token: "tok", baseUrl: BASE, fetchImpl: fn });
    assert.equal(result.projects[0].role, "member");
  });

  it("drops records missing an id or rawJsonUrl", async () => {
    const { fn } = fakeFetch(200, {
      projects: [rawAssignedProject(), rawAssignedProject({ id: "" }), rawAssignedProject({ rawJsonUrl: "" })],
    });
    const result = await fetchAssignedProjects({ token: "tok", baseUrl: BASE, fetchImpl: fn });
    assert.equal(result.projects.length, 1);
  });

  it("sends the bearer token and limit/offset as query params", async () => {
    const { fn, calls } = fakeFetch(200, { projects: [] });
    await fetchAssignedProjects({ token: "tok", baseUrl: BASE, limit: 24, offset: 48, fetchImpl: fn });
    assert.match(calls[0], /\/api\/me\/projects\?/);
    assert.match(calls[0], /limit=24/);
    assert.match(calls[0], /offset=48/);
  });

  it("throws a coded ServerApiError on a non-2xx response", async () => {
    const { fn } = fakeFetch(403, null);
    await assert.rejects(
      () => fetchAssignedProjects({ token: "tok", baseUrl: BASE, fetchImpl: fn }),
      (err: unknown) => err instanceof ServerApiError && err.code === "forbidden",
    );
  });
});

function rawMember(overrides: Record<string, unknown> = {}) {
  return {
    id: "mem-1",
    accountId: "acct-2",
    username: "surveyor",
    role: "member",
    expiresAt: null,
    createdAt: "2026-06-23T15:48:15.000Z",
    ...overrides,
  };
}

describe("fetchProjectMembers", () => {
  it("lists members with the bearer token", async () => {
    const { fn, requests } = routedFetch({
      "/api/projects/proj-1/members": { status: 200, body: { members: [rawMember()] } },
    });
    const members = await fetchProjectMembers({ projectId: "proj-1", token: "tok", baseUrl: BASE, fetchImpl: fn });
    assert.equal(members.length, 1);
    assert.equal(members[0].username, "surveyor");
    assert.equal(requests[0].auth, "Bearer tok");
  });

  it("normalizes a guest member with no username", async () => {
    const { fn } = routedFetch({
      "/api/projects/proj-1/members": {
        status: 200,
        body: { members: [rawMember({ username: null, role: "guest" })] },
      },
    });
    const members = await fetchProjectMembers({ projectId: "proj-1", token: "tok", baseUrl: BASE, fetchImpl: fn });
    assert.equal(members[0].username, null);
    assert.equal(members[0].role, "guest");
  });
});

describe("addProjectMember", () => {
  it("posts the username and role, and returns the created member", async () => {
    const { fn, requests } = routedFetch({
      "/api/projects/proj-1/members": {
        status: 200,
        body: { member: rawMember({ username: "newperson", role: "member" }) },
      },
    });
    const member = await addProjectMember({
      projectId: "proj-1",
      token: "tok",
      username: "newperson",
      role: "member",
      baseUrl: BASE,
      fetchImpl: fn,
    });
    assert.equal(member.username, "newperson");
    assert.equal(requests[0].method, "POST");
    assert.deepEqual(requests[0].body, { username: "newperson", role: "member" });
  });

  it("throws 'not-found' when the username doesn't exist", async () => {
    const { fn } = routedFetch({
      "/api/projects/proj-1/members": { status: 404, body: null },
    });
    await assert.rejects(
      () =>
        addProjectMember({
          projectId: "proj-1",
          token: "tok",
          username: "ghost",
          role: "member",
          baseUrl: BASE,
          fetchImpl: fn,
        }),
      (err: unknown) => err instanceof ServerApiError && err.code === "not-found",
    );
  });

  it("throws 'conflict' when the username is the project's own owner", async () => {
    const { fn } = routedFetch({
      "/api/projects/proj-1/members": { status: 409, body: null },
    });
    await assert.rejects(
      () =>
        addProjectMember({
          projectId: "proj-1",
          token: "tok",
          username: "owner-self",
          role: "member",
          baseUrl: BASE,
          fetchImpl: fn,
        }),
      (err: unknown) => err instanceof ServerApiError && err.code === "conflict",
    );
  });
});

describe("removeProjectMember", () => {
  it("sends DELETE to the member's account-scoped path", async () => {
    const { fn, requests } = routedFetch({
      "/api/projects/proj-1/members/acct-2": { status: 204, body: null },
    });
    await removeProjectMember({ projectId: "proj-1", accountId: "acct-2", token: "tok", baseUrl: BASE, fetchImpl: fn });
    assert.equal(requests[0].method, "DELETE");
    assert.equal(requests[0].path, "/api/projects/proj-1/members/acct-2");
  });
});

describe("createGuestLink", () => {
  it("mints a guest account and returns its one-time token", async () => {
    const { fn, requests } = routedFetch({
      "/api/projects/proj-1/guest-links": {
        status: 200,
        body: {
          guestAccountId: "acct-guest-1",
          label: "Surveyor visit",
          token: "guest_tok_once",
          expiresAt: "2026-07-01T00:00:00.000Z",
        },
      },
    });
    const link = await createGuestLink({
      projectId: "proj-1",
      token: "tok",
      label: "Surveyor visit",
      expiresInHours: 24,
      baseUrl: BASE,
      fetchImpl: fn,
    });
    assert.equal(link.guestAccountId, "acct-guest-1");
    assert.equal(link.token, "guest_tok_once");
    assert.deepEqual(requests[0].body, { label: "Surveyor visit", expiresInHours: 24 });
  });

  it("sends a null label when none was given", async () => {
    const { fn, requests } = routedFetch({
      "/api/projects/proj-1/guest-links": {
        status: 200,
        body: {
          guestAccountId: "acct-guest-2",
          label: null,
          token: "tok2",
          expiresAt: "2026-07-01T00:00:00.000Z",
        },
      },
    });
    await createGuestLink({
      projectId: "proj-1",
      token: "tok",
      expiresInHours: 1,
      baseUrl: BASE,
      fetchImpl: fn,
    });
    assert.deepEqual(requests[0].body, { label: null, expiresInHours: 1 });
  });

  it("throws 'invalid-response' when the payload is incomplete", async () => {
    const { fn } = routedFetch({
      "/api/projects/proj-1/guest-links": { status: 200, body: { label: null } },
    });
    await assert.rejects(
      () =>
        createGuestLink({
          projectId: "proj-1",
          token: "tok",
          expiresInHours: 1,
          baseUrl: BASE,
          fetchImpl: fn,
        }),
      (err: unknown) => err instanceof ServerApiError && err.code === "invalid-response",
    );
  });
});
