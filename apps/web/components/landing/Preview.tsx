"use client";

import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import Box from "@mui/joy/Box";
import Chip from "@mui/joy/Chip";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import { cardReveal, sectionReveal, staggerChildren } from "./animations";
import {
  previewCandles,
  previewMarkers,
  previewMetrics,
} from "./data";

const chartWidth = 760;
const chartHeight = 360;
const paddingX = 62;
const paddingTop = 36;
const paddingBottom = 46;
const bodyWidth = 26;

function scalePrice(price: number, min: number, max: number) {
  const usableHeight = chartHeight - paddingTop - paddingBottom;
  return paddingTop + ((max - price) / (max - min)) * usableHeight;
}

function buildClosePath() {
  const highs = previewCandles.map((candle) => candle.high);
  const lows = previewCandles.map((candle) => candle.low);
  const max = Math.max(...highs) + 0.8;
  const min = Math.min(...lows) - 0.8;
  const step = (chartWidth - paddingX * 2) / (previewCandles.length - 1);

  const points = previewCandles.map((candle, index) => {
    const x = paddingX + step * index;
    const y = scalePrice(candle.close, min, max);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });

  return { d: points.join(" "), min, max, step };
}

function ChartGrid() {
  return (
    <>
      {[0, 1, 2, 3].map((value) => {
        const y = paddingTop + value * 78;
        return (
          <line
            key={`h-${value}`}
            x1={paddingX}
            y1={y}
            x2={chartWidth - paddingX}
            y2={y}
            stroke="rgba(148, 163, 184, 0.12)"
            strokeWidth="1"
          />
        );
      })}
      {previewCandles.map((_, index) => {
        const x =
          paddingX +
          ((chartWidth - paddingX * 2) / (previewCandles.length - 1)) * index;
        return (
          <line
            key={`v-${index}`}
            x1={x}
            y1={paddingTop}
            x2={x}
            y2={chartHeight - paddingBottom}
            stroke="rgba(148, 163, 184, 0.08)"
            strokeWidth="1"
          />
        );
      })}
    </>
  );
}

