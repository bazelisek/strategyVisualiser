import classes from "./page.module.css";
import ChartSection from "@/components/ChartSection";

export default function Home() {
  return (
    <main id="main" className={classes.main}>
      <ChartSection/>
    </main>
  );
}
