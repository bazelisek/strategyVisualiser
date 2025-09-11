import Form from "@/components/Input/Form";
import classes from "./page.module.css";

export default function Home() {
  //const newSearchParams = Promise.resolve(searchParams);

  return (
    <main id='main' className={classes.main}>
      <Form />
    </main>
  );
}
