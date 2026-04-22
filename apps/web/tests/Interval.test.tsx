import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import Interval from "@/components/Input/Form/Interval";

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    li: ({ children, ...props }: React.LiHTMLAttributes<HTMLLIElement>) => (
      <li {...props}>{children}</li>
    ),
  },
}));

describe("Interval requirements", () => {
  const baseProps = {
    value: "",
    onChange: jest.fn(),
    availableIntervals: ["1d", "1wk", "1mo", "3mo"],
    handleContinue: jest.fn(),
    children: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("hides blacklisted intervals", () => {
    render(
      <Interval
        {...baseProps}
        requirements={{
          interval: {
            blacklist: ["1mo", "3mo"],
          },
        }}
      />,
    );

    fireEvent.click(screen.getByText("Plese select an interval"));

    expect(screen.getByText("1d")).toBeInTheDocument();
    expect(screen.getByText("1wk")).toBeInTheDocument();
    expect(screen.queryByText("1mo")).not.toBeInTheDocument();
    expect(screen.queryByText("3mo")).not.toBeInTheDocument();
  });

  test("shows only whitelisted intervals", () => {
    render(
      <Interval
        {...baseProps}
        requirements={{
          interval: {
            whitelist: ["1d", "1wk"],
          },
        }}
      />,
    );

    fireEvent.click(screen.getByText("Plese select an interval"));

    expect(screen.getByText("1d")).toBeInTheDocument();
    expect(screen.getByText("1wk")).toBeInTheDocument();
    expect(screen.queryByText("1mo")).not.toBeInTheDocument();
    expect(screen.queryByText("3mo")).not.toBeInTheDocument();
  });
});
