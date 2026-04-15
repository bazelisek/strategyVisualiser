import { renderHook, act, waitFor } from "@testing-library/react";
import { useChartData } from "@/hooks/useChartData";

const pushMock = jest.fn();
const routerMock = { push: pushMock };
jest.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

jest.mock("@/util/formCheck", () => ({
  checkFormValidity: jest.fn(() => ""),
}));

jest.mock("@/util/serverFetch", () => ({
  getTradeDataForStrategy: jest.fn(),
  getJobDataForSymbol: jest.fn(),
  getCandlestickChartData: jest.fn(),
  extractTradeMarkersFromJobResult: jest.fn(() => [{ time: 1700000000, amount: 1 }]),
}));

import {
  getTradeDataForStrategy,
  getJobDataForSymbol,
  getCandlestickChartData,
} from "@/util/serverFetch";

describe("useChartData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
  });

  test("runCalculation succeeds and sets success stage", async () => {
    (getTradeDataForStrategy as jest.Mock).mockResolvedValue({
      error: null,
      jobId: 11,
    });
    (getJobDataForSymbol as jest.Mock).mockResolvedValue({
      error: null,
      data: { status: "completed", result: JSON.stringify({ trades: [] }) },
    });
    (getCandlestickChartData as jest.Mock).mockResolvedValue({
      error: null,
      data: {
        symbol: "AAPL",
        longName: "Apple",
        candles: [{ time: 1700000000, open: 1, high: 2, low: 1, close: 2, volume: 10 }],
      },
    });

    const { result } = renderHook(() =>
      useChartData(
        {
          symbol: "AAPL",
          interval: "1d",
          period1: 1700000000,
          period2: 1700003600,
          strategy: "1:My strategy",
        },
        "/"
      )
    );

    await act(async () => {
      await result.current.runCalculation({ lookback: 14 });
    });

    expect(result.current.error).toBe("");
    expect(result.current.stage).toBe("success");
    expect(result.current.transformedData.symbol).toBe("AAPL");
  });

  test("runCalculation handles analyze error", async () => {
    (getTradeDataForStrategy as jest.Mock).mockResolvedValue({
      error: "Invalid strategy.",
      jobId: null,
    });

    const { result } = renderHook(() =>
      useChartData(
        {
          symbol: "AAPL",
          interval: "1d",
          period1: 1700000000,
          period2: 1700003600,
          strategy: "bad",
        },
        "/"
      )
    );

    await act(async () => {
      await result.current.runCalculation({});
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("failed");
      expect(result.current.error).toContain("Invalid strategy");
    });
  });
});
