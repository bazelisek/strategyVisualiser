import { getTradeMarkers } from "@/util/markers";

describe("getTradeMarkers", () => {
  test("formats fractional trade sizes without trailing zeros", () => {
    const markers = getTradeMarkers([
      { time: 1000, amount: 0.125 },
      { time: 2000, amount: -1.5 },
    ]);

    expect(markers[0]?.text).toBe("Buy 0.125");
    expect(markers[1]?.text).toBe("Sell 1.5");
  });
});
