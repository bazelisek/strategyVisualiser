import Form from "@/components/Input/Form";
import classes from "./page.module.css";

export default function Home({ searchParams }: { searchParams: { [key: string]: string }}) {
  //const newSearchParams = Promise.resolve(searchParams);

  return (
    <main className={classes.main}>
      <Form />
    </main>
  );
}
