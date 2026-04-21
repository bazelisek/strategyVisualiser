import { render, screen } from "@testing-library/react";
import Features from "@/components/landing/Features";

describe("Features", () => {
  test("renders all landing feature cards", () => {
    render(<Features />);

    expect(screen.getByText("Chart visualization with buy/sell markers")).toBeInTheDocument();
    expect(screen.getByText("Strategy performance analysis")).toBeInTheDocument();
    expect(screen.getByText("Technical indicators")).toBeInTheDocument();
    expect(screen.getByText("Secure execution")).toBeInTheDocument();
    expect(screen.getByText("Multi-stock analysis")).toBeInTheDocument();
    expect(screen.getByText("Public strategy sharing")).toBeInTheDocument();
  });
});
