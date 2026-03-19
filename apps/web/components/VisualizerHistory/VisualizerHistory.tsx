"use client";

import { IconButton, Sheet, Stack, Typography } from "@mui/joy";
import Table from "@/components/common/Table";
import React, { type ReactNode } from "react";
import { formatLocalDateTime } from "@/util/time";
import EditIcon from "@mui/icons-material/Edit";
import AddVisualization from "./AddVisualization";
import { VisualizerParams } from "@/util/visualizerTypes";
import { useRouter } from "next/navigation";
import DeleteButton from "../Input/Buttons/DeleteButton";
import { CircularProgress } from "@mui/material";
import { useHistory } from "@/hooks/useHistory";

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
  const { history, isLoading, error } = useHistory();
  const [deletedIds, setDeletedIds] = React.useState<Set<string>>(new Set());
  const router = useRouter();

  const visibleHistory = React.useMemo(
    () => history.filter((entry) => !deletedIds.has(entry.id)),
    [history, deletedIds],
  );

  const rows = React.useMemo(
    () =>
      visibleHistory.map((item) => ({
        id: item.id,
        name: item.name,
        createdAt: formatLocalDateTime(item.createdAt),
        updatedAt: formatLocalDateTime(item.updatedAt),
        stocks: formatStockSymbols(item.params.tiles),
      })),
    [visibleHistory],
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
      setDeletedIds((prev) => new Set(prev).add(id));
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
        <Stack
          direction="row"
          justifyContent={"center"}
          alignItems={"center"}
          gap={0.5}
          width={"100%"}
          flexWrap="nowrap"
        >
          <IconButton
            size="sm"
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
      minWidth: 120,
      defaultWidth: 120,
      maxWidth: 120,
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
        <Stack direction={"column"} gap={3} width={"100%"}>
          <Typography level="h2" textAlign={"center"}>
            Visualizations
          </Typography>
          <div style={{ width: "100%" }}>
            {isLoading && <CircularProgress />}
            {!isLoading && error && (
              <Typography level="body-sm" textColor="danger.500">
                {error}
              </Typography>
            )}
            {!isLoading && !error && (
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
            )}
            {!isLoading && !error && rows.length === 0 && (
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
