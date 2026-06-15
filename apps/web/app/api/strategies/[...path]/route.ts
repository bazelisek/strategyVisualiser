import { proxyBackendRequest } from "@/util/backendProxy";
import { NextRequest } from "next/server";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function pathFrom(context: RouteContext) {
  const { path } = await context.params;
  return ["api", "strategies", ...path];
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, await pathFrom(context));
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, await pathFrom(context));
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, await pathFrom(context));
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxyBackendRequest(request, await pathFrom(context));
}
