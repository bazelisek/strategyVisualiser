import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";
import { BASE_PATH } from "./constants";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export async function proxyBackendRequest(
  request: NextRequest,
  backendPath: string[],
) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.redirect(new URL(BASE_PATH + "/login", request.url));
  }

  const authorization = await authorizeRequest(request, backendPath, session.user);
  if (authorization instanceof NextResponse) {
    return authorization;
  }

  const targetUrl = buildBackendUrl(request, backendPath);
  const headers = buildBackendHeaders(request, session.user);
  if (authorization.contentType) {
    headers.set("content-type", authorization.contentType);
  }

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body: allowsBody(request.method)
      ? authorization.body ?? await request.arrayBuffer()
      : undefined,
    redirect: "manual",
  });

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: filterResponseHeaders(response.headers),
  });
}

type AuthorizationResult = {
  body?: BodyInit;
  contentType?: string;
};

async function authorizeRequest(
  request: NextRequest,
  backendPath: string[],
  user: { email?: string },
): Promise<AuthorizationResult | NextResponse> {
  if (backendPath[0] !== "api" || backendPath[1] !== "strategies") {
    return {};
  }

  const email = normalizeEmail(user.email);
  if (!email) {
    return unauthorized();
  }

  const segments = backendPath.slice(2);
  const [first, second, third] = segments;

  if (first === "users") {
    const requestedEmail = normalizeEmail(second);
    if (!requestedEmail || requestedEmail !== email) {
      return forbidden();
    }
    return {};
  }

  if (request.method === "POST" && segments.length === 0) {
    const payload = await request.clone().json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return {};
    }

    return {
      body: JSON.stringify({ ...payload, ownerEmail: email }),
      contentType: "application/json",
    };
  }

  if (!first || !isNumericId(first)) {
    return {};
  }

  const strategy = await getBackendJson<{
    id: number;
    isPublic?: boolean;
    ownerEmail?: string | null;
  }>(["api", "strategies", first]);

  if (!strategy.ok) {
    return backendStatus(strategy.status);
  }

  const isOwner = normalizeEmail(strategy.data.ownerEmail) === email;
  const needsOwner = request.method === "PATCH" || request.method === "DELETE";
  const needsRead =
    request.method === "GET" ||
    (request.method === "POST" && second === "analyze" && third === undefined);

  if (needsOwner && !isOwner) {
    return forbidden();
  }

  if (needsRead && !strategy.data.isPublic && !isOwner) {
    const canReadSharedStrategy = await userCanReadStrategy(email, Number(first));
    if (!canReadSharedStrategy) {
      return forbidden();
    }
  }

  return {};
}

function buildBackendUrl(request: NextRequest, backendPath: string[]) {
  const requestUrl = new URL(request.url);
  const baseUrl = BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`;
  const targetUrl = new URL(backendPath.map(encodeURIComponent).join("/"), baseUrl);
  targetUrl.search = requestUrl.search;
  return targetUrl;
}

async function getBackendJson<T>(backendPath: string[]) {
  const response = await fetch(buildBackendUrlForPath(backendPath), {
    cache: "no-store",
  });

  if (!response.ok) {
    return { ok: false as const, status: response.status };
  }

  return { ok: true as const, data: (await response.json()) as T };
}

async function userCanReadStrategy(email: string, strategyId: number) {
  const response = await getBackendJson<{
    privateStrategies?: Array<{ id?: number }>;
    publicStrategies?: Array<{ id?: number }>;
  }>(["api", "strategies", "users", email]);

  if (!response.ok) {
    return false;
  }

  return [
    ...(response.data.privateStrategies ?? []),
    ...(response.data.publicStrategies ?? []),
  ].some((strategy) => strategy.id === strategyId);
}

function buildBackendUrlForPath(backendPath: string[]) {
  const baseUrl = BACKEND_URL.endsWith("/") ? BACKEND_URL : `${BACKEND_URL}/`;
  return new URL(backendPath.map(encodeURIComponent).join("/"), baseUrl);
}

function buildBackendHeaders(
  request: NextRequest,
  user: { id?: string; email?: string },
) {
  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("cookie");

  if (user.email) {
    headers.set("x-authenticated-user-email", user.email);
  }
  if (user.id) {
    headers.set("x-authenticated-user-id", user.id);
  }

  return headers;
}

function filterResponseHeaders(source: Headers) {
  const headers = new Headers(source);
  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }
  return headers;
}

function allowsBody(method: string) {
  return method !== "GET" && method !== "HEAD";
}

function normalizeEmail(email?: string | null) {
  if (!email || !email.trim()) {
    return null;
  }
  return email.trim().toLowerCase();
}

function isNumericId(value: string) {
  return /^\d+$/.test(value);
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

function backendStatus(status: number) {
  return NextResponse.json(
    { error: status === 404 ? "Not found" : "Backend request failed" },
    { status },
  );
}
