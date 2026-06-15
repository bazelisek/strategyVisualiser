import { proxyBackendRequest } from "@/util/backendProxy";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function pathFrom(context: RouteContext) {
  const { path } = await context.params;
  return ["api", "yahoo", ...path];
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, await pathFrom(context));
}
