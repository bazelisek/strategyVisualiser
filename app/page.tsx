"use client";
import classes from "./page.module.css";
import { Suspense, useEffect, useState } from "react";
import AddTile from "@/components/Tiling/AddTile";
import Tile from "@/components/Tiling/Tile";
import Modal from "@/components/Modal";
import Form from "@/components/Input/Form/Form";
import { useRouter, useSearchParams } from "next/navigation";
import Preconfiguration from "@/components/Input/Preconfiguration";
import { useDispatch } from "react-redux";
import { newIndicators } from "@/store/reduxStore";

export default function Home() {
  const params = useSearchParams();
  const symbols = params.getAll("symbol");
  const strategies = params.getAll("strategy");
  const period1s = params.getAll("period1");
  const period2s = params.getAll("period2");
  const intervals = params.getAll("interval");
  const router = useRouter();
  const dispatch = useDispatch();

  const tileCount = symbols.length;
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
    let paramsArr: {
      symbol: string;
      strategy: string;
      period1: string;
      period2: string;
      interval: string;
    }[] = [];
    for (let i = 0; i < tileCount; i++) {
      paramsArr.push({
        symbol: symbols[i],
        strategy: strategies[i],
        interval: intervals[i],
        period1: period1s[i],
        period2: period2s[i],
      });
    }
    paramsArr.push(submittedData);
    const newSearchParams = new URLSearchParams();
    paramsArr.forEach((param) => {
      newSearchParams.append("symbol", param.symbol);
      newSearchParams.append("strategy", param.strategy);
      newSearchParams.append("interval", param.interval);
      newSearchParams.append("period1", param.period1);
      newSearchParams.append("period2", param.period2);
    });
    router.replace("/?" + newSearchParams.toString());

    //dispatch(newChart(submittedData));
    handleClose();
  }

  return (
    <main id="main" className={classes.main}>
      <Suspense fallback="Loading...">
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
      </Suspense>
    </main>
  );
}
