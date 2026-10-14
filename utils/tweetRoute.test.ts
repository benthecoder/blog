import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => mocks.sql }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { POST } from "@/app/api/tweet/route";

const post = (body: string) =>
  POST(new Request("http://localhost/api/tweet", { method: "POST", body }));

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
