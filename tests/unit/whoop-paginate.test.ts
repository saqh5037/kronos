import { describe, it, expect } from "vitest";
import { paginateAll, type WhoopPage } from "@/lib/wearables/whoop-client";

function makeFetcher<T>(pages: T[][]) {
  const tokens = pages.map((_, i) =>
    i < pages.length - 1 ? `tok-${i + 1}` : null,
  );
  return async ({
    nextToken,
  }: {
    nextToken?: string;
  }): Promise<WhoopPage<T>> => {
    const idx = nextToken ? Number(nextToken.replace("tok-", "")) - 1 + 1 : 0;
    return { records: pages[idx] ?? [], next_token: tokens[idx] ?? null };
  };
}

describe("paginateAll", () => {
  it("accumulates records across all pages and stops on null next_token", async () => {
    const fetcher = makeFetcher<number>([[1, 2, 3], [4, 5], [6]]);
    const out = await paginateAll(fetcher, {
      start: new Date(0),
      end: new Date(),
    });
    expect(out).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("returns first page when next_token is null", async () => {
    const fetcher = makeFetcher<number>([[42]]);
    const out = await paginateAll(fetcher, {});
    expect(out).toEqual([42]);
  });

  it("returns empty array for empty first page with null next_token", async () => {
    const fetcher = makeFetcher<number>([[]]);
    const out = await paginateAll(fetcher, {});
    expect(out).toEqual([]);
  });

  it("respects maxPages safety cap", async () => {
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return { records: [calls], next_token: "always-more" };
    };
    const out = await paginateAll(fetcher, {}, { maxPages: 3 });
    expect(calls).toBe(3);
    expect(out).toEqual([1, 2, 3]);
  });

  it("threads nextToken through the fetcher", async () => {
    const tokens: Array<string | undefined> = [];
    const fetcher = async ({ nextToken }: { nextToken?: string }) => {
      tokens.push(nextToken);
      if (!nextToken) return { records: ["a"], next_token: "n1" };
      if (nextToken === "n1") return { records: ["b"], next_token: "n2" };
      return { records: ["c"], next_token: null };
    };
    const out = await paginateAll(fetcher, {});
    expect(out).toEqual(["a", "b", "c"]);
    expect(tokens).toEqual([undefined, "n1", "n2"]);
  });
});
