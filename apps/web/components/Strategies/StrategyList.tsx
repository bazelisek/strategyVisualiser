"use server";

import getVisibleStrategies from "@/util/strategies/getVisibleStrategies";
import { Divider, List, ListItem, ListItemButton, Sheet } from "@mui/joy";
import { redirect } from "next/navigation";
import StrategyListItem from "./StrategyListItem";

export default async function StrategyList() {
  const { publicStrategies, privateStrategies } = await getVisibleStrategies();
  console.log("Fetched strategies:", { publicStrategies, privateStrategies });

  

  return (
    // TODO: Redirect to strategy details page on click.
    <div>
      <h3>Your strategies</h3>
      <Sheet>
        <List>
          {privateStrategies.length === 0 && (
            <p>No private strategies found.</p>
          )}
          {privateStrategies.map((strategy) => (
            <StrategyListItem strategy={strategy} />
          ))}
        </List>
      </Sheet>
      <Divider></Divider>
      <h3>Public strategies</h3>
      <Sheet>
        <List>
          {publicStrategies.length === 0 && <p>No public strategies found.</p>}
          {publicStrategies.map((strategy) => (
            <StrategyListItem strategy={strategy} />
          ))}
        </List>
      </Sheet>
    </div>
  );
}
