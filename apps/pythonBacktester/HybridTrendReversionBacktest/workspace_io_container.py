import os
import json
import logging
import pandas as pd
from pathlib import Path
from typing import Dict

LOGGER = logging.getLogger(__name__)

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

def load_bars() -> Dict[str, pd.DataFrame]:
    csv_path = resolve_input_path("STRATEGY_STOCK_DATA_FILE", "stock-data.csv")
    LOGGER.debug("Loading stock data from %s", csv_path)
    
    # Read CSV using pandas
    df = pd.read_csv(csv_path)
    
    # Ensure column names are as expected (lowercase or mapping)
    # Expected: ticker, tradeDate, tradeTime, open, high, low, close, volume
    # Some files might have different casing, let's normalize
    df.columns = [c.strip() for c in df.columns]
    
    bars_by_symbol = {}
    for symbol, group in df.groupby('ticker'):
        # Sort by date and time
        group = group.sort_values(['tradeDate', 'tradeTime'])
        
        # Create a combined datetime column for timestamp calculation
        # tradeDate: YYYY-MM-DD, tradeTime: HH:MM:SS or HH:MM
        group['datetime'] = pd.to_datetime(group['tradeDate'] + ' ' + group['tradeTime'].fillna('00:00:00'))
        group['epoch_seconds'] = (group['datetime'] - pd.Timestamp("1970-01-01")) // pd.Timedelta('1s')
        
        # Ensure numeric columns
        for col in ['open', 'high', 'low', 'close', 'volume']:
            group[col] = pd.to_numeric(group[col], errors='coerce')
        
        bars_by_symbol[str(symbol)] = group.reset_index(drop=True)
        LOGGER.debug("Loaded %s bars for %s", len(group), symbol)
        
    return bars_by_symbol
