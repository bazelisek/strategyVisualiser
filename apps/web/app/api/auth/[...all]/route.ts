import { auth } from "@/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";
import { BASE_PATH } from "@/util/constants";

const handler = toNextJsHandler(auth);

export const GET = (req: Request) => {
    const url = new URL(req.url);
    // If Next.js stripped the BASE_PATH, re-add it so better-auth can match it
    if (!url.pathname.startsWith(BASE_PATH)) {
        url.pathname = BASE_PATH + url.pathname;
    }
    console.log("Auth GET request (modified):", url.toString());
    return handler.GET(new Request(url, req));
};

export const POST = (req: Request) => {
    const url = new URL(req.url);
    if (!url.pathname.startsWith(BASE_PATH)) {
        url.pathname = BASE_PATH + url.pathname;
    }
    console.log("Auth POST request (modified):", url.toString());
    return handler.POST(new Request(url, req));
};
