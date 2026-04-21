"use client";

import classes from "./VisualizeContent.module.css";
import AddTile from "@/components/Tiling/AddTile";
import Tile from "@/components/Tiling/Tile";
import Preconfiguration from "@/components/Input/Preconfiguration";
import { Grid } from "@mui/joy";
import Sidebar from "@/components/Sidebar/Sidebar";
import { TileSearchParam } from "@/util/tilesSearchParams";
import useIndicators from "@/hooks/useIndicators";
import { useDispatch, useSelector } from "react-redux";
import { newIndicators, RootState } from "@/store/reduxStore";
import { createIndicatorId } from "@/util/indicators/identity";
import { toTileIndicator } from "@/util/indicators/serialization";
import { persistIndicatorAdd } from "@/util/indicators/persistence";
import { useTiles } from "@/hooks/useTiles";
import VisualizationName from "./VisualizationName";

type VisualizeContentProps = {
  tiles: TileSearchParam[];
  onTilesChange: (nextTiles: TileSearchParam[]) => void;
  id: string;
};

const VisualizeContent = ({
  tiles,
  onTilesChange,
  id,
}: VisualizeContentProps) => {
  const tileCount = tiles.length;
  const tileArr: React.JSX.Element[] = [];
  const defaultsIndicators = useIndicators((indicators) =>
    indicators.filter((indicator) => indicator.index === 0),
  );
  const dispatch = useDispatch();
  const { visualizationId } = useTiles();
  const config = useSelector((state: RootState) => state.config);

  for (let i = 0; i < tileCount; i++) {
    tileArr.push(<Tile index={i} key={i} />);
  }

  const toUnixString = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ""
      : String(Math.floor(date.getTime() / 1000));
  };

  function handleAddTile() {
    const nextTile: TileSearchParam = {
      symbol: config.symbol.defaultValue,
      strategy: config.strategy.defaultValue,
      interval: config.interval.defaultValue,
      period1: toUnixString(config.period1.defaultValue),
      period2: toUnixString(config.period2.defaultValue),
    };
    const nextTiles: TileSearchParam[] = [...tiles, nextTile];
    onTilesChange(nextTiles);
    if (defaultsIndicators.length > 0) {
      const newTileIndex = nextTiles.length;
      defaultsIndicators.forEach((indicator) => {
        const nextIndicator = {
          ...indicator,
          id: createIndicatorId(),
          index: newTileIndex,
          linkedGlobalStateIndex: undefined,
          indicator: {
            ...indicator.indicator,
            value: JSON.parse(JSON.stringify(indicator.indicator.value)),
          },
        };
        dispatch(newIndicators({ state: nextIndicator }));
        void persistIndicatorAdd({
          visualizationId,
          tileIndex: newTileIndex,
          indicator: toTileIndicator(nextIndicator),
        });
      });
    }
  }

  return (
    <Grid container sx={{ width: "100%" }} spacing={2}>
      <Grid xs={2}>
        <Sidebar />
      </Grid>
      <Grid xs={8}>
        <div className={classes.centerContainer}>
          <main id="main" className={classes.main}>
            <VisualizationName id={id} />
            <Preconfiguration />
            <AddTile onClick={handleAddTile} />
            {tileCount > 0 && <div className={classes.tileGrid}>{tileArr}</div>}
          </main>
        </div>
      </Grid>
      <Grid xs={2}>
        <div className="side-div"></div>
      </Grid>
    </Grid>
  );
};

export default VisualizeContent;
