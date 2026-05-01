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

def get_valid_price(raw_price: float, slippage: float, is_buy: bool, low: float, high: float) -> float:
    if is_buy:
        price = raw_price * (1 + slippage)
    else:
        price = raw_price * (1 - slippage)
    
    clamped_price = max(low, min(high, price))
    if abs(clamped_price - price) > 1e-9:
        LOGGER.debug("Price %.8f clamped to %.8f (low: %.8f, high: %.8f)", price, clamped_price, low, high)
    
    return clamped_price

def emit_trades(bars_by_symbol: Dict[str, pd.DataFrame], config: dict) -> List[dict]:
    """
    Simulates the strategy across multiple symbols using a shared cash balance.
    Sells/Buys on signal happen at the open of the current candle.
    Stop losses are checked after signal-based executions.
    """

    prepared_data = {}
    for symbol, df in bars_by_symbol.items():
        processed_df = prepare_indicators(df, config)
        if not processed_df.empty and len(processed_df) >= 3:
            prepared_data[symbol] = processed_df

    if not prepared_data:
        return []

    # === Build event timeline ===
    events_by_time = {}
    for symbol, df in prepared_data.items():
        for i in range(1, len(df)):
            row = df.iloc[i]
            prev = df.iloc[i - 1]
            prev_prev = df.iloc[i - 2] if i > 1 else prev
            t = int(row['epoch_seconds'])

            events_by_time.setdefault(t, []).append({
                "symbol": symbol,
                "row": row,
                "prev": prev,
                "prev_prev": prev_prev
            })

    sorted_times = sorted(events_by_time.keys())

    # === Config ===
    fee_rate = float(config.get("feeRate", 0.0005))
    slippage = float(config.get("slippage", 0.0005))
    initial_balance = float(config.get('initialBalance', 10000))

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

    # === MAIN LOOP ===
    for t in sorted_times:
        current_events = events_by_time[t]

        # --- Update prices ---
        for event in current_events:
            symbol = event['symbol']
            symbol_state[symbol]['last_price'] = float(event['row']['open'])

        # --- Build decision input ---
        market_data = {
            e["symbol"]: {
                "row": e["row"],
                "prev": e["prev"],
                "prev_prev": e["prev_prev"]
            }
            for e in current_events
        }

        portfolio_state = {
            "cash": cash,
            "positions": symbol_state
        }

        # === DECISION ENGINE (Signals from prev candles) ===
        actions = decide_actions(market_data, config, portfolio_state)

        # Track which exited via signal (at open)
        exited_at_open = set()

        # === 1. EXECUTE SIGNAL-BASED SELLS (AT OPEN) ===
        for event in current_events:
            symbol = event['symbol']
            action = actions.get(symbol, {"action": "HOLD", "amount": 0.0})
            state = symbol_state[symbol]

            if action["action"] != "SELL" or not state['in_position']:
                continue

            row = event['row']
            low = float(row['low'])
            high = float(row['high'])
            open_price = float(row['open'])

            exit_price = get_valid_price(open_price, slippage, False, low, high)
            proceeds = state['shares'] * exit_price
            fee = proceeds * fee_rate

            cash += (proceeds - fee)
            trades.append({
                "symbol": symbol,
                "time": t,
                "amount": -float(state['shares']),
                "price": float(exit_price)
            })

            state['shares'] = 0.0
            state['in_position'] = False
            exited_at_open.add(symbol)

        # === 2. EXECUTE SIGNAL-BASED BUYS (AT OPEN) ===
        for event in current_events:
            symbol = event['symbol']
            action = actions.get(symbol, {"action": "HOLD", "amount": 0.0})
            state = symbol_state[symbol]

            if action["action"] != "BUY" or state['in_position'] or symbol in exited_at_open:
                continue

            shares_to_buy = float(action["amount"])
            if shares_to_buy <= 0:
                continue

            row = event['row']
            prev = event['prev']
            low = float(row['low'])
            high = float(row['high'])
            open_price = float(row['open'])

            buy_price = get_valid_price(open_price, slippage, True, low, high)
            cost = shares_to_buy * buy_price
            fee = cost * fee_rate

            # Cash constraint
            if cost + fee > cash:
                shares_to_buy = cash / (buy_price * (1 + fee_rate))
                cost = shares_to_buy * buy_price
                fee = cost * fee_rate

            if shares_to_buy <= 0.01:
                continue

            trades.append({
                "symbol": symbol,
                "time": t,
                "amount": float(shares_to_buy),
                "price": float(buy_price)
            })

            state['shares'] = shares_to_buy
            state['in_position'] = True
            state['highest_price'] = buy_price
            atr = float(prev['atr'])
            stop_dist = atr * float(config['atrMultiplier'])
            state['stop_loss'] = buy_price - stop_dist
            cash -= (cost + fee)

        # === 3. CHECK STOP LOSSES (INTRADAY) ===
        # Note: This includes positions opened at open of THIS candle.
        for event in current_events:
            symbol = event['symbol']
            state = symbol_state[symbol]

            if not state['in_position'] or symbol in exited_at_open:
                continue

            row = event['row']
            low = float(row['low'])
            high = float(row['high'])
            open_price = float(row['open'])

            if low < state['stop_loss']:
                # Stop loss hit intraday
                raw_exit_price = min(open_price, state['stop_loss'])
                exit_price = get_valid_price(raw_exit_price, slippage, False, low, high)
                
                proceeds = state['shares'] * exit_price
                exit_fee = proceeds * fee_rate

                cash += (proceeds - exit_fee)
                trades.append({
                    "symbol": symbol,
                    "time": t,
                    "amount": -float(state['shares']),
                    "price": float(exit_price)
                })

                state['shares'] = 0.0
                state['in_position'] = False

        # === 4. UPDATE TRAILING STOPS (for survivors) ===
        for event in current_events:
            symbol = event['symbol']
            state = symbol_state[symbol]

            if not state['in_position']:
                continue

            row = event['row']
            prev = event['prev']

            high = float(row['high'])
            state['highest_price'] = max(state['highest_price'], high)

            trailing_stop = state['highest_price'] - (
                float(prev['atr']) * float(config['atrMultiplier'])
            )

            state['stop_loss'] = max(state['stop_loss'], trailing_stop)

    return trades