function TradingPreviewChart() {
  const { d, min, max, step } = buildClosePath();

  return (
    <Sheet
      variant="soft"
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "28px",
        border: "1px solid rgba(56, 189, 248, 0.16)",
        background:
          "linear-gradient(180deg, rgba(7, 17, 27, 0.98), rgba(5, 13, 22, 0.88))",
        boxShadow: "0 30px 70px rgba(2, 8, 23, 0.42)",
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1.5}
        sx={{
          px: { xs: 2, md: 2.5 },
          pt: { xs: 2, md: 2.5 },
          pb: 1.5,
          borderBottom: "1px solid rgba(148, 163, 184, 0.1)",
        }}
      >
        <Box>
          <Typography level="title-md">AAPL · 1D</Typography>
          <Typography level="body-sm" sx={{ color: "rgba(226, 232, 240, 0.58)" }}>
            Simplified preview of chart markers and closing path.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="sm" sx={{ bgcolor: "rgba(45, 212, 191, 0.12)", color: "#99f6e4" }}>
            Strategy: MomentumBreakout
          </Chip>
          <Chip size="sm" variant="outlined">
            Run: 365 trading days
          </Chip>
        </Stack>
      </Stack>

      <Box sx={{ px: { xs: 1, md: 2 }, py: 1 }}>
        <Box
          sx={{
            position: "relative",
            width: "100%",
            aspectRatio: `${chartWidth} / ${chartHeight}`,
            minHeight: { xs: 280, md: 360 },
          }}
        >
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: "100%", height: "100%" }}
            aria-label="Trading strategy preview chart"
          >
            <ChartGrid />

            {previewCandles.map((candle, index) => {
              const x = paddingX + step * index;
              const wickTop = scalePrice(candle.high, min, max);
              const wickBottom = scalePrice(candle.low, min, max);
              const bodyTop = scalePrice(Math.max(candle.open, candle.close), min, max);
              const bodyBottom = scalePrice(Math.min(candle.open, candle.close), min, max);
              const isUp = candle.close >= candle.open;
              const fill = isUp ? "rgba(45, 212, 191, 0.95)" : "rgba(248, 113, 113, 0.88)";

              return (
                <motion.g
                  key={`candle-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04, duration: 0.35 }}
                >
                  <line
                    x1={x}
                    y1={wickTop}
                    x2={x}
                    y2={wickBottom}
                    stroke={fill}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <rect
                    x={x - bodyWidth / 2}
                    y={bodyTop}
                    width={bodyWidth}
                    height={Math.max(6, bodyBottom - bodyTop)}
                    rx="6"
                    fill={fill}
                  />
                </motion.g>
              );
            })}

            <motion.path
              d={d}
              fill="none"
              stroke="rgba(96, 165, 250, 0.95)"
              strokeWidth="3"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />

            {previewMarkers.map((marker, index) => {
              const x = paddingX + step * marker.index;
              const y = scalePrice(marker.price, min, max);
              const fill = marker.type === "buy" ? "#2dd4bf" : "#f87171";
              const labelY = marker.type === "buy" ? y - 22 : y + 28;
              const pointerTop = marker.type === "buy";

              return (
                <motion.g
                  key={`${marker.type}-${marker.index}`}
                  initial={{ opacity: 0, scale: 0.72 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.35 + index * 0.2, duration: 0.35 }}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={fill}
                    stroke="rgba(7, 16, 25, 0.95)"
                    strokeWidth="3"
                  />
                  <rect
                    x={x - 26}
                    y={labelY - 10}
                    width="52"
                    height="22"
                    rx="11"
                    fill="rgba(7, 16, 25, 0.95)"
                    stroke={fill}
                    strokeWidth="1.2"
                  />
                  <text
                    x={x}
                    y={labelY + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontFamily="var(--font-mono)"
                    fill={fill}
                  >
                    {marker.label.toUpperCase()}
                  </text>
                  <path
                    d={
                      pointerTop
                        ? `M ${x} ${labelY + 12} L ${x - 5} ${labelY + 19} L ${x + 5} ${labelY + 19} Z`
                        : `M ${x} ${labelY - 10} L ${x - 5} ${labelY - 17} L ${x + 5} ${labelY - 17} Z`
                    }
                    fill="rgba(7, 16, 25, 0.95)"
                    stroke={fill}
                    strokeWidth="1"
                  />
                </motion.g>
              );
            })}
          </svg>

          <Sheet
            variant="soft"
            sx={{
              position: "absolute",
              right: { xs: 14, md: 22 },
              bottom: { xs: 14, md: 18 },
              width: { xs: 168, sm: 200 },
              p: 1.5,
              borderRadius: "18px",
              border: "1px solid rgba(45, 212, 191, 0.16)",
              bgcolor: "rgba(6, 13, 22, 0.92)",
              boxShadow: "0 20px 36px rgba(0, 0, 0, 0.35)",
            }}
          >
            <Stack spacing={1}>
              <Typography level="body-xs" sx={{ color: "rgba(148, 163, 184, 0.8)" }}>
                Strategy output
              </Typography>
              <Typography level="title-sm">
                Trade markers plus closing path
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <ArrowUpwardRoundedIcon sx={{ color: "#86efac", fontSize: 18 }} />
                <Typography level="body-sm" sx={{ color: "#86efac" }}>
                  Long bias confirmed above EMA crossover
                </Typography>
              </Stack>
            </Stack>
          </Sheet>
        </Box>
      </Box>

      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
          borderTop: "1px solid rgba(148, 163, 184, 0.1)",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          {previewMetrics.map((metric) => (
            <Sheet
              key={metric.label}
              variant="outlined"
              sx={{
                borderRadius: "18px",
                p: 1.5,
                borderColor: "rgba(148, 163, 184, 0.14)",
                bgcolor: "rgba(8, 16, 24, 0.45)",
              }}
            >
              <Typography level="body-xs" sx={{ color: "rgba(148, 163, 184, 0.8)" }}>
                {metric.label}
              </Typography>
              <Typography level="title-lg" sx={{ mt: 0.4 }}>
                {metric.value}
              </Typography>
            </Sheet>
          ))}
        </Box>
      </Box>
    </Sheet>
  );
}

export default function Preview() {
  return (
    <Box
      component="section"
      id="preview"
      sx={{
        px: { xs: 2, sm: 3, md: 5 },
        py: { xs: 7, md: 9 },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "1240px", mx: "auto" }}>
        <Stack direction={{ xs: "column", lg: "row" }} spacing={{ xs: 3, lg: 4 }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionReveal}
            style={{ flex: 0.9 }}
          >
            <Stack spacing={1.5} sx={{ maxWidth: "540px" }}>
              <Typography
                level="body-sm"
                sx={{ textTransform: "uppercase", letterSpacing: "0.22em", color: "#7dd3fc" }}
              >
                Interactive preview
              </Typography>
              <Typography level="h2" sx={{ fontSize: { xs: "2rem", md: "2.8rem" } }}>
                Understand the trade path before you trust the strategy.
              </Typography>
              <Typography level="body-lg" sx={{ color: "rgba(226, 232, 240, 0.72)", lineHeight: 1.8 }}>
                The preview keeps the focus on the relationship between price,
                indicators, and execution. You can see whether the strategy
                logic behaved as expected without reading raw logs or tracing
                values by hand.
              </Typography>
            </Stack>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={staggerChildren(0.1)}
            style={{ flex: 1.4 }}
          >
            <motion.div variants={cardReveal}>
              <TradingPreviewChart />
            </motion.div>
          </motion.div>
        </Stack>
      </Box>
    </Box>
  );
}
