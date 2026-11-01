import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const mocks = vi.hoisted(() => ({ sql: vi.fn() }));
vi.mock("@neondatabase/serverless", () => ({ neon: () => mocks.sql }));
import { GET } from "@/app/api/thoughts/route";
beforeEach(() => mocks.sql.mockReset().mockResolvedValue([]));
it("parameterizes stream search and keeps cursor pagination", async () => {
  const response = await GET(
    new NextRequest(
      "https://example.com/api/thoughts?cursor=42&q=tea%25&limit=100"
    )
  );
  expect(response.status).toBe(200);
  expect(mocks.sql.mock.calls[0].slice(1)).toEqual([42, "tea%", 100]);
});
it("rejects oversized queries and invalid cursors before querying", async () => {
  for (const query of [`q=${"a".repeat(201)}`, "cursor=-1", "cursor=1.5"]) {
    expect(
      (await GET(new NextRequest(`https://example.com/api/thoughts?${query}`)))
        .status
    ).toBe(400);
  }
  expect(mocks.sql).not.toHaveBeenCalled();
});
