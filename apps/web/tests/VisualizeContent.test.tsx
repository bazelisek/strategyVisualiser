import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import VisualizeContent from "@/components/VisualizePage/VisualizeContent";
import type { TileSearchParam } from "@/util/tilesSearchParams";

jest.mock("@mui/joy", () => ({
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock("react-redux", () => ({
  useDispatch: () => jest.fn(),
  useSelector: (selector: (state: unknown) => unknown) =>
    selector({
      config: {
        symbol: { defaultValue: "AAPL" },
        strategy: { defaultValue: "12:Momentum" },
        interval: { defaultValue: "1d" },
        period1: { defaultValue: "2024-01-10T10:15" },
        period2: { defaultValue: "2024-01-12T16:30" },
      },
    }),
}));

jest.mock("@/hooks/useIndicators", () => ({
  __esModule: true,
  default: () => [],
}));

jest.mock("@/hooks/useTiles", () => ({
  useTiles: () => ({
    visualizationId: "viz-1",
  }),
}));

jest.mock("@/util/indicators/persistence", () => ({
  persistIndicatorAdd: jest.fn(),
}));

jest.mock("@/store/reduxStore", () => ({
  newIndicators: jest.fn((payload) => ({ type: "newIndicators", payload })),
}));

jest.mock("@/components/Sidebar/Sidebar", () => {
  return function MockSidebar() {
    return <div>Sidebar</div>;
  };
});

jest.mock("@/components/Input/Preconfiguration", () => {
  return function MockPreconfiguration() {
    return <div>Defaults</div>;
  };
});

jest.mock("@/components/VisualizePage/VisualizationName", () => {
  return function MockVisualizationName({ id }: { id: string }) {
    return <div>Visualization {id}</div>;
  };
});

jest.mock("@/components/Tiling/Tile", () => {
  return function MockTile({ index }: { index: number }) {
    return <div data-testid={`tile-${index}`}>Tile {index}</div>;
  };
});

describe("VisualizeContent", () => {
  function Harness() {
    const [tiles, setTiles] = React.useState<TileSearchParam[]>([]);
    return <VisualizeContent id="viz-1" tiles={tiles} onTilesChange={setTiles} />;
  }

  test("adds a tile immediately with defaults and renders it inline", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Analyze a Strategy" }));

    await waitFor(() => {
      expect(screen.getByTestId("tile-0")).toBeInTheDocument();
    });
  });

  test("seeds the new tile from saved defaults", async () => {
    const handleTilesChange = jest.fn();

    render(
      <VisualizeContent id="viz-1" tiles={[]} onTilesChange={handleTilesChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Analyze a Strategy" }));

    await waitFor(() => {
      expect(handleTilesChange).toHaveBeenCalledWith([
        {
          symbol: "AAPL",
          strategy: "12:Momentum",
          interval: "1d",
          period1: String(
            Math.floor(new Date("2024-01-10T10:15").getTime() / 1000),
          ),
          period2: String(
            Math.floor(new Date("2024-01-12T16:30").getTime() / 1000),
          ),
        },
      ]);
    });
  });
});
