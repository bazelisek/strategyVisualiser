import { render, screen } from "@testing-library/react";
import Credibility from "@/components/landing/Credibility";

describe("Credibility", () => {
  test("renders the technical stack and sandbox constraints", () => {
    render(<Credibility />);

    expect(screen.getByText("Next.js")).toBeInTheDocument();
    expect(screen.getByText("Lightweight Charts by TradingView")).toBeInTheDocument();
    expect(screen.getByText("Yahoo Finance API")).toBeInTheDocument();
    expect(screen.getByText("Docker sandbox execution")).toBeInTheDocument();

    expect(
      screen.getByText(/strategy containers run without outbound network access/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/container_memory = capped/i)).toBeInTheDocument();
  });
});
