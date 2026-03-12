"use client";

import { IconButton, Sheet, Stack, Typography } from "@mui/joy";
import Table from "@/components/common/Table";
import React, { type ReactNode } from "react";
import { formatLocalDateTime } from "@/util/time";
import EditIcon from "@mui/icons-material/Edit";
import AddVisualization from "./AddVisualization";
import {
  VisualizerHistoryEntry,
  VisualizerParams,
} from "@/util/visualizerTypes";
import { useRouter } from "next/navigation";
import DeleteButton from "../Input/Buttons/DeleteButton";

interface VisualizerHistoryProps {
  hasSheet?: boolean;
  compact?: boolean;
}

const formatStockSymbols = (tiles: VisualizerParams["tiles"]) => {
  if (!tiles?.length) return "No stocks";
  const symbols = tiles.reduce<string[]>((acc, tile, index) => {
    if (index < 3) {
      acc.push(tile.symbol);
    } else if (index === 3) {
      acc.push("...");
    }
    return acc;
  }, []);
  return symbols.join(", ");
};

const VisualizerHistory: React.FC<VisualizerHistoryProps> = ({
  compact = false,
  hasSheet = true,
}) => {
  const [history, setHistory] = React.useState<VisualizerHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    let isActive = true;
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("/api/history", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (isActive) {
          setHistory(Array.isArray(data?.items) ? data.items : []);
        }
      } catch (error) {
        console.error("Failed to load history", error);
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    loadHistory();
    return () => {
      isActive = false;
    };
  }, []);

  const rows = React.useMemo(
    () =>
      history.map((item) => ({
        id: item.id,
        name: item.name,
        createdAt: formatLocalDateTime(item.createdAt),
        updatedAt: formatLocalDateTime(item.updatedAt),
        stocks: formatStockSymbols(item.params.tiles),
      })),
    [history],
  );

  function handleHistoryClick(id: string) {
    router.push(`/visualize/${id}`);
  }
  async function handleHistoryDelete(id: string) {
    try {
      const res = await fetch(`/api/history?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      setHistory((prev) => prev.filter((entry) => entry.id !== id));
    } catch (error) {
      console.error("Failed to delete history entry", error);
    }
  }
  function handleHistoryEdit(id: string) {
    console.log("edit", id);
  }

  const columns = [
    {
      id: "name",
      cell: (row: { name: string }) => row.name,
      header: "Name",
      sortable: true,
    },
    ...(!compact
      ? ([
          {
            id: "createdAt",
            cell: (row: { createdAt: string }) => row.createdAt,
            header: "Created At",
            sortable: true,
          },
          {
            id: "updatedAt",
            cell: (row: { updatedAt: string }) => row.updatedAt,
            header: "Updated At",
            sortable: true,
          },
        ] as const)
      : []),
    {
      id: "stocks",
      cell: (row: { stocks: string }) => row.stocks,
      header: "Stocks",
    },
    {
      id: "actions",
      cell: (row: { id: string }) => (
        <Stack direction="row" justifyContent={"space-between"} paddingX={1}>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              handleHistoryEdit(row.id);
            }}
          >
            <EditIcon
              sx={{
                cursor: "pointer",
                "&:hover": { color: "primary.main" },
              }}
            />
          </IconButton>
          <DeleteButton
            onClick={(e) => {
              e.stopPropagation();
              handleHistoryDelete(row.id);
            }}
          />
        </Stack>
      ),
      header: "Actions",
      minWidth: 100,
      maxWidth: 100,
    },
  ];

  const ConditionalSheet = ({ children }: { children: ReactNode }) => {
    if (hasSheet) {
      return (
        <Sheet
          sx={{
            width: "70%",
            marginTop: "5%",
            padding: "3%",
            borderRadius: 16,
          }}
        >
          {children}
        </Sheet>
      );
    }
    return children;
  };

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <ConditionalSheet>
        <Stack direction={"column"} gap={3}>
          <Typography level="h2">Visualizations</Typography>
          <div style={{ width: "100%" }}>
            <Table
              columns={columns}
              rows={rows}
              resizable
              slotProps={{
                bodyRow: ({ row }) => ({
                  onClick: () => handleHistoryClick(row.id),
                  sx: { cursor: "pointer" },
                  hover: true,
                }),
                tableContainer: { sx: { width: "100%" } },
                headerRow: { sx: { fontWeight: 800 } },
              }}
              resetSpacingButtonPosition={{
                horizontal: "right",
                vertical: "top",
              }}
            />
            {!isLoading && rows.length === 0 && (
              <Typography
                level="body-sm"
                textColor="neutral.500"
                sx={{ marginTop: 2 }}
              >
                No history yet.
              </Typography>
            )}
          </div>
          <div>
            <AddVisualization
              params={{
                name: "Untitled",
                params: {
                  tiles: [],
                },
              }}
            />
          </div>
        </Stack>
      </ConditionalSheet>
    </div>
  );
};

export default VisualizerHistory;
