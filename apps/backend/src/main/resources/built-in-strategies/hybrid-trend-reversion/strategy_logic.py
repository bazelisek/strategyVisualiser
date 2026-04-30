import logging
import pandas as pd
from ta.trend import EMAIndicator, ADXIndicator
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands, AverageTrueRange

LOGGER = logging.getLogger(__name__)

def emit_trades(symbol: str, df: pd.DataFrame, config: dict) -> list[dict]:
    # Determine the minimum number of bars needed for all indicators
    lookback = max(
        config.get('trendSlowPeriod', 50),
        config.get('adxPeriod', 14),
        config.get('bbPeriod', 20),
        config.get('rsiPeriod', 14),
        config.get('atrPeriod', 14)
    )
    
    if len(df) < lookback + 1:
        LOGGER.debug("Not enough data for %s: %s bars", symbol, len(df))
        return []

    # Compute Indicators
    try:
        df['ema_fast'] = EMAIndicator(df['close'], window=config['trendFastPeriod']).ema_indicator()
        df['ema_slow'] = EMAIndicator(df['close'], window=config['trendSlowPeriod']).ema_indicator()
        
        adx_ind = ADXIndicator(df['high'], df['low'], df['close'], window=config['adxPeriod'])
        df['adx'] = adx_ind.adx()
        
        df['rsi'] = RSIIndicator(df['close'], window=config['rsiPeriod']).rsi()
        
        bb = BollingerBands(df['close'], window=config['bbPeriod'], window_dev=config['bbStdDev'])
        df['bb_hband'] = bb.bollinger_hband()
        df['bb_lband'] = bb.bollinger_lband()
        
        df['atr'] = AverageTrueRange(df['high'], df['low'], df['close'], window=config['atrPeriod']).average_true_range()
    except Exception as e:
        LOGGER.error("Error computing indicators for %s: %s", symbol, e)
        return []

    trades = []
    in_position = 0  # 0: None, 1: Long
    entry_price = 0.0
    stop_loss = 0.0
    highest_price = 0.0
    
    # We skip rows with NaN in any required indicator.
    required_cols = ['ema_fast', 'ema_slow', 'adx', 'rsi', 'bb_hband', 'bb_lband', 'atr']
    valid_df = df.dropna(subset=required_cols).reset_index(drop=True)
    
    if len(valid_df) < 2:
        LOGGER.debug("No valid data points after computing indicators for %s", symbol)
        return []

    for i in range(1, len(valid_df)):
        row = valid_df.iloc[i]
        prev_row = valid_df.iloc[i-1]
        
        time = int(row['epoch_seconds'])
        close = float(row['close'])
        
        # Strategy Logic State Variables
        adx_val = float(row['adx'])
        prev_adx_val = float(prev_row['adx'])
        adx_threshold = float(config['adxThreshold'])
        adx_rising = adx_val > prev_adx_val
        
        is_trending_bullish = (row['ema_fast'] > row['ema_slow']) and (adx_val > adx_threshold) and adx_rising
        is_trending_bearish = (row['ema_fast'] < row['ema_slow']) and (adx_val > adx_threshold) and adx_rising
        is_flat = adx_val <= adx_threshold
        
        is_oversold = (row['rsi'] < config['rsiOversold']) or (close < row['bb_lband'])
        is_overbought = (row['rsi'] > config['rsiOverbought']) or (close > row['bb_hband'])
        
        if in_position == 0:
            # ENTRY LOGIC
            long_entry_signal = (is_trending_bullish and close > row['ema_fast']) or (is_flat and is_oversold)
            
            if long_entry_signal:
                trades.append({"symbol": symbol, "time": time, "amount": 1})
                in_position = 1
                entry_price = close
                highest_price = close
                stop_loss = entry_price - (float(row['atr']) * float(config['atrMultiplier']))
                LOGGER.debug("BUY %s at %s, close=%.4f, stop=%.4f", symbol, time, close, stop_loss)
        
        elif in_position == 1:
            # MANAGEMENT & EXIT LOGIC
            highest_price = max(highest_price, close)
            current_trailing_stop = highest_price - (float(row['atr']) * float(config['atrMultiplier']))
            stop_loss = max(stop_loss, current_trailing_stop)
            
            exit_signal = (close < stop_loss) or \
                          (is_flat and is_overbought) or \
                          (is_trending_bearish)
            
            if exit_signal:
                trades.append({"symbol": symbol, "time": time, "amount": -1})
                in_position = 0
                reason = "stop_loss" if close < stop_loss else "signal_reversal"
                LOGGER.debug("SELL %s at %s, close=%.4f, reason=%s", symbol, time, close, reason)

    return trades
