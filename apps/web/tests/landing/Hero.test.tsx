import { render, screen } from "@testing-library/react";
import Hero from "@/components/landing/Hero";

describe("Hero", () => {
  test("communicates value and sends primary actions to login", () => {
    render(<Hero />);

    expect(
      screen.getByRole("heading", {
        name: "Design. Test. Understand your trading strategies.",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(/project buy and sell markers directly on the chart/i),
    ).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /start analyzing/i })).toHaveAttribute(
      "href",
      "/login",
    );

    expect(
      screen.getByRole("link", { name: /explore public strategies/i }),
    ).toHaveAttribute("href", "/login");

    expect(screen.getByRole("link", { name: /^sign in$/i })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
