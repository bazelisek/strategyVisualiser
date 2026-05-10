import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import StrategyPerformanceOverview from "@/components/performance/StrategyPerformanceOverview";
import type { UTCTimestamp } from "lightweight-charts";

const at = (value: number) => value as UTCTimestamp;

jest.mock("@mui/joy", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
  Card: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Chip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Divider: () => <hr />,
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Stack: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("@/hooks/useStrategyName", () => ({
  useStrategyName: () => "Momentum",
}));

jest.mock("@/components/Input/Buttons/DropdownButton", () => {
  return function MockDropdownButton({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) {
    return <button onClick={onClick}>{children}</button>;
  };
});

jest.mock("@/components/performance/TradeDetails", () => {
  return function MockTradeDetails() {
    return <div>Trade details</div>;
  };
});

jest.mock("@/components/Chart/EquityChart", () => {
  return function MockEquityChart() {
    return <div>Equity chart</div>;
  };
});

describe("StrategyPerformanceOverview", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
  });

  test("opens on global performance and can toggle to current-stock contribution", async () => {
    const loadCandlesForSymbols = jest.fn().mockResolvedValue({
      AAPL: {
        symbol: "AAPL",
        longName: "Apple",
        candles: [
          { time: at(1000), open: 10, high: 10, low: 10, close: 10, volume: 1 },
          { time: at(2000), open: 12, high: 12, low: 12, close: 12, volume: 1 },
        ],
      },
      MSFT: {
        symbol: "MSFT",
        longName: "Microsoft",
        candles: [
          { time: at(1000), open: 20, high: 20, low: 20, close: 20, volume: 1 },
          { time: at(2000), open: 21, high: 21, low: 21, close: 21, volume: 1 },
        ],
      },
    });

    render(
      <StrategyPerformanceOverview
        transformedData={{
          symbol: "AAPL",
          longName: "Apple",
          candles: [
            { time: at(1000), open: 10, high: 10, low: 10, close: 10, volume: 1 },
            { time: at(2000), open: 12, high: 12, low: 12, close: 12, volume: 1 },
          ],
        }}
        strategy="12:Momentum"
        jobResult={{
          trades: [
            { symbol: "AAPL", time: 1000, amount: 1 },
            { symbol: "AAPL", time: 2000, amount: -1 },
            { symbol: "MSFT", time: 1000, amount: 1 },
            { symbol: "MSFT", time: 2000, amount: -1 },
          ],
        }}
        selectedSymbol="AAPL"
        universe={["AAPL", "MSFT"]}
        loadCandlesForSymbols={loadCandlesForSymbols}
        availableMoney={30}
        lastRunConfig={{ feeRate: 0 }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Momentum" }));

    await waitFor(() => {
      expect(loadCandlesForSymbols).toHaveBeenCalledWith(["AAPL", "MSFT"]);
      expect(
        screen.getByText("Global performance aggregates every stock in the resolved universe."),
      ).toBeInTheDocument();
      expect(screen.getAllByText("10.00%").length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getByRole("button", { name: "Current Stock" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Current stock performance shows how the selected stock contributed to the portfolio result.",
        ),
      ).toBeInTheDocument();
      // Share of PnL
      expect(screen.getByText("66.67%")).toBeInTheDocument();
      // Stock Return (2 / 30)
      expect(screen.getByText("6.67%")).toBeInTheDocument();
      // Avg Trade (2 / 10)
      expect(screen.getByText("20.00%")).toBeInTheDocument();
    });
  });
});
