import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  LineStyle,
  TimeChartOptions,
} from "lightweight-charts";

const DEFAULT_RIGHT_PRICE_SCALE_MIN_WIDTH = 64;

export function getBaseChartOptions(
  width: number,
  height: number,
): TimeChartOptions {
  return {
    width,
    height,
    layout: {
      background: { color: "#1e1e2a", type: ColorType.Solid },
      textColor: "#d1d4dc",
      fontSize: 12,
    },
    grid: {
      vertLines: { color: "#2b2b43", style: LineStyle.Solid },
      horzLines: { color: "#2b2b43", style: LineStyle.Solid },
    },
    crosshair: { mode: CrosshairMode.MagnetOHLC },
    rightPriceScale: {
      borderVisible: false,
      minimumWidth: DEFAULT_RIGHT_PRICE_SCALE_MIN_WIDTH,
    },
    timeScale: { borderColor: "#2b2b43", timeVisible: true },
    handleScroll: {
      mouseWheel: false,
      pressedMouseMove: true,
      horzTouchDrag: true,
      vertTouchDrag: false,
    },
    handleScale: {
      mouseWheel: true,
      pinch: true,
      axisPressedMouseMove: {
        time: true,
        price: true,
      },
      axisDoubleClickReset: {
        time: true,
        price: true,
      },
    },
  };
}

export function equalizeRightPriceScaleWidths(charts: IChartApi[]): void {
  if (charts.length === 0) return;

  const maxWidth = Math.max(
    DEFAULT_RIGHT_PRICE_SCALE_MIN_WIDTH,
    ...charts.map((chart) => chart.priceScale("right").width()),
  );

  charts.forEach((chart) => {
    if (chart.priceScale("right").options().minimumWidth !== maxWidth) {
      chart.priceScale("right").applyOptions({ minimumWidth: maxWidth });
    }
  });
}

export function createSecondaryChart(
  ref: React.RefObject<HTMLDivElement | null>,
  mainChart: IChartApi | null,
  width: number,
  height: number
): IChartApi | null {
  if (!ref.current) return null;
  const chart = createChart(ref.current, getBaseChartOptions(width, height));
  if (chart && mainChart) {
    mainChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && chart) chart.timeScale().setVisibleLogicalRange(range);
    });
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range) mainChart.timeScale().setVisibleLogicalRange(range);
    });
  }
  

  return chart;
}
