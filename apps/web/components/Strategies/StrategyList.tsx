"use client";

import getVisibleStrategies from "@/util/strategies/getVisibleStrategies";
import { Divider, List, ListItem, ListItemButton, Sheet } from "@mui/joy";
import { redirect } from "next/navigation";
import StrategyListItem from "./StrategyListItem";
import StrategyTable from "./StrategyTable";
import { useEffect, useState } from "react";
import { Strategy } from "@/util/strategies/strategies";
import ChartLoading from "../common/ChartLoading";

export default function StrategyList() {
  const [isLoading, setLoading] = useState<boolean>(true);
  const [strategies, setStrategies] = useState<{publicStrategies: Strategy[], privateStrategies: Strategy[]}>({publicStrategies: [], privateStrategies: []});
  const { publicStrategies, privateStrategies } = strategies;

  useEffect(() => {
    async function getStrategies() {
      const fetchedStrategies = await getVisibleStrategies();
      setStrategies(fetchedStrategies);
      setLoading(false);
    }
    getStrategies();
  }, [])
  
  console.log("Fetched strategies:", { publicStrategies, privateStrategies });

  return (
    // TODO: Redirect to strategy details page on click.
    <div>{isLoading ? <ChartLoading /> :<>
      <h3>Your strategies</h3>
      <Sheet>
        <StrategyTable strategies={privateStrategies} emptyText="No private strategies found." />
      </Sheet>
      <Divider></Divider>
      <h3>Public strategies</h3>
      <Sheet>
        <StrategyTable strategies={publicStrategies} emptyText="No public strategies found." />
      </Sheet></>}
    </div>
  );
}
