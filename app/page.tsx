import classes from "./page.module.css";
import ChartSection from "@/components/ChartSection";

export default function Home({ searchParams }: { searchParams: { [key: string]: string }}) {
  //const newSearchParams = Promise.resolve(searchParams);

  return (
    <main className={classes.main}>
      <ChartSection/>
    </main>
  );
}
