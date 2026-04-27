import { Chip, Stack, Typography } from "@mui/joy";
import { TableCell, TableRow } from "@mui/material";
import {
  EnrichedStrategyPerformance,
  EnrichedTrade,
} from "./StrategyPerformanceOverview";
import { formatLocalDateTime } from "@/util/time";
import CustomAccordion from "../common/CustomAccordion";
import Table from "../common/Table";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import { StrategyPerformance } from "@/util/strategyPerformance/strategyPerformance";

export default function TradeDetails({
  enriched,
  performance,
}: {
  enriched: EnrichedStrategyPerformance;
  performance: StrategyPerformance;
}) {
  return (
    <>
      {enriched ? (
        <CustomAccordion
          summary={
            <Stack direction="row" spacing={1}>
              <Typography level="title-md" sx={{ mt: 2 }}>
                Trades
              </Typography>
              {/* BEST / WORST */}
              {performance.data?.bestTrade && performance.data?.worstTrade && (
                <>
                  <Chip color="success" startDecorator={<TrendingUpIcon />}>
                    Best: {performance.data.bestTrade.result.toFixed(2)}
                  </Chip>

                  <Chip color="danger" startDecorator={<TrendingDownIcon />}>
                    Worst: {performance.data.worstTrade.result.toFixed(2)}
                  </Chip>
                </>
              )}
            </Stack>
          }
        >
          <Table
            columns={[
              {
                id: "buyTime",
                header: "Buy",
                cell: (r: EnrichedTrade) => formatLocalDateTime(r.buyTime),
                sortable: true,
              },
              {
                id: "sellTime",
                header: "Sell",
                cell: (r: EnrichedTrade) =>
                  r.isOpen ? "-" : formatLocalDateTime(r.sellTime),
                sortable: true,
              },
              {
                id: "buy",
                header: "Buy",
                cell: (r: EnrichedTrade) => r.buy.toFixed(2),
                sortable: true,
              },
              {
                id: "sell",
                header: "Sell",
                cell: (r: EnrichedTrade) => r.sell.toFixed(2),
                sortable: true,
              },
              {
                id: "result",
                header: "PnL",
                cell: (r: EnrichedTrade) => r.result.toFixed(2),
                sortable: true,
              },
              {
                id: "pct",
                header: "%",
                cell: (r: EnrichedTrade) => (
                  <Typography color={r.pct >= 0 ? "success" : "danger"}>
                    {r.pct.toFixed(2)}%
                  </Typography>
                ),
                sortable: true,
              },
            ]}
            rows={enriched.trades}
            renderFooter={() => (
              <>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography>
                      <strong>Total</strong>
                    </Typography>
                  </TableCell>
                  <TableCell>{enriched.totalBuyValue.toFixed(2)}</TableCell>
                  <TableCell>{enriched.totalSellValue.toFixed(2)}</TableCell>
                  <TableCell>{enriched.pnl.toFixed(2)}</TableCell>
                  <TableCell>
                    <Typography
                      color={enriched.totalPct >= 0 ? "success" : "danger"}
                    >
                      {enriched.totalPct.toFixed(2)}%
                    </Typography>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography>
                      <strong>Average</strong>
                    </Typography>
                  </TableCell>
                  <TableCell>{enriched.avgBuy.toFixed(2)}</TableCell>
                  <TableCell>{enriched.avgSell.toFixed(2)}</TableCell>
                  <TableCell>{enriched.avgPnL.toFixed(2)}</TableCell>
                  <TableCell>
                    <Typography
                      color={enriched.avgPctFinal >= 0 ? "success" : "danger"}
                    >
                      {enriched.avgPctFinal.toFixed(2)}%
                    </Typography>
                  </TableCell>
                </TableRow>
              </>
            )}
          />
        </CustomAccordion>
      ) : (
        <Typography>No trades found.</Typography>
      )}
    </>
  );
}
