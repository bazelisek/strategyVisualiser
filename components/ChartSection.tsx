import { Suspense } from "react";
import classes from "./ChartSection.module.css";
import Form from "@/components/Input/Form";
import CandlestickChartFetcher from "@/components/Chart/CandlestickChartFetcher";

export default function ChartSection() {
  return (
    <div className={classes.div}>
      <Suspense fallback={<p>Loading chart...</p>}>
        <CandlestickChartFetcher />
      </Suspense>
    </div>
  );
}
