"use client";
import { createAuthClient } from "better-auth/react";
import { getBaseUrl } from "./util/baseURL";

export const authClient = createAuthClient({
    baseURL: getBaseUrl()
});
export const { signIn, signUp, useSession } = authClient;
