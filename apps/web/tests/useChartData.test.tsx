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

jest.mock("@/util/serverFetch", () => {
  const actual = jest.requireActual("@/util/serverFetch");
  return {
    ...actual,
    getTradeDataForStrategy: jest.fn(),
    getJobDataForSymbol: jest.fn(),
    getCandlestickChartData: jest.fn(),
  };
});

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
      await result.current.runCalculation({ lookback: 14, universe: ["AAPL"] });
    });

    await waitFor(() => {
      expect(result.current.error).toBe("");
      expect(result.current.stage).toBe("success");
      expect(result.current.consoleOutput).toBe(
        "[strategy-runner] Starting StrategyMain",
      );
      expect(result.current.transformedData.symbol).toBe("AAPL");
      expect(result.current.lastRunConfig).toEqual({
        lookback: 14,
        universe: ["AAPL"],
      });
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
      await result.current.runCalculation({ universe: ["AAPL"] });
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
      await result.current.runCalculation({ universe: ["AAPL"] });
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("success");
      expect(result.current.consoleOutput).toContain(
        "Compiling StrategyMain.java",
      );
      expect(result.current.consoleOutput).toContain("Starting StrategyMain");
    });
  });

  test("allows calculation without a current symbol when the universe is provided", async () => {
    (getTradeDataForStrategy as jest.Mock).mockResolvedValue({
      error: null,
      jobId: 13,
    });
    (getJobDataForSymbol as jest.Mock).mockResolvedValue({
      error: null,
      data: {
        status: "completed",
        consoleOutput: "done",
        result: JSON.stringify({
          trades: [{ symbol: "MSFT", time: 1700000000, amount: 1 }],
        }),
      },
    });

    const { result } = renderHook(() =>
      useChartData(
        {
          symbol: "",
          interval: "1d",
          period1: 1700000000,
          period2: 1700003600,
          strategy: "1:My strategy",
        },
        "/"
      )
    );

    await act(async () => {
      await result.current.runCalculation({ universe: ["MSFT"] });
    });

    await waitFor(() => {
      expect(result.current.stage).toBe("success");
      expect(result.current.error).toBe("");
      expect(result.current.transformedData.symbol).toBe("");
      expect(result.current.strategyData).toEqual([]);
    });

    expect(getCandlestickChartData).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  test("switching the selected symbol reloads filtered trades and candles", async () => {
    (getTradeDataForStrategy as jest.Mock).mockResolvedValue({
      error: null,
      jobId: 14,
    });
    (getJobDataForSymbol as jest.Mock).mockResolvedValue({
      error: null,
      data: {
        status: "completed",
        consoleOutput: "done",
        result: JSON.stringify({
          trades: [
            { symbol: "AAPL", time: 1700000000, amount: 1 },
            { symbol: "AAPL", time: 1700003600, amount: -1 },
            { symbol: "MSFT", time: 1700000000, amount: 1 },
          ],
        }),
      },
    });
    (getCandlestickChartData as jest.Mock)
      .mockResolvedValueOnce({
        error: null,
        data: {
          symbol: "AAPL",
          longName: "Apple",
          candles: [
            { time: 1700000000, open: 1, high: 2, low: 1, close: 2, volume: 10 },
          ],
        },
      })
      .mockResolvedValueOnce({
        error: null,
        data: {
          symbol: "MSFT",
          longName: "Microsoft",
          candles: [
            { time: 1700000000, open: 3, high: 4, low: 3, close: 4, volume: 10 },
          ],
        },
      });

    const { result, rerender } = renderHook(
      ({ symbol }) =>
        useChartData(
          {
            symbol,
            interval: "1d",
            period1: 1700000000,
            period2: 1700003600,
            strategy: "1:My strategy",
          },
          "/"
        ),
      {
        initialProps: { symbol: "AAPL" },
      }
    );

    await act(async () => {
      await result.current.runCalculation({ universe: ["AAPL", "MSFT"] });
    });

    await waitFor(() => {
      expect(result.current.transformedData.symbol).toBe("AAPL");
      expect(result.current.strategyData).toEqual([
        { time: 1700000000, amount: 1 },
        { time: 1700003600, amount: -1 },
      ]);
    });

    rerender({ symbol: "MSFT" });

    await waitFor(() => {
      expect(result.current.transformedData.symbol).toBe("MSFT");
      expect(result.current.strategyData).toEqual([
        { time: 1700000000, amount: 1 },
      ]);
    });
  });

  test("reuses cached candles when switching back to a previously loaded symbol", async () => {
    (getTradeDataForStrategy as jest.Mock).mockResolvedValue({
      error: null,
      jobId: 15,
    });
    (getJobDataForSymbol as jest.Mock).mockResolvedValue({
      error: null,
      data: {
        status: "completed",
        consoleOutput: "done",
        result: JSON.stringify({
          trades: [
            { symbol: "AAPL", time: 1700000000, amount: 1 },
            { symbol: "MSFT", time: 1700003600, amount: -1 },
          ],
        }),
      },
    });
    (getCandlestickChartData as jest.Mock)
      .mockResolvedValueOnce({
        error: null,
        data: {
          symbol: "AAPL",
          longName: "Apple",
          candles: [
            { time: 1700000000, open: 1, high: 2, low: 1, close: 2, volume: 10 },
          ],
        },
      })
      .mockResolvedValueOnce({
        error: null,
        data: {
          symbol: "MSFT",
          longName: "Microsoft",
          candles: [
            { time: 1700003600, open: 3, high: 4, low: 3, close: 4, volume: 10 },
          ],
        },
      });

    const { result, rerender } = renderHook(
      ({ symbol }) =>
        useChartData(
          {
            symbol,
            interval: "1d",
            period1: 1700000000,
            period2: 1700007200,
            strategy: "1:My strategy",
          },
          "/"
        ),
      {
        initialProps: { symbol: "AAPL" },
      }
    );

    await act(async () => {
      await result.current.runCalculation({ universe: ["AAPL", "MSFT"] });
    });

    await waitFor(() => {
      expect(result.current.transformedData.symbol).toBe("AAPL");
    });

    rerender({ symbol: "MSFT" });

    await waitFor(() => {
      expect(result.current.transformedData.symbol).toBe("MSFT");
    });

    rerender({ symbol: "AAPL" });

    await waitFor(() => {
      expect(result.current.transformedData.symbol).toBe("AAPL");
    });

    expect(getCandlestickChartData).toHaveBeenCalledTimes(2);
  });
});
