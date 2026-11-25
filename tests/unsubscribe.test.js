const { describe, it, beforeEach, afterEach, mock } = require("node:test");
const assert = require("node:assert/strict");
const { verifyUnsubscribeToken, signUnsubscribeToken } = require("../api/lib/unsubscribe-token");

describe("unsubscribe token", () => {
  const original = process.env.UNSUBSCRIBE_SIGNING_SECRET;

  afterEach(() => {
    if (original === undefined) delete process.env.UNSUBSCRIBE_SIGNING_SECRET;
    else process.env.UNSUBSCRIBE_SIGNING_SECRET = original;
  });

  it("signs and verifies email token", () => {
    process.env.UNSUBSCRIBE_SIGNING_SECRET = "unit-test-secret";
    const email = "user@example.com";
    const token = signUnsubscribeToken(email, []);
    assert.ok(token);
    const check = verifyUnsubscribeToken(email, [], token);
    assert.equal(check.ok, true);
  });

  it("rejects tampered email", () => {
    process.env.UNSUBSCRIBE_SIGNING_SECRET = "unit-test-secret";
    const token = signUnsubscribeToken("user@example.com", []);
    const check = verifyUnsubscribeToken("other@example.com", [], token);
    assert.equal(check.ok, false);
  });
});

describe("POST /api/unsubscribe handler", () => {
  const handler = require("../api/unsubscribe");
  let env = {};

  beforeEach(() => {
    env = {
      TURNSTILE_SECRET_KEY: "",
      RESEND_API_KEY: "re_test",
      RESEND_AUDIENCE_ZEN: "aud_zen",
      RESEND_AUDIENCE_BOOK_COPLANNER: "aud_book",
    };
    for (const [k, v] of Object.entries(env)) process.env[k] = v;
    delete process.env.UNSUBSCRIBE_SIGNING_SECRET;
  });

  afterEach(() => {
    for (const k of Object.keys(env)) delete process.env[k];
    mock.restoreAll();
  });

  function mockRes() {
    const state = { status: 200, body: null, headers: {} };
    return {
      state,
      setHeader(k, v) {
        this.state.headers[k] = v;
      },
      status(code) {
        this.state.status = code;
        return this;
      },
      json(body) {
        this.state.body = body;
      },
    };
  }

  it("rejects invalid email", async () => {
    const res = mockRes();
    await handler({ method: "POST", headers: {}, body: { email: "not-an-email" }, query: {} }, res);
    assert.equal(res.state.status, 400);
  });

  it("unsubscribes when Turnstile skipped and Resend PATCH succeeds", async () => {
    const fetchMock = mock.method(global, "fetch", async (url, options) => {
      assert.match(String(url), /resend\.com/);
      assert.equal(options.method, "PATCH");
      return {
        ok: true,
        status: 200,
        text: async () => '{"id":"1"}',
      };
    });

    const res = mockRes();
    await handler(
      {
        method: "POST",
        headers: { "x-forwarded-for": "198.51.100.10" },
        body: { email: "pat@example.com" },
        query: {},
        socket: {},
      },
      res
    );

    assert.equal(res.state.status, 200);
    assert.equal(res.state.body.ok, true);
    assert.ok(fetchMock.mock.callCount() >= 1);
  });

  it("accepts RFC 8058 one-click POST with signed token", async () => {
    process.env.UNSUBSCRIBE_SIGNING_SECRET = "one-click-secret";
    const email = "oneclick@example.com";
    const token = signUnsubscribeToken(email, []);

    mock.method(global, "fetch", async () => ({
      ok: true,
      status: 200,
      text: async () => "{}",
    }));

    const res = mockRes();
    await handler(
      {
        method: "POST",
        headers: { "list-unsubscribe-post": "List-Unsubscribe=One-Click" },
        body: "List-Unsubscribe=One-Click",
        query: { email, token },
        socket: {},
      },
      res
    );

    assert.equal(res.state.status, 200);
    assert.equal(res.state.body.ok, true);
  });
});