"use server";

export async function getAvailableStrategies() {
  /*const { data, error } = await fetchDataFromUrl(
    `https://DUMMYURL/api/getStrategyKeys`
  );
  if (error) {
    return { data: [], error };
  }
  return {data, error: null};  
  */
 return ['Dummy strategy', 'Second dummy strategy']
}
