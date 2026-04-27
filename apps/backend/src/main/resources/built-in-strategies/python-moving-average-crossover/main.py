import json
import logging
import sys

from strategy_logic import emit_trades, read_positive_int
from workspace_io import load_bars, load_config


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.DEBUG,
        format="[python-ma] %(levelname)s %(message)s",
        stream=sys.stdout,
    )


def main() -> None:
    configure_logging()
    logger = logging.getLogger(__name__)

    config = load_config()
    ma_range_1 = read_positive_int(config, "maRange1")
    ma_range_2 = read_positive_int(config, "maRange2")
    slope_lookback = read_positive_int(config, "slopeLookback")
    logger.debug(
        "Resolved config maRange1=%s maRange2=%s slopeLookback=%s",
        ma_range_1,
        ma_range_2,
        slope_lookback,
    )

    bars_by_symbol = load_bars()
    trades: list[dict] = []
    for symbol, bars in bars_by_symbol.items():
        trades.extend(emit_trades(symbol, bars, ma_range_1, ma_range_2, slope_lookback))

    result = {
        "status": "ok",
        "strategy": "Python Moving Average Crossover",
        "runtime": "python",
        "maRange1": ma_range_1,
        "maRange2": ma_range_2,
        "slopeLookback": slope_lookback,
        "tradeCount": len(trades),
        "trades": trades,
    }
    logger.debug("Emitting final result with %s trades", len(trades))
    print(json.dumps(result))


if __name__ == "__main__":
    main()