def check_exit_signal(prev, prev_prev, config) -> bool:
    adx_val = float(prev['adx'])
    prev_adx_val = float(prev_prev['adx'])
    adx_rising = adx_val > prev_adx_val
    adx_threshold = float(config['adxThreshold'])

    is_trending_bearish = (
        prev['ema_fast'] < prev['ema_slow'] and
        adx_val > adx_threshold and
        adx_rising
    )

    is_flat = adx_val <= adx_threshold
    is_overbought = (
        prev['rsi'] > config['rsiOverbought'] or
        float(prev['close']) > prev['bb_hband']
    )

    return is_trending_bearish or (is_flat and is_overbought)

def check_entry_signal(prev, prev_prev, config) -> tuple[bool, float]:
    close_prev = float(prev['close'])
    adx_val = float(prev['adx'])
    prev_adx_val = float(prev_prev['adx'])
    adx_threshold = float(config['adxThreshold'])
    adx_rising = adx_val > prev_adx_val
    rsi_val = float(prev['rsi'])

    is_trending_bullish = (
        prev['ema_fast'] > prev['ema_slow'] and
        adx_val > adx_threshold and
        adx_rising
    )

    is_flat = adx_val <= adx_threshold
    is_oversold = (
        rsi_val < config['rsiOversold'] or
        close_prev < prev['bb_lband']
    )

    long_signal = (
        (is_trending_bullish and close_prev > prev['ema_fast']) or
        (is_flat and is_oversold)
    )

    if not long_signal:
        return False, 0.0

    strength = (
        adx_val if is_trending_bullish
        else (config['rsiOversold'] - rsi_val + 50)
    )

    return True, strength

def calculate_position_size(
    current_equity,
    cash,
    buy_price,
    atr,
    config
):
    risk_per_trade = float(config.get('riskPerTrade', 1.0)) / 100.0
    max_allocation_pct = float(config.get('maxAllocationPerTrade', 20)) / 100.0
    fee_rate = float(config.get("feeRate", 0.0005))

    stop_dist = atr * float(config['atrMultiplier'])
    if stop_dist <= 0:
        return 0.0

    risk_amount = current_equity * risk_per_trade
    shares = risk_amount / stop_dist

    max_alloc = current_equity * max_allocation_pct
    shares = min(shares, max_alloc / buy_price)

    cost = shares * buy_price
    fee = cost * fee_rate

    if cost + fee > cash:
        shares = cash / (buy_price * (1 + fee_rate))

    return shares if shares > 0.01 else 0.0

def decide_actions(
    market_data: Dict[str, dict],
    config: dict,
    portfolio_state: dict
) -> Dict[str, dict]:
    """
    Production-ready decision engine.
    """

    fee_rate = float(config.get("feeRate", 0.0005))
    slippage = float(config.get("slippage", 0.0005))
    max_positions = int(config.get('maxPositions', 5))

    cash = portfolio_state["cash"]
    positions = portfolio_state["positions"]

    # === Equity ===
    equity = cash + sum(
        s['shares'] * s['last_price']
        for s in positions.values()
    )

    active = sum(1 for s in positions.values() if s['in_position'])

    actions = {}
    exited = set()

    # ===== EXITS =====
    for symbol, data in market_data.items():
        state = positions[symbol]

        if not state['in_position']:
            continue

        row, prev, prev_prev = data["row"], data["prev"], data["prev_prev"]

        open_price = float(row['open'])
        low = float(row['low'])
        high = float(row['high'])

        exit_signal = check_exit_signal(prev, prev_prev, config)

        exit_price = None

        if low < state['stop_loss']:
            raw_exit_price = min(open_price, state['stop_loss'])
            exit_price = get_valid_price(raw_exit_price, slippage, False, low, high)
        elif exit_signal:
            exit_price = get_valid_price(open_price, slippage, False, low, high)

        if exit_price:
            actions[symbol] = {
                "action": "SELL",
                "amount": state['shares']
            }
            exited.add(symbol)
            active -= 1
        else:
            actions[symbol] = {"action": "HOLD", "amount": 0.0}

    # ===== ENTRIES =====
    candidates = []

    for symbol, data in market_data.items():
        state = positions[symbol]

        if state['in_position'] or symbol in exited:
            continue

        prev, prev_prev = data["prev"], data["prev_prev"]

        ok, strength = check_entry_signal(prev, prev_prev, config)

        if ok:
            candidates.append((symbol, data, strength))

    candidates.sort(key=lambda x: x[2], reverse=True)

    for symbol, data, _ in candidates:
        if active >= max_positions or cash <= 0:
            break

        row = data["row"]
        prev = data["prev"]

        buy_price = float(row['open']) * (1 + slippage)
        atr = float(prev['atr'])

        shares = calculate_position_size(
            equity, cash, buy_price, atr, config
        )

        if shares > 0:
            actions[symbol] = {
                "action": "BUY",
                "amount": shares
            }
            active += 1
        else:
            actions.setdefault(symbol, {"action": "HOLD", "amount": 0.0})

    # Fill missing
    for symbol in market_data:
        actions.setdefault(symbol, {"action": "HOLD", "amount": 0.0})

    return actions
