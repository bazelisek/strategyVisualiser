import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ChartSection from "@/components/ChartSection";
import React from "react";

jest.mock("@mui/joy", () => {
  const React = require("react");
  return {
    Autocomplete: ({ value, placeholder }: { value?: string | null; placeholder?: string }) => (
      <input value={value ?? ""} placeholder={placeholder} readOnly />
    ),
    Button: ({
      children,
      onClick,
      disabled,
      loading,
    }: {
      children: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      loading?: boolean;
    }) => (
      <button onClick={onClick} disabled={disabled || loading}>
        {children}
      </button>
    ),
    FormControl: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    FormHelperText: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    FormLabel: ({ children }: { children: React.ReactNode }) => <label>{children}</label>,
    Input: ({
      value,
      onChange,
      placeholder,
      type,
    }: {
      value?: string;
      onChange?: React.ChangeEventHandler<HTMLInputElement>;
      placeholder?: string;
      type?: string;
    }) => (
      <input value={value ?? ""} onChange={onChange} placeholder={placeholder} type={type} />
    ),
    Option: ({ children, value }: { children: React.ReactNode; value: string }) => (
      <option value={value}>{children}</option>
    ),
    Select: ({
      children,
      value,
      placeholder,
      onChange,
    }: {
      children: React.ReactNode;
      value?: string | null;
      placeholder?: string;
      onChange?: (_event: unknown, value: string | null) => void;
    }) => (
      <select
        aria-label={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange?.(event, event.target.value || null)}
      >
        <option value="">{placeholder ?? ""}</option>
        {children}
      </select>
    ),
    Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    Typography: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

jest.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: () => <div>Date picker</div>,
}));

const mockRunCalculation = jest.fn(async () => undefined);
const mockUseChartDataState = {
  strategyData: [] as { time: number; amount: number }[],
  loading: false,
  transformedData: { longName: "", symbol: "AAPL", candles: [] as unknown[] },
  error: "",
  runCalculation: mockRunCalculation,
  stage: "configuring" as "configuring" | "submitting" | "running" | "success" | "failed",
  statusMessage: "",
  consoleOutput: "",
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

jest.mock("@/util/strategies/strategies", () => ({
  getAvailableStrategies: jest.fn(async () => [
    {
      id: 12,
      name: "Momentum",
      requirements: "{}",
    },
  ]),
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

jest.mock("@/components/StrategyConsoleCollapsible", () => {
  return function MockConsole({
    consoleOutput,
  }: {
    consoleOutput: string;
  }) {
    return <div>{consoleOutput}</div>;
  };
});

describe("ChartSection", () => {
  const renderChartSection = () => render(<ChartSection index={0} />);

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChartDataState.error = "";
    mockUseChartDataState.loading = false;
    mockUseChartDataState.stage = "configuring";
    mockUseChartDataState.strategyData = [];
    mockUseChartDataState.transformedData = { longName: "", symbol: "AAPL", candles: [] };
    mockUseChartDataState.statusMessage = "";
    mockUseChartDataState.consoleOutput = "";
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
    renderChartSection();

    await waitFor(() => {
      expect(screen.getByText("Configure tile")).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByRole("button", { name: "Job configuration" })[0]);
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
    renderChartSection();

    await waitFor(() => {
      expect(screen.getByTestId("chart-wrapper")).toBeInTheDocument();
    });
  });

  test("shows chart, analysis, and console after a successful calculation", async () => {
    const view = renderChartSection();

    fireEvent.click(screen.getAllByRole("button", { name: "Job configuration" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Configure strategy run")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Calculate strategy" }));
    await waitFor(() => {
      expect(mockRunCalculation).toHaveBeenCalledTimes(1);
    });

    mockUseChartDataState.stage = "success";
    mockUseChartDataState.strategyData = [{ time: 1700000000, amount: 5 }];
    mockUseChartDataState.consoleOutput = "Run completed";
    view.rerender(<ChartSection index={0} />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-wrapper")).toBeInTheDocument();
      expect(screen.getByTestId("performance-overview")).toBeInTheDocument();
      expect(screen.getByText("Run completed")).toBeInTheDocument();
    });
  });

  test("shows strategy run log while calculation is running", async () => {
    mockUseChartDataState.stage = "running";
    mockUseChartDataState.loading = true;
    mockUseChartDataState.consoleOutput =
      "[strategy-runner] Compiling StrategyMain.java\nTick 1";

    renderChartSection();

    fireEvent.click(screen.getAllByRole("button", { name: "Job configuration" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Configure strategy run")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Strategy run log")).toBeInTheDocument();
      expect(screen.getByText(/\[strategy-runner\] Compiling StrategyMain\.java/)).toBeInTheDocument();
      expect(screen.getByText(/Tick 1/)).toBeInTheDocument();
    });
  });

  test("shows log panel while job is submitting", async () => {
    mockUseChartDataState.stage = "submitting";
    mockUseChartDataState.loading = true;
    mockUseChartDataState.consoleOutput = "";

    renderChartSection();

    fireEvent.click(screen.getAllByRole("button", { name: "Job configuration" })[0]);
    await waitFor(() => {
      expect(screen.getByText("Configure strategy run")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText("Submitting job...")).toBeInTheDocument();
    });
  });
});
