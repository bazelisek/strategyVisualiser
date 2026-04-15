"use server";

import { cookies, headers } from "next/headers";
import { auth } from "@/auth";
import Database from "better-sqlite3";
import path from "path";
import { User } from "better-auth";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

type BetterAuthUserRow = {
  id: string;
  name: string;
  email: string;
  emailVerified: number;
  image: string | null;
  createdAt: string;
  updatedAt: string;
};

const dbPath = path.join(process.cwd(), "sqlite.db");
const db = new Database(dbPath, { readonly: true });

export async function getUserByEmail(email: string): Promise<User | null> {
  const row = db
    .prepare(
      `SELECT id, name, email, emailVerified, image, createdAt, updatedAt
       FROM user
       WHERE email = ?`
    )
    .get(email) as BetterAuthUserRow | undefined;

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: Boolean(row.emailVerified),
    image: row.image,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export type ServerAuthResult = {
  success: boolean;
  error?: string;
};

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<ServerAuthResult> {
  const response = await auth.api.signInEmail({
    body: {
      email,
      password,
    },
    asResponse: true,
  });

  if (!response.ok) {
    return { success: false, error: await readErrorMessage(response) };
  }

  applySetCookieHeaders(response);
  return { success: true };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
  callbackURL = "/history",
): Promise<ServerAuthResult> {
  const response = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name,
      callbackURL,
    },
    asResponse: true,
  });

  if (!response.ok) {
    return {
      success: false,
      error: await readErrorMessage(response, "Sign up failed"),
    };
  }

  applySetCookieHeaders(response);
  return { success: true };
}

async function readErrorMessage(
  response: Response,
  fallback = "Login failed",
): Promise<string> {
  try {
    const data = (await response.json()) as
      | { error?: string; message?: string }
      | undefined;
    return data?.error ?? data?.message ?? fallback;
  } catch {
    return fallback;
  }
}

async function applySetCookieHeaders(response: Response) {
  const cookieStore = await cookies();
  const setCookieHeaders = getSetCookieHeaders(response);
  for (const setCookie of setCookieHeaders) {
    const parsed = parseSetCookie(setCookie);
    if (!parsed) {
      continue;
    }
    const { name, value, options } = parsed;
    cookieStore.set(name, value, options as Record<string, unknown>);
  }
}

function getSetCookieHeaders(response: Response): string[] {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  if (typeof headers.getSetCookie === "function") {
    return headers.getSetCookie();
  }

  const setCookie = headers.get("set-cookie");
  if (!setCookie) {
    return [];
  }

  return splitSetCookieHeader(setCookie);
}

function splitSetCookieHeader(value: string): string[] {
  const parts: string[] = [];
  let current = "";
  let inExpires = false;

  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];

    if (char === ",") {
      if (!inExpires) {
        if (current.trim()) {
          parts.push(current.trim());
        }
        current = "";
        continue;
      }
    }

    current += char;

    if (!inExpires && value.slice(i, i + 8).toLowerCase() === "expires=") {
      inExpires = true;
    } else if (inExpires && char === ";") {
      inExpires = false;
    }
  }

  if (current.trim()) {
    parts.push(current.trim());
  }

  return parts;
}

function parseSetCookie(setCookie: string):
  | { name: string; value: string; options: Record<string, unknown> }
  | null {
  const segments = setCookie.split(";").map((segment) => segment.trim());
  const [nameValue, ...attributes] = segments;

  if (!nameValue) {
    return null;
  }

  const separatorIndex = nameValue.indexOf("=");
  if (separatorIndex === -1) {
    return null;
  }

  const name = nameValue.slice(0, separatorIndex);
  const value = nameValue.slice(separatorIndex + 1);
  const options: Record<string, unknown> = {};

  for (const attribute of attributes) {
    const [key, ...rest] = attribute.split("=");
    const normalizedKey = key.toLowerCase();
    const attributeValue = rest.join("=");

    switch (normalizedKey) {
      case "domain":
        options.domain = attributeValue;
        break;
      case "path":
        options.path = attributeValue;
        break;
      case "max-age":
        options.maxAge = Number(attributeValue);
        break;
      case "expires":
        options.expires = new Date(attributeValue);
        break;
      case "samesite":
        options.sameSite = attributeValue.toLowerCase();
        break;
      case "secure":
        options.secure = true;
        break;
      case "httponly":
        options.httpOnly = true;
        break;
      default:
        break;
    }
  }

  return { name, value, options };
}
