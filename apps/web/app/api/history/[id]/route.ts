import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { getHistoryEntry } from "@/util/db/historyDb.server";

const getUserId = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id ?? null;
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const item = getHistoryEntry(userId, id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { userId: _userId, ...rest } = item;
  return NextResponse.json({ item: rest });
}
