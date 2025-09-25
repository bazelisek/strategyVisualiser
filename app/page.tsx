"use client";
import classes from "./page.module.css";
import { Suspense, useState } from "react";
import AddTile from "@/components/Tiling/AddTile";
import Tile from "@/components/Tiling/Tile";
import Modal from "@/components/Modal";
import Form from "@/components/Input/Form/Form";
import { useDispatch } from "react-redux";
import { newChart } from "@/store/reduxStore";
import { Mosaic, MosaicWindow, MosaicNode } from 'react-mosaic-component';


export default function Home() {
  const dispatch = useDispatch();
  const [tileCount, setTileCount] = useState(0);
  const [isAddTileActive, setIsAddTileActive] = useState<boolean>(true);
  const tileArr: React.JSX.Element[] = [];
  for (let i = 0; i < tileCount; i++) {
    tileArr.push(<Tile index={i} key={i} />);
  }

  function handleAddTile() {
    setIsAddTileActive(false);
  }

  function handleClose() {
    setIsAddTileActive(true);handleClose
  }

  function handleSubmit(submittedData: {
    symbol: string;
    interval: string;
    period1: string;
    period2: string;
    //duration: formData.duration.value,
    strategy: string;
  }) {
    dispatch(newChart(submittedData));
    setTileCount(old => old + 1);
    handleClose();
  }

  // Generate tile IDs
  const tileIds = Array.from({ length: tileCount }, (_, i) => i.toString());

  // Mosaic tree structure (simple row of tiles)
  const mosaicTree: MosaicNode<string> | null =
  tileIds.length === 0
    ? null
    : tileIds.length === 1
    ? tileIds[0]
    : {
        direction: "row", // use string literal instead of enum
        first: tileIds[0],
        second:
          tileIds.length === 2
            ? tileIds[1]
            : {
                direction: "row", // use string literal instead of enum
                first: tileIds[1],
                second: tileIds[2], // keep it a single node
              },
      };

  function renderTile(id: string) {
    return <Tile index={parseInt(id)} key={id} />;
  }

  return (
    <main id="main" className={classes.main}>
      <Suspense fallback="Loading...">
        <AddTile onClick={handleAddTile} active={isAddTileActive} />
        <Modal title="New Tile" onClose={handleClose} open={!isAddTileActive} className={classes.modal}>
          <Form onClose={handleSubmit} />
        </Modal>
        {tileCount > 0 && (
          <Mosaic<string>
            renderTile={renderTile}
            value={mosaicTree}
            onChange={() => {}}
            className="mosaic-root"
          />
        )}
      </Suspense>
    </main>
  );
}
