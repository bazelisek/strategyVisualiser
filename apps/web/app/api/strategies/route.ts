import { proxyBackendRequest } from "@/util/backendProxy";
import { NextRequest } from "next/server";

const backendPath = ["api", "strategies"];

export function GET(request: NextRequest) {
  return proxyBackendRequest(request, backendPath);
}

export function POST(request: NextRequest) {
  return proxyBackendRequest(request, backendPath);
}
