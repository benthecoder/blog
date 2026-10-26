import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => mocks.sql }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { ADMIN_COOKIE, sessionToken } from "@/utils/adminAuth";
import { POST } from "@/app/api/tweet/route";

const post = (body: string, headers: Record<string, string> = {}) =>
  POST(
    new Request("http://localhost/api/tweet", { method: "POST", body, headers })
  );

afterEach(() => vi.unstubAllEnvs());

beforeEach(() => {
  mocks.sql.mockReset().mockResolvedValue([{ id: 1 }]);
});

describe("tweet capture", () => {
  it.each(["{", "null", "{}", '{"body":42}', '{"body":"   "}'])(
    "rejects empty or malformed input without inserting: %s",
    async (body) => {
      expect((await post(body)).status).toBe(400);
      expect(mocks.sql).not.toHaveBeenCalled();
    }
  );
  it("inserts valid content", async () => {
    expect((await post('{"body":"hello"}')).status).toBe(200);
    expect(mocks.sql).toHaveBeenCalledTimes(1);
  });
});

describe("tweet auth in production", () => {
  const ok = '{"body":"hello"}';
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ADMIN_SECRET", "admin-secret");
    vi.stubEnv("TWEET_TOKEN", "tweet-token");
  });

  it("rejects unauthenticated posts without inserting", async () => {
    const res = await post(ok);
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(mocks.sql).not.toHaveBeenCalled();
  });
  it("rejects a wrong bearer", async () => {
    expect((await post(ok, { authorization: "Bearer nope" })).status).toBe(401);
    expect(mocks.sql).not.toHaveBeenCalled();
  });
  it("accepts the correct bearer", async () => {
    expect(
      (await post(ok, { authorization: "Bearer tweet-token" })).status
    ).toBe(200);
    expect(mocks.sql).toHaveBeenCalledTimes(1);
  });
  it("accepts the scheme in any case", async () => {
    expect(
      (await post(ok, { authorization: "bearer  tweet-token" })).status
    ).toBe(200);
  });
  it.each(["Bearer ", "Bearer", "Bearer undefined", "Bearer tweet-token"])(
    "fails closed when TWEET_TOKEN is unset: %s",
    async (authorization) => {
      vi.stubEnv("TWEET_TOKEN", "");
      expect((await post(ok, { authorization })).status).toBe(401);
      vi.unstubAllEnvs();
      vi.stubEnv("NODE_ENV", "production");
      vi.stubEnv("ADMIN_SECRET", "admin-secret");
      delete process.env.TWEET_TOKEN;
      expect((await post(ok, { authorization })).status).toBe(401);
      expect(mocks.sql).not.toHaveBeenCalled();
    }
  );
  it("accepts a valid admin cookie", async () => {
    const cookie = `a=b; ${ADMIN_COOKIE}=${sessionToken("admin-secret")}`;
    expect((await post(ok, { cookie })).status).toBe(200);
  });
  it("rejects a forged admin cookie", async () => {
    expect((await post(ok, { cookie: `${ADMIN_COOKIE}=x` })).status).toBe(401);
  });
  it("accepts x-admin-token", async () => {
    expect((await post(ok, { "x-admin-token": "admin-secret" })).status).toBe(
      200
    );
  });
});
