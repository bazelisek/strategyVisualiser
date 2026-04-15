import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChartSection from "@/components/ChartSection";

const mockRunCalculation = jest.fn(async () => undefined);
const mockUseChartDataState = {
  strategyData: [] as { time: number; amount: number }[],
  loading: false,
  transformedData: { longName: "", symbol: "AAPL", candles: [] as unknown[] },
  error: "",
  runCalculation: mockRunCalculation,
  stage: "configuring" as "configuring" | "submitting" | "running" | "success" | "failed",
  statusMessage: "",
};

jest.mock("@/hooks/useTiles", () => ({
  useTiles: () => ({
    tiles: [
      {
        symbol: "AAPL",
        interval: "1d",
        period1: "1700000000",
        period2: "1700003600",
        strategy: "12:Momentum",
      },
    ],
  }),
}));

jest.mock("@/hooks/useChartData", () => ({
  useChartData: () => mockUseChartDataState,
}));

jest.mock("@/util/markers", () => ({
  getTradeMarkers: () => [],
}));

jest.mock("@/components/Chart/CandlestickChartWrapper", () => {
  return function MockChart() {
    return <div data-testid="chart-wrapper">chart</div>;
  };
});

jest.mock("@/components/StrategyPerformanceOverview", () => {
  return function MockPerformance() {
    return <div data-testid="performance-overview">performance</div>;
  };
});

describe("ChartSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartDataState.error = "";
    mockUseChartDataState.loading = false;
    mockUseChartDataState.stage = "configuring";
    mockUseChartDataState.strategyData = [];
    mockUseChartDataState.transformedData = { longName: "", symbol: "AAPL", candles: [] };
    mockUseChartDataState.statusMessage = "";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        configuration: JSON.stringify([
          {
            id: "lookback",
            label: "Lookback",
            type: "number",
            defaultValue: 14,
            required: true,
          },
          {
            id: "entryMode",
            label: "Entry mode",
            type: "select",
            options: ["market", "limit"],
            defaultValue: "market",
          },
        ]),
      }),
    }) as unknown as typeof fetch;
  });

  test("renders config form and calls runCalculation", async () => {
    render(<ChartSection index={0} />);

    await waitFor(() => {
      expect(screen.getByText("Configure strategy run")).toBeInTheDocument();
    });

    const button = screen.getByRole("button", { name: "Calculate strategy" });
    await waitFor(() => expect(button).toBeEnabled());

    fireEvent.click(button);
    await waitFor(() => {
      expect(mockRunCalculation).toHaveBeenCalledTimes(1);
      expect(mockRunCalculation).toHaveBeenCalledWith(
        expect.objectContaining({
          lookback: 14,
          entryMode: "market",
        })
      );
    });
  });

  test("shows chart after successful run state", async () => {
    mockUseChartDataState.stage = "success";
    mockUseChartDataState.strategyData = [{ time: 1700000000, amount: 5 }];
    render(<ChartSection index={0} />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-wrapper")).toBeInTheDocument();
    });
  });
});
