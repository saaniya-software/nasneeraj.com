const { describe, it, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { verifyTurnstile } = require("../api/lib/turnstile");

describe("verifyTurnstile", () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.TURNSTILE_SECRET_KEY;
    else process.env.TURNSTILE_SECRET_KEY = originalSecret;
    global.fetch = originalFetch;
  });

  it("skips verification when TURNSTILE_SECRET_KEY is unset", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    const result = await verifyTurnstile("", "127.0.0.1");
    assert.equal(result.ok, true);
    assert.equal(result.skipped, true);
  });

  it("requires token when secret is set", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const result = await verifyTurnstile("", "127.0.0.1");
    assert.equal(result.ok, false);
    assert.match(result.error, /Captcha required/i);
  });

  it("returns ok when Cloudflare siteverify succeeds", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    global.fetch = async () => ({
      json: async () => ({ success: true }),
    });
    const result = await verifyTurnstile("good-token", "127.0.0.1");
    assert.equal(result.ok, true);
  });

  it("returns failure when Cloudflare siteverify rejects", async () => {
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    global.fetch = async () => ({
      json: async () => ({ success: false }),
    });
    const result = await verifyTurnstile("bad-token", "127.0.0.1");
    assert.equal(result.ok, false);
  });
});