import { Suspense } from "react";
import classes from "./page.module.css";
import Form from "@/components/Input/Form";
import CandlestickChartFetcher from "@/components/Chart/CandlestickChartFetcher";

export default function Home({ searchParams }: { searchParams: { [key: string]: string }}) {
  //const newSearchParams = Promise.resolve(searchParams);

  return (
    <main className={classes.main}>
      <div className={classes.div}>
        <Form />
        <Suspense fallback={<p>Loading</p>}>
          <CandlestickChartFetcher/>
        </Suspense>
      </div>
    </main>
  );
}
