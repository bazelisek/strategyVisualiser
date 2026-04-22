import { checkFormValidity } from "@/util/formCheck";

describe("checkFormValidity", () => {
  test("accepts long-range intervals when tile timestamps are stored as unix seconds", () => {
    const result = checkFormValidity({
      symbol: { value: "AAPL" },
      interval: { value: "1wk" },
      period1: { value: 1704067200 },
      period2: { value: 1735689600 },
      strategy: { value: "12" },
    });

    expect(result).toBe("");
  });

  test("rejects intervals outside the allowed range", () => {
    const result = checkFormValidity({
      symbol: { value: "AAPL" },
      interval: { value: "1wk" },
      period1: { value: 1704067200 },
      period2: { value: 1704240000 },
      strategy: { value: "12" },
    });

    expect(result).toContain('The interval "1wk" is not allowed.');
  });
});
