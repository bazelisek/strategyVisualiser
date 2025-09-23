'use client';
import classes from "./page.module.css";
import { Suspense, useState } from "react";
import AddTile from "@/components/Tiling/AddTile";
import Tile from "@/components/Tiling/Tile";

export default function Home() {
  const [tileCount, setTileCount] = useState(0);
  const tileArr: React.JSX.Element[] = [];
  for (let i = 0; i < tileCount; i++) {
    tileArr.push(<Tile index={i} key={i} />)
  }
  return (
    <main id="main" className={classes.main}>
      <Suspense fallback="Loading...">
        <AddTile onClick={() => setTileCount(old => old+1)} />
        {tileArr}
      </Suspense>
    </main>
  );
}
