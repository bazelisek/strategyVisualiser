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
    Handles multiple symbols with position limits, risk management, and no lookahead.
    """
    prepared_data = {}
    for symbol, df in bars_by_symbol.items():
        processed_df = prepare_indicators(df, config)
        if not processed_df.empty and len(processed_df) >= 3:
            prepared_data[symbol] = processed_df

    if not prepared_data:
        return []

    # Group events by time to process the portfolio collectively at each step
    events_by_time = {}
    for symbol, df in prepared_data.items():
        for i in range(1, len(df)):
            row = df.iloc[i]
            prev = df.iloc[i-1]
            prev_prev = df.iloc[i-2] if i > 1 else prev
            t = int(row['epoch_seconds'])
            if t not in events_by_time:
                events_by_time[t] = []
            events_by_time[t].append({
                'symbol': symbol,
                'row': row,
                'prev': prev,
                'prev_prev': prev_prev
            })

    sorted_times = sorted(events_by_time.keys())

    # Strategy Parameters
    fee_rate = float(config.get("feeRate", 0.0005))
    slippage = float(config.get("slippage", 0.0005))
    initial_balance = float(config.get('initialBalance', 10000))
    risk_per_trade = float(config.get('riskPerTrade', 1.0)) / 100.0
    max_positions = int(config.get('maxPositions', 5))
    max_allocation_pct = float(config.get('maxAllocationPerTrade', 20)) / 100.0

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

    for t in sorted_times:
        current_events = events_by_time[t]
        
        # 1. Update prices and calculate current equity
        for event in current_events:
            symbol = event['symbol']
            symbol_state[symbol]['last_price'] = float(event['row']['open'])

        current_equity = cash + sum(
            s['shares'] * s['last_price'] for s in symbol_state.values()
        )
        
        active_positions = [s for s in symbol_state.values() if s['in_position']]
        num_active = len(active_positions)

        # 2. Process EXITS first (to free up cash and slots)
        exited_this_step = set()
        for event in current_events:
            symbol = event['symbol']
            state = symbol_state[symbol]
            if not state['in_position']:
                continue

            row = event['row']
            prev = event['prev']
            prev_prev = event['prev_prev']
            
            open_price = float(row['open'])
            low = float(row['low'])
            close_prev = float(prev['close'])
            sell_price_signal = open_price * (1 - slippage)

            # Exit Signals
            adx_val = float(prev['adx'])
            prev_adx_val = float(prev_prev['adx'])
            adx_rising = adx_val > prev_adx_val
            adx_threshold = float(config['adxThreshold'])
            
            is_trending_bearish = (prev['ema_fast'] < prev['ema_slow'] and adx_val > adx_threshold and adx_rising)
            is_flat = adx_val <= adx_threshold
            is_overbought = (prev['rsi'] > config['rsiOverbought'] or close_prev > prev['bb_hband'])
            
            exit_signal = (is_trending_bearish or (is_flat and is_overbought))
            
            exited = False
            exit_price = 0.0

            # Check Stop Loss (Intra-candle)
            if low < state['stop_loss']:
                exit_price = state['stop_loss'] * (1 - slippage)
                exited = True
            elif exit_signal:
                exit_price = sell_price_signal
                exited = True

            if exited:
                proceeds = state['shares'] * exit_price
                fee = proceeds * fee_rate
                cash += (proceeds - fee)
                
                trades.append({
                    "symbol": symbol,
                    "time": t,
                    "amount": -float(state['shares'])
                })
                state['shares'] = 0.0
                state['in_position'] = False
                exited_this_step.add(symbol)
                num_active -= 1

            else:
                # Update Trailing Stop for surviving positions
                high = float(row['high'])
                state['highest_price'] = max(state['highest_price'], high)
                trailing_stop = state['highest_price'] - (
                    float(prev['atr']) * float(config['atrMultiplier'])
                )
                state['stop_loss'] = max(state['stop_loss'], trailing_stop)

        # 3. Process ENTRIES
        # Collect candidates
        candidates = []
        for event in current_events:
            symbol = event['symbol']
            state = symbol_state[symbol]
            
            # Skip if already in position or just exited
            if state['in_position'] or symbol in exited_this_step:
                continue

            prev = event['prev']
            prev_prev = event['prev_prev']
            close_prev = float(prev['close'])
            adx_val = float(prev['adx'])
            prev_adx_val = float(prev_prev['adx'])
            adx_threshold = float(config['adxThreshold'])
            adx_rising = adx_val > prev_adx_val
            rsi_val = float(prev['rsi'])

            is_trending_bullish = (prev['ema_fast'] > prev['ema_slow'] and adx_val > adx_threshold and adx_rising)
            is_flat = adx_val <= adx_threshold
            is_oversold = (rsi_val < config['rsiOversold'] or close_prev < prev['bb_lband'])

            long_signal = (
                (is_trending_bullish and close_prev > prev['ema_fast']) or
                (is_flat and is_oversold)
            )

            if long_signal:
                # Signal Strength for ranking
                strength = adx_val if is_trending_bullish else (config['rsiOversold'] - rsi_val + 50)
                candidates.append((symbol, event, strength))

        # Sort candidates by strength (descending)
        candidates.sort(key=lambda x: x[2], reverse=True)

        # Execute ENTRIES up to max_positions
        for symbol, event, strength in candidates:
            if num_active >= max_positions or cash <= 0:
                break
            
            state = symbol_state[symbol]
            row = event['row']
            prev = event['prev']
            open_price = float(row['open'])
            buy_price = open_price * (1 + slippage)
            atr = float(prev['atr'])
            stop_dist = atr * float(config['atrMultiplier'])

            if stop_dist > 0:
                # Risk-based sizing
                risk_amount = current_equity * risk_per_trade
                shares_to_buy = risk_amount / stop_dist
                
                # Allocation-cap sizing
                max_alloc = current_equity * max_allocation_pct
                shares_by_alloc = max_alloc / buy_price
                shares_to_buy = min(shares_to_buy, shares_by_alloc)

                # Cash-availability sizing
                cost = shares_to_buy * buy_price
                fee = cost * fee_rate
                if cost + fee > cash:
                    shares_to_buy = cash / (buy_price * (1 + fee_rate))
                    cost = shares_to_buy * buy_price
                    fee = cost * fee_rate

                if shares_to_buy > 0.01: # Avoid dust
                    trades.append({
                        "symbol": symbol,
                        "time": t,
                        "amount": float(shares_to_buy)
                    })
                    state['shares'] = shares_to_buy
                    state['in_position'] = True
                    state['highest_price'] = buy_price
                    state['stop_loss'] = buy_price - stop_dist
                    cash -= (cost + fee)
                    num_active += 1
                    
                    # Immediate stop-out check (Intra-candle)
                    if float(row['low']) < state['stop_loss']:
                        exit_price = state['stop_loss'] * (1 - slippage)
                        proceeds = state['shares'] * exit_price
                        exit_fee = proceeds * fee_rate
                        cash += (proceeds - exit_fee)
                        trades.append({
                            "symbol": symbol,
                            "time": t,
                            "amount": -float(state['shares'])
                        })
                        state['shares'] = 0.0
                        state['in_position'] = False
                        num_active -= 1

    return trades
