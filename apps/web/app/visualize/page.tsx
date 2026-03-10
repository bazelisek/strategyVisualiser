"use client";
import classes from "./page.module.css";
import { Suspense, useEffect, useState } from "react";
import AddTile from "@/components/Tiling/AddTile";
import Tile from "@/components/Tiling/Tile";
import Modal from "@/components/Modal";
import Form from "@/components/Input/Form/Form";
import { useRouter, useSearchParams } from "next/navigation";
import Preconfiguration from "@/components/Input/Preconfiguration";
import { CircularProgress, Grid } from "@mui/joy";
import Sidebar from "@/components/Sidebar/Sidebar";
import { useGetAuthStatus } from "@/auth/useGetAuthStatus";
import {
  readTilesFromSearchParams,
  writeTilesToSearchParams,
  TileSearchParam,
} from "@/util/tilesSearchParams";

function PageContent() {
  const params = useSearchParams();
  const tiles = readTilesFromSearchParams(params);
  const router = useRouter();

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

  function handleSubmit(submittedData: {
    symbol: string;
    interval: string;
    period1: string;
    period2: string;
    strategy: string;
  }) {
    const nextTiles: TileSearchParam[] = [...tiles, submittedData];
    router.replace("/visualize?" + writeTilesToSearchParams(nextTiles));

    //dispatch(newChart(submittedData));
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
}

export default function VisualizePage() {
  const router = useRouter();
  const { isAuthenticated, isPending, refetch } = useGetAuthStatus();

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isPending, router]);

  if (isPending || !isAuthenticated) {
    return (
      <div className="loading">
        <CircularProgress />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="loading">
          <CircularProgress />
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
