import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/auth";
import type { TileIndicator } from "@/util/tilesSearchParams";
import {
  addTileIndicator,
  addDefaultIndicator,
  editTileIndicator,
  editDefaultIndicator,
  deleteTileIndicator,
  deleteDefaultIndicator,
} from "@/util/db/historyDb.server";

const getUserId = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session?.user?.id ?? null;
};

type IndicatorPayload = {
  id: string;
  tileIndex: number;
  indicator: TileIndicator;
};

export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as IndicatorPayload | null;
  if (!body?.id || !body?.indicator || body?.tileIndex === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated =
    body.tileIndex === 0
      ? addDefaultIndicator(userId, body.id, body.indicator)
      : addTileIndicator(userId, body.id, body.tileIndex, body.indicator);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { userId: removedUserId, ...rest } = updated;
  void removedUserId;
  return NextResponse.json({ item: rest });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as IndicatorPayload | null;
  if (!body?.id || !body?.indicator || body?.tileIndex === undefined) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated =
    body.tileIndex === 0
      ? editDefaultIndicator(userId, body.id, body.indicator)
      : editTileIndicator(userId, body.id, body.tileIndex, body.indicator);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { userId: removedUserId, ...rest } = updated;
  void removedUserId;
  return NextResponse.json({ item: rest });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const tileIndex = body?.tileIndex as number | undefined;
  const indicatorId = body?.indicatorId as string | undefined;
  const indicatorKey = body?.indicatorKey as string | undefined;
  if (!id || tileIndex === undefined || (!indicatorId && !indicatorKey)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const updated =
    tileIndex === 0
      ? deleteDefaultIndicator(userId, id, { indicatorId, indicatorKey })
      : deleteTileIndicator(userId, id, tileIndex, {
          indicatorId,
          indicatorKey,
        });
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const { userId: removedUserId, ...rest } = updated;
  void removedUserId;
  return NextResponse.json({ item: rest });
}
