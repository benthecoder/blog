import { beforeEach, afterEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sql: vi.fn(), revalidatePath: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => mocks.sql }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));
import { POST, DELETE } from "@/app/api/tweet/route";

beforeEach(() => {
  mocks.sql.mockReset().mockResolvedValue([{ id: 1 }]);
  mocks.revalidatePath.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
const request = (body: object) =>
  new Request("http://localhost/api/tweet", {
    method: "POST",
    body: JSON.stringify(body),
  });

it("saves a link-only thought and invalidates the public feed after the insert", async () => {
  mocks.sql.mockImplementation(async () => {
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    return [{ id: 1 }];
  });
  const response = await POST(request({ body: "https://example.com/note" }));
  expect(response.status).toBe(200);
  expect(mocks.sql.mock.calls[0].slice(1)).toEqual([
    "",
    "https://example.com/note",
    null,
  ]);
  expect(mocks.revalidatePath).toHaveBeenCalledExactlyOnceWith("/thoughts");
});

it("does not invalidate the feed when saving fails", async () => {
  mocks.sql.mockRejectedValue(new Error("Database unavailable"));
  expect((await POST(request({ body: "note" }))).status).toBe(500);
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
});

it("invalidates the feed after a successful local deletion", async () => {
  vi.stubEnv("NODE_ENV", "development");
  expect((await DELETE(request({ id: 1 }))).status).toBe(204);
  expect(mocks.revalidatePath).toHaveBeenCalledExactlyOnceWith("/thoughts");
});

it("keeps production deletion forbidden without writing or invalidating", async () => {
  vi.stubEnv("NODE_ENV", "production");
  expect((await DELETE(request({ id: 1 }))).status).toBe(403);
  expect(mocks.sql).not.toHaveBeenCalled();
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
});
