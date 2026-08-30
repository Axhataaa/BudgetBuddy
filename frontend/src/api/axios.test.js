import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import MockAdapter from "axios-mock-adapter";
import axios from "axios";
import api from "./axios";

describe("api axios instance error handling", () => {
  let mock;
  let realMock;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(api);
    // The refresh call goes through a bare `axios.post(...)`, not the `api`
    // instance, so it needs its own adapter.
    realMock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
    realMock.restore();
    vi.restoreAllMocks();
  });

  it("attaches the Authorization header from localStorage on every request", async () => {
    localStorage.setItem("access", "my-access-token");
    mock.onGet("expenses/").reply((config) => {
      expect(config.headers.Authorization).toBe("Bearer my-access-token");
      return [200, { results: [] }];
    });

    await api.get("expenses/");
  });

  it("does not attach an Authorization header when there is no access token", async () => {
    mock.onGet("expenses/").reply((config) => {
      expect(config.headers.Authorization).toBeUndefined();
      return [200, { results: [] }];
    });

    await api.get("expenses/");
  });

  it("transparently refreshes an expired token and retries the original request once", async () => {
    localStorage.setItem("access", "expired-token");
    localStorage.setItem("refresh", "valid-refresh-token");

    let callCount = 0;
    mock.onGet("expenses/").reply((config) => {
      callCount += 1;
      if (config.headers.Authorization === "Bearer expired-token") {
        return [401, { detail: "Token expired" }];
      }
      return [200, { results: [{ id: 1 }] }];
    });
    realMock.onPost(/users\/refresh\//).reply(200, { access: "new-access-token" });

    const response = await api.get("expenses/");

    expect(response.status).toBe(200);
    expect(callCount).toBe(2);
    expect(localStorage.getItem("access")).toBe("new-access-token");
  });

  it("clears tokens and dispatches a forced-logout event when the refresh token itself is invalid", async () => {
    localStorage.setItem("access", "expired-token");
    localStorage.setItem("refresh", "invalid-refresh-token");

    const logoutHandler = vi.fn();
    window.addEventListener("auth:logout", logoutHandler);

    mock.onGet("expenses/").reply(401, { detail: "Token expired" });
    realMock.onPost(/users\/refresh\//).reply(401, { detail: "Refresh token invalid" });

    await expect(api.get("expenses/")).rejects.toBeTruthy();

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(logoutHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:logout", logoutHandler);
  });

  // Regression test for the stale-session Dashboard toast bug: when the
  // refresh token is invalid, the rejected error must be tagged so callers
  // can tell this apart from a genuine data-fetch failure (see Dashboard.jsx).
  it("tags the rejected error as isSessionExpired when the refresh token is invalid", async () => {
    localStorage.setItem("access", "expired-token");
    localStorage.setItem("refresh", "invalid-refresh-token");

    mock.onGet("expenses/").reply(401, { detail: "Token expired" });
    realMock.onPost(/users\/refresh\//).reply(401, { detail: "Refresh token invalid" });

    await expect(api.get("expenses/")).rejects.toMatchObject({
      isSessionExpired: true,
    });
  });

  it("does not attempt a refresh loop when there is no refresh token at all", async () => {
    localStorage.setItem("access", "expired-token");
    // No refresh token stored.

    mock.onGet("expenses/").reply(401, { detail: "Token expired" });

    await expect(api.get("expenses/")).rejects.toBeTruthy();
    // No refresh call should have been attempted.
    expect(realMock.history.post.length).toBe(0);
  });

  // Regression test: an absent refresh token is just as much an invalid
  // session as a failed refresh call, so it must be cleaned up the same
  // way — clearing the stale access token and dispatching "auth:logout" —
  // rather than leaving a stale access token in localStorage while
  // AuthContext still believes the user is authenticated.
  it("clears the stale access token and dispatches a forced-logout event when there is no refresh token at all", async () => {
    localStorage.setItem("access", "expired-token");
    // No refresh token stored.

    const logoutHandler = vi.fn();
    window.addEventListener("auth:logout", logoutHandler);

    mock.onGet("expenses/").reply(401, { detail: "Token expired" });

    await expect(api.get("expenses/")).rejects.toBeTruthy();

    expect(localStorage.getItem("access")).toBeNull();
    expect(localStorage.getItem("refresh")).toBeNull();
    expect(logoutHandler).toHaveBeenCalledTimes(1);

    window.removeEventListener("auth:logout", logoutHandler);
  });

  // Regression test: a 401 with no refresh token available at all is just as
  // much an invalid session as a failed refresh, so it should be tagged the
  // same way.
  it("tags the rejected error as isSessionExpired when there is no refresh token at all", async () => {
    localStorage.setItem("access", "expired-token");

    mock.onGet("expenses/").reply(401, { detail: "Token expired" });

    await expect(api.get("expenses/")).rejects.toMatchObject({
      isSessionExpired: true,
    });
  });

  it("passes through non-401 errors (e.g. 500) without attempting a refresh", async () => {
    localStorage.setItem("access", "some-token");
    mock.onGet("expenses/").reply(500, { detail: "Server error" });

    await expect(api.get("expenses/")).rejects.toMatchObject({
      response: { status: 500 },
    });
    expect(realMock.history.post.length).toBe(0);
  });
});
