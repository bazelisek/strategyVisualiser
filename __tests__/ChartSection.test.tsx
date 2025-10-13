import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import ChartSection from "@/components/ChartSection";
import { useChartData } from "@/hooks/useChartData";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { indicatorSlice } from "@/store/slices/indicatorSlice";
import { configSlice } from "@/store/slices/configSlice";
import { modalSlice } from "@/store/slices/modalSlice";

jest.mock("lightweight-charts", () => ({
  createChart: jest.fn(() => ({
    addCandlestickSeries: jest.fn(() => ({
      setData: jest.fn(),
      applyOptions: jest.fn(),
    })),
    remove: jest.fn(),
    resize: jest.fn(),
  })),
}));

// Mock the useChartData hook
jest.mock("@/hooks/useChartData");

// Mock Next.js router
jest.mock("next/navigation", () => {
  const actual = jest.requireActual("next/navigation");
  const searchParams = new URLSearchParams();
  searchParams.append("symbol", "AAPL");
  searchParams.append("interval", "1d");
  searchParams.append("period1", "1672531200");
  searchParams.append("period2", "1675209600");
  searchParams.append("strategy", "Dummy");
  return {
    ...actual,
    useSearchParams: () => searchParams,
    useRouter: () => ({
      push: jest.fn(),
      replace: jest.fn(),
    }),
  };
});

const mockUseChartData = useChartData as jest.Mock;

const indicatorsInitialState = {
  movingAverage: { visible: false, value: { maLength: 20, color: "#2962FF" } },
  supertrend: {
    visible: false,
    value: { period: 10, multiplier: 3, color: "#adff29" },
  },
  exponentialMovingAverage: {
    visible: true,
    value: { emaLength: 20, color: "#29f8ff" },
  },
  commodityChannelIndex: {
    visible: false,
    value: { cciLength: 20, color: "#f829ff" },
  },
  onBalanceVolume: { visible: false, value: { color: "#2962FF" } },
};

const configInitialState = {
  symbol: { defaultValue: "" },
  strategy: { defaultValue: "" },
  period1: { defaultValue: "" },
  period2: { defaultValue: "" },
  interval: { defaultValue: "" },
};

const modalsInitialState = {
  indicators: false,
  symbol: false,
  strategy: false,
};

const mockStore = configureStore({
  reducer: {
    indicators: indicatorSlice.reducer,
    config: configSlice.reducer,
    modals: modalSlice.reducer,
  },
  preloadedState: {
    indicators: [indicatorsInitialState, indicatorsInitialState],
    config: configInitialState,
    modals: [
      modalsInitialState,
      modalsInitialState,
      modalsInitialState,
      modalsInitialState,
    ],
  },
});

describe("ChartSection", () => {
  it("renders a chart after loading", async () => {
    // Setup the mock to return a loading state initially, then the data
    mockUseChartData.mockReturnValue({
      loading: false,
      error: null,
      transformedData: {
        longName: "Apple Inc.",
        symbol: "AAPL",
        candles: [
          {
            time: 1672531200,
            open: 1,
            high: 2,
            low: 0.5,
            close: 1.5,
            volume: 1000,
          },
        ],
      },
      strategyData: [],
    });

    render(
      <Provider store={mockStore}>
        <ChartSection index={0} />
      </Provider>
    );

    // Wait for the chart with id="chart" to appear in the document
    await waitFor(() => {
      expect(screen.getByTestId("chart-wrapper")).toBeInTheDocument();
    });
  });
});