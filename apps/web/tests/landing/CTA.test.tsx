import { render, screen } from "@testing-library/react";
import CTA from "@/components/landing/CTA";

describe("CTA", () => {
  test("renders the closing call to action", () => {
    render(<CTA />);

    expect(
      screen.getByRole("heading", {
        name: "Stop guessing. Start testing.",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", { name: /create your first strategy/i }),
    ).toHaveAttribute("href", "/login");
  });
});
