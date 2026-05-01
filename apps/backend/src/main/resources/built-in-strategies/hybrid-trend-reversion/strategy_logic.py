import logging
import pandas as pd
from typing import Dict, List
from ta.trend import EMAIndicator, ADXIndicator
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands, AverageTrueRange

LOGGER = logging.getLogger(__name__)

def prepare_indicators(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Calculates all technical indicators for a single symbol's dataframe."""
    df = df.copy()
    lookback = max(
        config.get('trendSlowPeriod', 50),
        config.get('adxPeriod', 14),
        config.get('bbPeriod', 20),
        config.get('rsiPeriod', 14),
        config.get('atrPeriod', 14)
    )

    if len(df) < lookback + 2:
        return pd.DataFrame()

    # === Indicators (safe: only backward-looking) ===
    df['ema_fast'] = EMAIndicator(df['close'], window=config['trendFastPeriod']).ema_indicator()
    df['ema_slow'] = EMAIndicator(df['close'], window=config['trendSlowPeriod']).ema_indicator()

    adx_ind = ADXIndicator(df['high'], df['low'], df['close'], window=config['adxPeriod'])
    df['adx'] = adx_ind.adx()

    df['rsi'] = RSIIndicator(df['close'], window=config['rsiPeriod']).rsi()

    bb = BollingerBands(df['close'], window=config['bbPeriod'], window_dev=config['bbStdDev'])
    df['bb_hband'] = bb.bollinger_hband()
    df['bb_lband'] = bb.bollinger_lband()

    df['atr'] = AverageTrueRange(
        df['high'], df['low'], df['close'],
        window=config['atrPeriod']
    ).average_true_range()

    required_cols = ['ema_fast', 'ema_slow', 'adx', 'rsi', 'bb_hband', 'bb_lband', 'atr']
    df = df.dropna(subset=required_cols).reset_index(drop=True)
    return df

def emit_trades(bars_by_symbol: Dict[str, pd.DataFrame], config: dict) -> List[dict]:
    """
    Simulates the strategy across multiple symbols using a shared cash balance.
    Fixes look-ahead bias, over-spending, and same-candle re-entry bugs.
    """
    prepared_data = {}
    for symbol, df in bars_by_symbol.items():
        processed_df = prepare_indicators(df, config)
        if not processed_df.empty and len(processed_df) >= 3:
            prepared_data[symbol] = processed_df

    if not prepared_data:
        return []

    events = []
    for symbol, df in prepared_data.items():
        for i in range(1, len(df)):
            row = df.iloc[i]
            prev = df.iloc[i-1]
            prev_prev = df.iloc[i-2] if i > 1 else prev
            events.append({
                'time': int(row['epoch_seconds']),
                'symbol': symbol,
                'row': row,
                'prev': prev,
                'prev_prev': prev_prev
            })

    events.sort(key=lambda x: (x['time'], x['symbol']))

    fee_rate = float(config.get("feeRate", 0.0005))
    slippage = float(config.get("slippage", 0.0005))
    initial_balance = float(config.get('initialBalance', 10000))
    risk_per_trade = float(config.get('riskPerTrade', 1.0)) / 100.0

    cash = initial_balance
    trades = []
    
    symbol_state = {
        symbol: {
            'shares': 0.0,
            'stop_loss': 0.0,
            'highest_price': 0.0,
            'in_position': False,
            'last_price': 0.0
        } for symbol in prepared_data
    }

    for event in events:
        symbol = event['symbol']
        row = event['row']
        prev = event['prev']
        prev_prev = event['prev_prev']
        time = event['time']

        state = symbol_state[symbol]
        open_price = float(row['open'])
        high = float(row['high'])
        low = float(row['low'])
        close_prev = float(prev['close'])
        
        state['last_price'] = open_price

        # Update current equity for risk sizing
        current_equity = cash + sum(
            s_state['shares'] * s_state['last_price'] 
            for s_state in symbol_state.values()
        )

        buy_price = open_price * (1 + slippage)
        sell_price = open_price * (1 - slippage)

        # Signals
        adx_val = float(prev['adx'])
        prev_adx_val = float(prev_prev['adx'])
        adx_threshold = float(config['adxThreshold'])
        adx_rising = adx_val > prev_adx_val

        is_trending_bullish = (prev['ema_fast'] > prev['ema_slow'] and adx_val > adx_threshold and adx_rising)
        is_trending_bearish = (prev['ema_fast'] < prev['ema_slow'] and adx_val > adx_threshold and adx_rising)
        is_flat = adx_val <= adx_threshold
        is_oversold = (prev['rsi'] < config['rsiOversold'] or close_prev < prev['bb_lband'])
        is_overbought = (prev['rsi'] > config['rsiOverbought'] or close_prev > prev['bb_hband'])

        # =========================
        # POSITION MANAGEMENT (EXIT)
        # =========================
        trade_occurred_this_candle = False

        if state['in_position']:
            exit_signal = (is_trending_bearish or (is_flat and is_overbought))
            exited = False
            exit_price = 0.0

            # 1. Check Stop Loss
            if low < state['stop_loss']:
                exit_price = state['stop_loss'] * (1 - slippage)
                exited = True
            
            # 2. Check Signal-based Exit
            elif exit_signal:
                exit_price = sell_price
                exited = True

            if exited:
                proceeds = state['shares'] * exit_price
                fee = proceeds * fee_rate
                cash += (proceeds - fee)
                
                trades.append({
                    "symbol": symbol,
                    "time": time,
                    "amount": -float(state['shares'])
                })
                state['shares'] = 0.0
                state['in_position'] = False
                trade_occurred_this_candle = True
            else:
                # Update trailing stop for FUTURE candles
                state['highest_price'] = max(state['highest_price'], high)
                trailing_stop = state['highest_price'] - (
                    float(prev['atr']) * float(config['atrMultiplier'])
                )
                state['stop_loss'] = max(state['stop_loss'], trailing_stop)

        # =========================
        # ENTRY (Only if not already in position and no exit occurred)
        # =========================
        if not state['in_position'] and not trade_occurred_this_candle:
            long_signal = (
                (is_trending_bullish and close_prev > prev['ema_fast']) or
                (is_flat and is_oversold)
            )

            if long_signal and cash > 0:
                atr = float(prev['atr'])
                stop_dist = atr * float(config['atrMultiplier'])

                if stop_dist > 0:
                    risk_amount = current_equity * risk_per_trade
                    shares_to_buy = risk_amount / stop_dist

                    cost = shares_to_buy * buy_price
                    fee = cost * fee_rate

                    if cost + fee > cash:
                        shares_to_buy = cash / (buy_price * (1 + fee_rate))
                        cost = shares_to_buy * buy_price
                        fee = cost * fee_rate

                    if shares_to_buy > 0:
                        trades.append({
                            "symbol": symbol,
                            "time": time,
                            "amount": float(shares_to_buy)
                        })
                        state['shares'] = shares_to_buy
                        state['in_position'] = True
                        state['highest_price'] = buy_price
                        state['stop_loss'] = buy_price - stop_dist
                        cash -= (cost + fee)
                        
                        # REALISTIC: Check if this new trade gets stopped out in the SAME candle
                        if low < state['stop_loss']:
                            exit_price = state['stop_loss'] * (1 - slippage)
                            proceeds = state['shares'] * exit_price
                            exit_fee = proceeds * fee_rate
                            cash += (proceeds - exit_fee)
                            
                            trades.append({
                                "symbol": symbol,
                                "time": time,
                                "amount": -float(state['shares'])
                            })
                            state['shares'] = 0.0
                            state['in_position'] = False

    return trades
