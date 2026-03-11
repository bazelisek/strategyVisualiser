"use client";

import classes from "@/app/visualize/page.module.css";
import { useState } from "react";
import AddTile from "@/components/Tiling/AddTile";
import Tile from "@/components/Tiling/Tile";
import Modal from "@/components/Modal";
import Form from "@/components/Input/Form/Form";
import Preconfiguration from "@/components/Input/Preconfiguration";
import { Grid } from "@mui/joy";
import Sidebar from "@/components/Sidebar/Sidebar";
import { TileSearchParam } from "@/util/tilesSearchParams";

type VisualizeContentProps = {
  tiles: TileSearchParam[];
  onTilesChange: (nextTiles: TileSearchParam[]) => void;
};

const VisualizeContent = ({ tiles, onTilesChange }: VisualizeContentProps) => {
  const tileCount = tiles.length;
  const [isAddTileActive, setIsAddTileActive] = useState<boolean>(true);
  const tileArr: React.JSX.Element[] = [];

  for (let i = 0; i < tileCount; i++) {
    tileArr.push(<Tile index={i} key={i} />);
  }

  function handleAddTile() {
    setIsAddTileActive(false);
  }

  function handleClose() {
    setIsAddTileActive(true);
  }

  function handleSubmit(submittedData: TileSearchParam) {
    const nextTiles: TileSearchParam[] = [...tiles, submittedData];
    onTilesChange(nextTiles);
    handleClose();
  }

  return (
    <Grid container sx={{ width: "100%" }} spacing={2}>
      <Grid xs={2}>
        <Sidebar />
      </Grid>
      <Grid xs={8}>
        <div className={classes.centerContainer}>
          <main id="main" className={classes.main}>
            <Preconfiguration />
            <AddTile onClick={handleAddTile} active={isAddTileActive} />
            <Modal
              title="New Tile"
              onClose={handleClose}
              open={!isAddTileActive}
              className={classes.modal}
            >
              <Form onClose={handleSubmit} index={tileCount + 1} />
            </Modal>
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
