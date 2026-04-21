import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  test("composes the landing sections in order", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", {
        name: "Design. Test. Understand your trading strategies.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /a direct workflow from strategy code to trade-level evidence/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /built for reading strategy behavior/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /understand the trade path before you trust the strategy/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /built with tools that fit financial workflows/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Stop guessing. Start testing.",
      }),
    ).toBeInTheDocument();
  });
});
