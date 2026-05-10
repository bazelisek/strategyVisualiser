import os
import json
import logging
import pandas as pd
from pathlib import Path
from typing import Dict
import yfinance as yf
from datetime import datetime, timedelta

LOGGER = logging.getLogger(__name__)

def resolve_input_path(env_key: str, fallback: str) -> Path:
    configured_path = os.getenv(env_key, "").strip()
    if configured_path:
        return Path(configured_path)
    return Path(fallback)

def load_config() -> dict:
    config_path = resolve_input_path("STRATEGY_CONFIG_FILE", "HybridTrendReversionBacktest/config.json")
    LOGGER.debug("Loading config from %s", config_path)
    with config_path.open("r", encoding="utf-8") as handle:
        return json.load(handle)
    
def load_bars(symbols: list[str], start: datetime | None, end: datetime | None, interval: str) -> Dict[str, pd.DataFrame]:
    start = start if start is not None else datetime.today() - timedelta(days=365)
    end = end if end is not None else datetime.today()

    df = yf.download(
        symbols,
        start=start,
        end=end,
        interval=interval,
        group_by="ticker",
        auto_adjust=True,
        progress=False,
    )
    df = df if df is not None else pd.DataFrame()

    bars_by_symbol = {}

    if isinstance(df.columns, pd.MultiIndex):
        available_symbols = set(df.columns.get_level_values(0))

        for symbol in symbols:
            if symbol not in available_symbols:
                print(f"no symbol {symbol}")
                continue

            group = df.xs(symbol, axis=1, level=0).copy()
            group = group.reset_index()
            group["Date"] = pd.to_datetime(group["Date"]).dt.tz_localize(None)
            group["epoch_seconds"] = group["Date"].astype("datetime64[s]").astype("int64")
            group.columns = [c.lower() for c in group.columns]

            bars_by_symbol[symbol] = group
    else:
        group = df.reset_index()
        group["Date"] = pd.to_datetime(group["Date"]).dt.tz_localize(None)
        group["epoch_seconds"] = group["Date"].astype("datetime64[s]").astype("int64")
        group.columns = [c.lower() for c in group.columns]
        bars_by_symbol[symbols[0]] = group

    return bars_by_symbol
