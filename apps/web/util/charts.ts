import {
  ColorType,
  createChart,
  CrosshairMode,
  IChartApi,
  LineStyle,
} from "lightweight-charts";

export function createSecondaryChart(
  ref: React.RefObject<HTMLDivElement | null>,
  mainChart: IChartApi | null,
  width: number,
  height: number
): IChartApi | null {
  if (!ref.current) return null;
  const chart = createChart(ref.current, {
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
    rightPriceScale: { borderVisible: false },
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
  });
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
