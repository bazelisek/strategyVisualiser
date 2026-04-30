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
    
    # Capital management state
    initial_balance = float(config.get('initialBalance', 10000))
    cash = initial_balance
    shares = 0.0
    risk_per_trade = float(config.get('riskPerTrade', 1.0)) / 100.0
    
    in_position = False
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
        
        current_equity = cash + (shares * close)
        
        if not in_position:
            # ENTRY LOGIC
            long_entry_signal = (is_trending_bullish and close > row['ema_fast']) or (is_flat and is_oversold)
            
            if long_entry_signal:
                # Calculate Position Size based on Risk Management
                # Risk Amount = Equity * Risk %
                # Stop Distance = close - stop_loss (initial stop is ATR based)
                atr_val = float(row['atr'])
                stop_dist = atr_val * float(config['atrMultiplier'])
                
                if stop_dist > 0:
                    risk_amount = current_equity * risk_per_trade
                    # Amount of shares to buy = Risk Amount / Stop Distance
                    shares_to_buy = risk_amount / stop_dist
                    
                    # Ensure we have enough cash (No Margin)
                    cost = shares_to_buy * close
                    if cost > cash:
                        shares_to_buy = cash / close
                        cost = shares_to_buy * close
                    
                    if shares_to_buy > 0:
                        trades.append({"symbol": symbol, "time": time, "amount": float(shares_to_buy)})
                        shares = shares_to_buy
                        cash -= cost
                        in_position = True
                        entry_price = close
                        highest_price = close
                        stop_loss = entry_price - stop_dist
                        LOGGER.debug("BUY %s: amount=%.4f, price=%.4f, cash=%.2f", symbol, shares, close, cash)
        
        elif in_position:
            # MANAGEMENT & EXIT LOGIC
            highest_price = max(highest_price, close)
            current_trailing_stop = highest_price - (float(row['atr']) * float(config['atrMultiplier']))
            stop_loss = max(stop_loss, current_trailing_stop)
            
            exit_signal = (close < stop_loss) or \
                          (is_flat and is_overbought) or \
                          (is_trending_bearish)
            
            if exit_signal:
                # Sell everything
                trades.append({"symbol": symbol, "time": time, "amount": -float(shares)})
                cash += shares * close
                LOGGER.debug("SELL %s: amount=%.4f, price=%.4f, cash=%.2f", symbol, shares, close, cash)
                shares = 0.0
                in_position = False

    return trades
