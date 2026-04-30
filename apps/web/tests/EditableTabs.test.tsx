import { fireEvent, render, screen } from "@testing-library/react";
import EditableTabs from "@/components/blocks/EditableTabs";
import React from "react";

jest.mock("@mui/icons-material/Add", () => function AddIcon() {
  return <span>Add</span>;
});

jest.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  },
}));

jest.mock("@mui/joy", () => ({
  Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Button: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Dropdown: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Menu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  MenuButton: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <button type="button">{children}</button>,
  MenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
  }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Sheet: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tab: ({
    children,
    value,
  }: {
    children: React.ReactNode;
    value: string;
  }) => <div role="tab" aria-label={value}>{children}</div>,
  TabList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Typography: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

describe("EditableTabs", () => {
  it("selects the first available tab when no tab is selected", () => {
    const onTabChange = jest.fn();

    render(
      <EditableTabs
        availableTabs={[
          { name: "AAPL" },
          { name: "MSFT" },
        ]}
        selectedTab={null}
        onTabChange={onTabChange}
      />
    );

    expect(screen.getByRole("tab", { name: "AAPL" })).toBeInTheDocument();
    expect(onTabChange).toHaveBeenCalledWith("AAPL");
  });

  it("selects the first available tab when tabs arrive after mount", () => {
    const onTabChange = jest.fn();
    const view = render(
      <EditableTabs
        availableTabs={[]}
        selectedTab={null}
        onTabChange={onTabChange}
      />
    );

    view.rerender(
      <EditableTabs
        availableTabs={[
          { name: "AAPL" },
          { name: "MSFT" },
        ]}
        selectedTab={null}
        onTabChange={onTabChange}
      />
    );

    expect(screen.getByRole("tab", { name: "AAPL" })).toBeInTheDocument();
    expect(onTabChange).toHaveBeenCalledWith("AAPL");
  });

  it("keeps the initially selected tab instead of clearing it on mount", () => {
    const onTabChange = jest.fn();

    render(
      <EditableTabs
        availableTabs={[
          { name: "AAPL" },
          { name: "MSFT" },
        ]}
        selectedTab="AAPL"
        onTabChange={onTabChange}
      />
    );

    expect(screen.getByRole("tab", { name: "AAPL" })).toBeInTheDocument();
    expect(onTabChange).not.toHaveBeenCalled();
  });

  it("selects an added tab without emitting a null reset", () => {
    const onTabChange = jest.fn();

    render(
      <EditableTabs
        availableTabs={[
          { name: "AAPL" },
          { name: "MSFT" },
        ]}
        selectedTab="AAPL"
        onTabChange={onTabChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "MSFT" }));

    expect(onTabChange).toHaveBeenCalledWith("MSFT");
    expect(onTabChange).not.toHaveBeenCalledWith(null);
  });
});
