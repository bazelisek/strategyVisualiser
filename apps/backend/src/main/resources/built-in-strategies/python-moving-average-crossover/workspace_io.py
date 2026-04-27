import csv
import json
import logging
import os
from dataclasses import dataclass
from datetime import datetime, time, timezone
from pathlib import Path


LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class BarPoint:
    symbol: str
    epoch_seconds: int
    open: float
    high: float
    low: float
    close: float
    volume: float


def resolve_input_path(env_key: str, fallback: str) -> Path:
    configured_path = os.getenv(env_key, "").strip()
    if configured_path:
        return Path(configured_path)
    return Path(fallback)


def load_config() -> dict:
    config_path = resolve_input_path("STRATEGY_CONFIG_FILE", "config.json")
    LOGGER.debug("Loading config from %s", config_path)
    with config_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def load_bars() -> dict[str, list[BarPoint]]:
    csv_path = resolve_input_path("STRATEGY_STOCK_DATA_FILE", "stock-data.csv")
    LOGGER.debug("Loading stock data from %s", csv_path)
    bars_by_symbol: dict[str, list[BarPoint]] = {}

    with csv_path.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for row_index, row in enumerate(reader, start=1):
            symbol = (row.get("ticker") or "").strip()
            if not symbol:
                LOGGER.debug("Skipping row %s because ticker is blank", row_index)
                continue

            trade_date = datetime.strptime(row["tradeDate"].strip(), "%Y-%m-%d").date()
            trade_time_text = (row.get("tradeTime") or "").strip()
            trade_time = parse_trade_time(trade_time_text)
            trade_datetime = datetime.combine(trade_date, trade_time, tzinfo=timezone.utc)

            bar = BarPoint(
                symbol=symbol,
                epoch_seconds=int(trade_datetime.timestamp()),
                open=float(row["open"]),
                high=float(row["high"]),
                low=float(row["low"]),
                close=float(row["close"]),
                volume=float(row["volume"] or 0.0),
            )
            bars_by_symbol.setdefault(symbol, []).append(bar)

    for symbol, bars in bars_by_symbol.items():
        bars.sort(key=lambda bar: bar.epoch_seconds)
        LOGGER.debug("Loaded %s bars for %s", len(bars), symbol)

    return bars_by_symbol


def parse_trade_time(trade_time_text: str) -> time:
    if not trade_time_text:
        return time.min

    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(trade_time_text, fmt).time()
        except ValueError:
            continue

    raise ValueError(f"Unsupported tradeTime format: {trade_time_text!r}")
