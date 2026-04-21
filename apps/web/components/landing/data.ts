import type { SvgIconComponent } from "@mui/icons-material";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import MemoryRoundedIcon from "@mui/icons-material/MemoryRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import QueryStatsRoundedIcon from "@mui/icons-material/QueryStatsRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import TimelineRoundedIcon from "@mui/icons-material/TimelineRounded";

export interface LandingStep {
  icon: SvgIconComponent;
  title: string;
  description: string;
  detail: string;
}

export interface LandingFeature {
  icon: SvgIconComponent;
  title: string;
  description: string;
}

export interface CredibilityItem {
  title: string;
  description: string;
}

export interface PreviewCandle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface PreviewMarker {
  index: number;
  type: "buy" | "sell";
  label: string;
  price: number;
}

export const heroLineValues = [32, 38, 35, 48, 44, 58, 61, 57, 66, 72, 68, 79];

export const landingSteps: LandingStep[] = [
  {
    icon: CodeRoundedIcon,
    title: "Write your strategy",
    description: "Author Java rules for entries, exits, and indicator conditions.",
    detail: "Java-based strategy classes",
  },
  {
    icon: ShieldRoundedIcon,
    title: "Run it in isolation",
    description: "Each execution is launched inside a resource-limited Docker sandbox.",
    detail: "No outbound network access",
  },
  {
    icon: CandlestickChartRoundedIcon,
    title: "Inspect every trade",
    description: "Entries and exits are projected directly onto the chart with markers.",
    detail: "TradingView-style visual workflow",
  },
  {
    icon: AnalyticsRoundedIcon,
    title: "Review the result",
    description: "See return, drawdown, win rate, and trade behavior without leaving the page.",
    detail: "Instant performance metrics",
  },
];

export const landingFeatures: LandingFeature[] = [
  {
    icon: QueryStatsRoundedIcon,
    title: "Chart visualization with buy/sell markers",
    description: "See exactly where a strategy entered and exited instead of reading raw logs.",
  },
  {
    icon: InsightsRoundedIcon,
    title: "Strategy performance analysis",
    description: "Track return, win rate, drawdown, expectancy, and execution-level outcomes.",
  },
  {
    icon: TimelineRoundedIcon,
    title: "Technical indicators",
    description: "Compose runs with indicators such as SMA, EMA, CCI, OBV, and Supertrend.",
  },
  {
    icon: LockRoundedIcon,
    title: "Secure execution",
    description: "Strategies run in Docker sandboxes with explicit memory and CPU limits.",
  },
  {
    icon: PublicRoundedIcon,
    title: "Multi-stock analysis",
    description: "Test the same strategy across different symbols with Yahoo Finance market data.",
  },
  {
    icon: PeopleAltRoundedIcon,
    title: "Public strategy sharing",
    description: "Publish reusable strategies so other users can inspect, compare, and build on them.",
  },
];

export const credibilityItems: CredibilityItem[] = [
  {
    title: "Next.js",
    description: "App Router frontend with typed UI modules and server-backed workflows.",
  },
  {
    title: "Lightweight Charts by TradingView",
    description: "Charting foundations designed for dense financial data and marker overlays.",
  },
  {
    title: "Yahoo Finance API",
    description: "Market candles and symbol data for repeated strategy evaluation.",
  },
  {
    title: "Docker sandbox execution",
    description: "Isolated runs with resource limits and no outbound network connectivity.",
  },
];

export const previewCandles: PreviewCandle[] = [
  { open: 102.4, high: 105.1, low: 101.8, close: 104.5 },
  { open: 104.5, high: 106.9, low: 103.9, close: 106.1 },
  { open: 106.1, high: 107.4, low: 104.8, close: 105.2 },
  { open: 105.2, high: 109.3, low: 104.6, close: 108.7 },
  { open: 108.7, high: 110.6, low: 107.8, close: 109.2 },
  { open: 109.2, high: 112.4, low: 108.9, close: 111.8 },
  { open: 111.8, high: 113.6, low: 110.2, close: 110.9 },
  { open: 110.9, high: 114.8, low: 110.1, close: 114.2 },
  { open: 114.2, high: 115.1, low: 112.7, close: 113.4 },
  { open: 113.4, high: 117.2, low: 112.9, close: 116.3 },
  { open: 116.3, high: 118.6, low: 115.7, close: 117.9 },
  { open: 117.9, high: 118.4, low: 114.6, close: 115.2 },
];

export const previewMarkers: PreviewMarker[] = [
  { index: 2, type: "buy", label: "Buy", price: 105.2 },
  { index: 6, type: "sell", label: "Sell", price: 110.9 },
  { index: 7, type: "buy", label: "Buy", price: 114.2 },
  { index: 11, type: "sell", label: "Sell", price: 115.2 },
];

export const previewMetrics = [
  { label: "Net return", value: "+18.4%" },
  { label: "Win rate", value: "58%" },
  { label: "Max drawdown", value: "-6.1%" },
  { label: "Profit factor", value: "1.74" },
];

export const credibilityNotes = [
  "Strategy containers run without outbound network access.",
  "CPU and memory quotas protect the host from noisy or runaway jobs.",
  "Execution environments stay isolated from the main application runtime.",
];

export const infrastructurePoints = [
  {
    icon: HubRoundedIcon,
    label: "Execution",
    value: "Ephemeral Docker containers",
  },
  {
    icon: MemoryRoundedIcon,
    label: "Controls",
    value: "Pinned resource limits",
  },
  {
    icon: ShieldRoundedIcon,
    label: "Network",
    value: "Disabled during strategy runs",
  },
];
