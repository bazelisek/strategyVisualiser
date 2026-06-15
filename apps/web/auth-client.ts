"use client";
import { createAuthClient } from "better-auth/react";
import { BASE_PATH } from "./util/constants";

export const authClient = createAuthClient({
    baseURL: BASE_PATH
});
export const { signIn, signUp, useSession } = authClient;
