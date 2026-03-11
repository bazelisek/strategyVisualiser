"use client";

import { TileSearchParam } from "@/util/tilesSearchParams";
import { Sheet, Stack, Typography } from "@mui/joy";
import Table from "@/components/common/Table";
import React, { type ReactNode } from "react";
import { formatLocalDateTime } from "@/util/time";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

interface VisualizerHistoryProps {
  children?: ReactNode;
}

export interface VisualizerHistoryEntry {
  id: string; // uuid from db
  name: string;
  createdAt: number; // unix timestamp
  updatedAt: number;
  params: VisualizerParams;
}

export interface VisualizerParams {
  tiles: TileSearchParam[];
}

const TEMPHistory: VisualizerHistoryEntry[] = [
  {
    id: "c9e6f2f4-5a7e-4e0a-a43c-6d59b88b2b7d",
    name: "Test Strategy Run",
    createdAt: 1773247200,
    updatedAt: 1773247200,
    params: {
      tiles: [
        {
          symbol: "ABNB",
          interval: "1m",
          period1: "1773097200",
          period2: "1773247200",
          strategy: "Second dummy strategy",
        },
      ],
    },
  },
];

const formatStockSymbols = (tiles: TileSearchParam[]) => {
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

const rows = TEMPHistory.map((item) => ({
  id: item.id,
  name: item.name,
  createdAt: formatLocalDateTime(item.createdAt),
  updatedAt: formatLocalDateTime(item.updatedAt),
  stocks: formatStockSymbols(item.params.tiles),
}));

const VisualizerHistory: React.FC<VisualizerHistoryProps> = (props) => {
  function handleHistoryClick(id: string) {
    console.log("redirect", id);
  }
  function handleHistoryDelete(id: string) {
    console.log("delete", id);
  }
  function handleHistoryEdit(id: string) {
    console.log("edit", id);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center" }}>
      <Sheet
        sx={{ width: "70%", marginTop: "5%", padding: "3%", borderRadius: 16 }}
      >
        <Stack direction={"column"} gap={3}>
          <Typography level="h2">History</Typography>
          <div style={{ width: "100%" }}>
            <Table
              columns={[
                {
                  id: "name",
                  cell: (row) => row.name,
                  header: "Name",
                  sortable: true
                },
                {
                  id: "createdAt",
                  cell: (row) => row.createdAt,
                  header: "Created At",
                  sortable: true
                },
                {
                  id: "updatedAt",
                  cell: (row) => row.updatedAt,
                  header: "Updated At",
                  sortable: true
                },
                {
                  id: "stocks",
                  cell: (row) => row.stocks,
                  header: "Stocks",
                  
                },
              ]}
              rows={rows}
              resizable
              
              slotProps={{
                bodyRow: ({ row }) => ({
                  onClick: () => handleHistoryClick(row.id),
                  sx: { cursor: "pointer",  },
                  hover: true
                }),
                tableContainer: { sx: { width: "100%" } },
              }}
              resetSpacingButtonPosition={{
                horizontal: "right",
                vertical: "top",
              }}
            />
          </div>
        </Stack>
      </Sheet>
    </div>
  );
};

export default VisualizerHistory;
