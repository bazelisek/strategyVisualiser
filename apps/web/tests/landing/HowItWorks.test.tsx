import { render, screen } from "@testing-library/react";
import HowItWorks from "@/components/landing/HowItWorks";

describe("HowItWorks", () => {
  test("renders the four strategy workflow steps", () => {
    render(<HowItWorks />);

    expect(screen.getByRole("heading", { name: /a direct workflow from strategy code/i })).toBeInTheDocument();
    expect(screen.getByText("Write your strategy")).toBeInTheDocument();
    expect(screen.getByText("Run it in isolation")).toBeInTheDocument();
    expect(screen.getByText("Inspect every trade")).toBeInTheDocument();
    expect(screen.getByText("Review the result")).toBeInTheDocument();
  });
});
