import axios from "axios";

export async function fetchDataFromUrl(url: string) {
  console.log(`Fetching from ${url}`);
  // stock code: for example AAPL
  // interval: for eample 1d
  // range: for example 1mo
  try {
    const result = await axios.get(url);
    const data = result.data;
    //console.log(JSON.stringify(data));
    return { data, error: null };
  } catch (error) {
    console.log(error);
    return { data: null, error: `failed to fetch from ${url}` };
  }
}
