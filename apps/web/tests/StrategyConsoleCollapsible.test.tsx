import { fireEvent, render, screen } from "@testing-library/react";
import StrategyConsoleCollapsible from "@/components/StrategyConsoleCollapsible";

describe("StrategyConsoleCollapsible", () => {
  test("starts collapsed and expands to show full log", () => {
    const text = "[strategy] line one\n[strategy] line two";
    render(<StrategyConsoleCollapsible consoleOutput={text} />);

    expect(document.querySelector("pre.consoleOutput")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button"));
    const pre = document.querySelector("pre.consoleOutput");
    expect(pre).toBeTruthy();
    expect(pre?.textContent).toContain("[strategy] line one");
    expect(pre?.textContent).toContain("[strategy] line two");
  });
});
