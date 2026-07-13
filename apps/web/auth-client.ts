"use client";
import { createAuthClient } from "better-auth/react";
import { getOrigin } from "./util/baseURL";
import { BASE_PATH } from "./util/env/constants";

export const authClient = createAuthClient({
    baseURL: getOrigin(),
    basePath: BASE_PATH + "/api/auth"
});
export const { signIn, signUp, useSession } = authClient;
