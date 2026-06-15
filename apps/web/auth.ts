import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { getOrigin } from "./util/baseURL";
import { BASE_PATH } from "./util/constants";

export const auth = betterAuth({
  baseURL: getOrigin(),
  basePath: BASE_PATH + "/api/auth",
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
