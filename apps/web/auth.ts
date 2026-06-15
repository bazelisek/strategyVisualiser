import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { BASE_PATH } from "./util/constants";

const getBaseURL = () => {
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  
  const origin = "http://localhost:3000";
  return BASE_PATH ? `${origin}${BASE_PATH}` : origin;
};

export const auth = betterAuth({
  baseURL: getBaseURL(),
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
  /*socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
  },*/
});
