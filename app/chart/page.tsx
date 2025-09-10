import QuickActions from "@/components/Input/QuickActions/QuickActions";
import classes from "./page.module.css";
import ChartSection from "@/components/ChartSection";
import SymbolModal from "@/components/Input/QuickActions/SymbolModal";
import StrategyModal from "@/components/Input/QuickActions/StrategyModal";

export default function Home() {
  return (
    <main id="main" className={classes.main}>
      <QuickActions />
      <ChartSection/>
      <SymbolModal />
      <StrategyModal />
    </main>
  );
}
