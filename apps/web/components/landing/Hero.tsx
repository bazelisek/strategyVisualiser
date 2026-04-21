"use client";

import ArrowOutwardRoundedIcon from "@mui/icons-material/ArrowOutwardRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import Box from "@mui/joy/Box";
import Button from "@mui/joy/Button";
import Chip from "@mui/joy/Chip";
import Divider from "@mui/joy/Divider";
import Link from "@mui/joy/Link";
import Sheet from "@mui/joy/Sheet";
import Stack from "@mui/joy/Stack";
import Typography from "@mui/joy/Typography";
import { motion } from "framer-motion";
import NextLink from "next/link";
import { sectionReveal, softFade, staggerChildren } from "./animations";
import { heroLineValues } from "./data";

const signalMarkers = [
  { index: 2, label: "BUY", color: "#2dd4bf" },
  { index: 5, label: "SELL", color: "#f87171" },
  { index: 8, label: "BUY", color: "#2dd4bf" },
  { index: 10, label: "SELL", color: "#f87171" },
];

function buildPath(values: number[]) {
  return values
    .map((value, index) => {
      const x = 6 + (index / (values.length - 1)) * 88;
      const y = 92 - value;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function HeroChartBackdrop() {
  const path = buildPath(heroLineValues);

  return (
    <Box
      aria-hidden="true"
      sx={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 18% 18%, rgba(34, 197, 214, 0.18), transparent 30%), radial-gradient(circle at 82% 22%, rgba(59, 130, 246, 0.18), transparent 30%), linear-gradient(180deg, rgba(7, 18, 28, 0.2), rgba(7, 18, 28, 0.88))",
        }}
      />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {[14, 30, 46, 62, 78].map((value) => (
          <line
            key={`h-${value}`}
            x1="0"
            y1={value}
            x2="100"
            y2={value}
            stroke="rgba(148, 163, 184, 0.13)"
            strokeWidth="0.2"
          />
        ))}
        {[10, 24, 38, 52, 66, 80, 94].map((value) => (
          <line
            key={`v-${value}`}
            x1={value}
            y1="0"
            x2={value}
            y2="100"
            stroke="rgba(148, 163, 184, 0.08)"
            strokeWidth="0.2"
          />
        ))}
        {heroLineValues.map((value, index) => {
          const x = 6 + (index / (heroLineValues.length - 1)) * 88;
          const barHeight = Math.max(10, value - 16);
          return (
            <rect
              key={`bar-${x}`}
              x={x - 1.5}
              y={100 - barHeight}
              width="3"
              height={barHeight}
              rx="1.2"
              fill="rgba(34, 197, 214, 0.08)"
            />
          );
        })}
        <motion.path
          d={path}
          fill="none"
          stroke="url(#hero-line)"
          strokeWidth="1.2"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: 1, opacity: [0.35, 0.8, 0.35] }}
          transition={{ duration: 4.6, repeat: Infinity, repeatType: "loop" }}
        />
        {signalMarkers.map((marker, markerIndex) => {
          const x = 6 + (marker.index / (heroLineValues.length - 1)) * 88;
          const y = 92 - heroLineValues[marker.index];
          return (
            <motion.g
              key={marker.label + marker.index}
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{
                opacity: [0.15, 1, 0.4],
                scale: [0.9, 1.18, 0.95],
              }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                delay: markerIndex * 0.35,
              }}
            >
              <circle
                cx={x}
                cy={y}
                r="1.5"
                fill={marker.color}
                stroke="rgba(4, 10, 18, 0.9)"
                strokeWidth="0.45"
              />
            </motion.g>
          );
        })}
        <defs>
          <linearGradient id="hero-line" x1="0%" x2="100%" y1="0%" y2="0%">
            <stop offset="0%" stopColor="rgba(45, 212, 191, 0.15)" />
            <stop offset="55%" stopColor="#37d0d6" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
    </Box>
  );
}

