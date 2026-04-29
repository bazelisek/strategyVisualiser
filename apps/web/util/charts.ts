import {
  ColorType,
  createChart,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  LineStyle,
  TimeChartOptions,
} from "lightweight-charts";

const DEFAULT_RIGHT_PRICE_SCALE_MIN_WIDTH = 64;

export function getBaseChartOptions(
  width: number,
  height: number,
): DeepPartial<TimeChartOptions> {
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

export function equalizeRightPriceScaleWidths(charts: (IChartApi | null)[]): void {
  const validCharts = charts.filter(
    (c): c is IChartApi => !!c
  );

  if (validCharts.length === 0) return;

  const widths = validCharts.map((chart) => {
    try {
      return chart.priceScale("right").width();
    } catch {
      return DEFAULT_RIGHT_PRICE_SCALE_MIN_WIDTH;
    }
  });

  const maxWidth = Math.max(
    DEFAULT_RIGHT_PRICE_SCALE_MIN_WIDTH,
    ...widths
  );

  validCharts.forEach((chart) => {
    try {
      if (chart.priceScale("right").options().minimumWidth !== maxWidth) {
        chart.priceScale("right").applyOptions({ minimumWidth: maxWidth });
      }
    } catch {
      // ignore broken chart
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
