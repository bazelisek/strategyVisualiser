import QuickActions from "@/components/Input/QuickActions/QuickActions";
import classes from "./page.module.css";
import ChartSection from "@/components/ChartSection";
import SymbolModal from "@/components/Input/QuickActions/SymbolModal";
import StrategyModal from "@/components/Input/QuickActions/StrategyModal";
import { Suspense } from "react";

export default function Home() {
  return (
    <main id="main" className={classes.main}>
      <Suspense fallback="Loading...">
        <QuickActions />
        <ChartSection />
        <SymbolModal />
        <StrategyModal />
      </Suspense>
    </main>
  );
}
