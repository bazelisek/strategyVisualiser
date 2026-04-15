"use server";

import { User } from "better-auth";

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

export type Strategy = {
  id: number;
  name: string;
  description: string;
  code: string;
  configuration: string; //should be an object later
  ownerUser: User;
  isPublic: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}
