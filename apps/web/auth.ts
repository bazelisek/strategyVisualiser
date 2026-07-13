import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { getOrigin } from "./util/baseURL";
import { BASE_PATH } from "./util/env/constants";

export const auth = betterAuth({
  baseURL: getOrigin(),
  basePath: BASE_PATH + "/api/auth",
  database: new Database("./sqlite.db"),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    trustedProxyHeaders: true,
  },
  plugins: [nextCookies()],
});
