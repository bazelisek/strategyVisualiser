import { render, screen } from "@testing-library/react";
import Preview from "@/components/landing/Preview";

describe("Preview", () => {
  test("renders the preview chart and performance metrics", () => {
    render(<Preview />);

    expect(
      screen.getByRole("heading", {
        name: /understand the trade path before you trust the strategy/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText("Trading strategy preview chart"),
    ).toBeInTheDocument();

    expect(screen.getByText("Net return")).toBeInTheDocument();
    expect(screen.getByText("Win rate")).toBeInTheDocument();
    expect(screen.getByText("Max drawdown")).toBeInTheDocument();
    expect(screen.getByText("Profit factor")).toBeInTheDocument();
  });
});
