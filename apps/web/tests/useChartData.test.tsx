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
      data: {
        status: "completed",
        consoleOutput: "[strategy-runner] Starting StrategyMain",
        result: JSON.stringify({ trades: [] }),
      },
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

    await waitFor(() => {
      expect(result.current.error).toBe("");
      expect(result.current.stage).toBe("success");
      expect(result.current.consoleOutput).toBe(
        "[strategy-runner] Starting StrategyMain",
      );
      expect(result.current.transformedData.symbol).toBe("AAPL");
    });
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

  test("runCalculation streams console output while polling", async () => {
    (getTradeDataForStrategy as jest.Mock).mockResolvedValue({
      error: null,
      jobId: 12,
    });
    (getJobDataForSymbol as jest.Mock)
      .mockResolvedValueOnce({
        error: null,
        data: {
          status: "running",
          consoleOutput: "[strategy-runner] Compiling StrategyMain.java",
        },
      })
      .mockResolvedValueOnce({
        error: null,
        data: {
          status: "completed",
          consoleOutput:
            "[strategy-runner] Compiling StrategyMain.java\n[strategy-runner] Starting StrategyMain",
          result: JSON.stringify({ trades: [] }),
        },
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
      await result.current.runCalculation({});
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("success");
      expect(result.current.consoleOutput).toContain(
        "Compiling StrategyMain.java",
      );
      expect(result.current.consoleOutput).toContain("Starting StrategyMain");
    });
  });
});
