import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useStrategyName } from "@/hooks/useStrategyName";

jest.mock("@/util/strategies/strategies", () => ({
  getAvailableStrategies: jest.fn(async () => [
    { id: 12, name: "Momentum" },
    { id: 77, name: "Mean Reversion" },
  ]),
}));

function StrategyNameProbe({ strategy }: { strategy: string }) {
  const strategyName = useStrategyName(strategy);
  return <div>{strategyName || "missing"}</div>;
}

describe("useStrategyName", () => {
  test("resolves a strategy name when only the id is stored", async () => {
    render(<StrategyNameProbe strategy="12" />);

    await waitFor(() => {
      expect(screen.getByText("Momentum")).toBeInTheDocument();
    });
  });

  test("also resolves legacy id:name strategy values", async () => {
    render(<StrategyNameProbe strategy="77:Mean Reversion" />);

    await waitFor(() => {
      expect(screen.getByText("Mean Reversion")).toBeInTheDocument();
    });
  });
});
