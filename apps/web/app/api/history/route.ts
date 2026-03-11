import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  addHistoryEntry,
  deleteHistoryEntry,
  listHistoryEntries,
  updateHistoryEntry,
} from "@/util/db/historyDb.server";

const getUserId = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id ?? null;
};

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const items = listHistoryEntries(userId);
  const sanitized = items.map(({ userId: _userId, ...rest }) => rest);
  return NextResponse.json({ items: sanitized });
}

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.name || !body?.params) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const item = addHistoryEntry({
    userId,
    id: body.id,
    name: body.name,
    params: body.params,
    createdAt: body.createdAt,
    updatedAt: body.updatedAt,
  });

  revalidatePath("/history");
  const { userId: _userId, ...rest } = item;
  return NextResponse.json({ item: rest }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const updated = updateHistoryEntry(userId, body.id, {
    name: body.name,
    params: body.params,
  });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { userId: _userId, ...rest } = updated;
  return NextResponse.json({ item: rest });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const deleted = deleteHistoryEntry(userId, id);
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