export default function Hero() {
  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        overflow: "hidden",
        px: { xs: 2, sm: 3, md: 5 },
        pt: { xs: 6, md: 8 },
        pb: { xs: 8, md: 10 },
      }}
    >
      <HeroChartBackdrop />
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "1240px",
          mx: "auto",
        }}
      >
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerChildren(0.14, 0.12)}
        >
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 4, lg: 5 }}
            alignItems="stretch"
          >
            <motion.div variants={sectionReveal} style={{ flex: 1.25 }}>
              <Stack spacing={2.5} sx={{ maxWidth: "680px" }}>
                <motion.div variants={softFade}>
                  <Chip
                    size="lg"
                    variant="soft"
                    sx={{
                      width: "fit-content",
                      borderRadius: "999px",
                      bgcolor: "rgba(34, 197, 214, 0.12)",
                      color: "#9be8f0",
                      border: "1px solid rgba(52, 211, 153, 0.14)",
                    }}
                  >
                    Strategy research workspace
                  </Chip>
                </motion.div>
                <Typography
                  level="h1"
                  sx={{
                    fontSize: { xs: "2.6rem", sm: "3.4rem", md: "4.5rem" },
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                    maxWidth: "11ch",
                  }}
                >
                  Design. Test. Understand your trading strategies.
                </Typography>
                <Typography
                  level="body-lg"
                  sx={{
                    maxWidth: "58ch",
                    color: "rgba(226, 232, 240, 0.74)",
                    lineHeight: 1.8,
                    fontSize: { xs: "1rem", md: "1.06rem" },
                  }}
                >
                  Define Java-based strategies, run them in isolated execution
                  environments, project buy and sell markers directly on the
                  chart, and inspect performance metrics immediately after each
                  run.
                </Typography>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  <Chip variant="outlined" sx={{ borderRadius: "999px" }}>
                    Java strategy logic
                  </Chip>
                  <Chip variant="outlined" sx={{ borderRadius: "999px" }}>
                    Chart-level trade markers
                  </Chip>
                  <Chip variant="outlined" sx={{ borderRadius: "999px" }}>
                    Instant performance review
                  </Chip>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    component={NextLink}
                    href="/login"
                    size="lg"
                    endDecorator={<ArrowOutwardRoundedIcon />}
                    sx={{
                      px: 2.5,
                      py: 1.2,
                      fontSize: "1rem",
                      bgcolor: "#2dd4bf",
                      color: "#051218",
                      "&:hover": {
                        bgcolor: "#5eead4",
                      },
                    }}
                  >
                    Start analyzing
                  </Button>
                  <Button
                    component={NextLink}
                    href="/strategies"
                    size="lg"
                    variant="outlined"
                    sx={{
                      px: 2.5,
                      py: 1.2,
                      borderColor: "rgba(96, 165, 250, 0.45)",
                      color: "#d6f5ff",
                      "&:hover": {
                        borderColor: "rgba(96, 165, 250, 0.8)",
                        bgcolor: "rgba(96, 165, 250, 0.08)",
                      },
                    }}
                  >
                    Explore public strategies
                  </Button>
                </Stack>
                <Typography level="body-sm" sx={{ color: "rgba(191, 219, 254, 0.72)" }}>
                  Public strategies are available after sign-in.{" "}
                  <Link
                    component={NextLink}
                    href="/login"
                    underline="always"
                    sx={{ color: "#8be7ff" }}
                  >
                    Sign in
                  </Link>{" "}
                  to open the workspace.
                </Typography>
              </Stack>
            </motion.div>

            <motion.div variants={sectionReveal} style={{ flex: 1 }}>
              <Sheet
                variant="soft"
                sx={{
                  height: "100%",
                  minHeight: 420,
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "28px",
                  border: "1px solid rgba(56, 189, 248, 0.18)",
                  background:
                    "linear-gradient(180deg, rgba(8, 17, 27, 0.96), rgba(7, 16, 24, 0.85))",
                  boxShadow:
                    "0 30px 80px rgba(2, 8, 23, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                  p: { xs: 2.5, md: 3 },
                }}
              >
                <Stack spacing={2.5}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography level="title-md">Execution snapshot</Typography>
                      <Typography
                        level="body-sm"
                        sx={{ color: "rgba(226, 232, 240, 0.56)" }}
                      >
                        One strategy run, charted and scored.
                      </Typography>
                    </Box>
                    <Chip
                      size="sm"
                      startDecorator={<LoginRoundedIcon />}
                      sx={{
                        bgcolor: "rgba(34, 197, 214, 0.1)",
                        color: "#9be8f0",
                      }}
                    >
                      Sandbox ready
                    </Chip>
                  </Stack>

                  <Sheet
                    variant="outlined"
                    sx={{
                      borderRadius: "22px",
                      borderColor: "rgba(56, 189, 248, 0.18)",
                      background:
                        "linear-gradient(180deg, rgba(9, 18, 28, 0.9), rgba(8, 18, 26, 0.65))",
                      p: 2,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" justifyContent="space-between">
                        <Box>
                          <Typography level="title-sm">MomentumBreakout.java</Typography>
                          <Typography
                            level="body-xs"
                            sx={{ color: "rgba(226, 232, 240, 0.56)" }}
                          >
                            AAPL · 1D · 12 months
                          </Typography>
                        </Box>
                        <Typography
                          level="title-sm"
                          sx={{ color: "#86efac", fontFamily: "var(--font-mono)" }}
                        >
                          +18.4%
                        </Typography>
                      </Stack>
                      <Box
                        sx={{
                          position: "relative",
                          height: 180,
                          borderRadius: "18px",
                          overflow: "hidden",
                          bgcolor: "rgba(15, 23, 42, 0.72)",
                          border: "1px solid rgba(148, 163, 184, 0.08)",
                        }}
                      >
                        <HeroChartBackdrop />
                      </Box>
                      <Divider sx={{ borderColor: "rgba(148, 163, 184, 0.12)" }} />
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        divider={
                          <Divider
                            orientation="vertical"
                            sx={{ borderColor: "rgba(148, 163, 184, 0.12)" }}
                          />
                        }
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography level="body-xs" sx={{ color: "rgba(148, 163, 184, 0.8)" }}>
                            Output
                          </Typography>
                          <Typography level="title-sm">
                            Buy/sell markers on chart
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography level="body-xs" sx={{ color: "rgba(148, 163, 184, 0.8)" }}>
                            Analysis
                          </Typography>
                          <Typography level="title-sm">
                            Win rate, drawdown, expectancy
                          </Typography>
                        </Box>
                      </Stack>
                    </Stack>
                  </Sheet>
                </Stack>
              </Sheet>
            </motion.div>
          </Stack>
        </motion.div>
      </Box>
    </Box>
  );
}
