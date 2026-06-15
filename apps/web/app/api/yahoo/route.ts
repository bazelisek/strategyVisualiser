import { proxyBackendRequest } from "@/util/backendProxy";
import { NextRequest } from "next/server";

export function GET(request: NextRequest) {
  return proxyBackendRequest(request, ["api", "yahoo"]);
}
