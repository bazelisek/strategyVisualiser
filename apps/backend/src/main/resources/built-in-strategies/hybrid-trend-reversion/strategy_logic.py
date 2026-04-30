import logging
import pandas as pd
from ta.trend import EMAIndicator, ADXIndicator
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands, AverageTrueRange

LOGGER = logging.getLogger(__name__)

def emit_trades(symbol: str, df: pd.DataFrame, config: dict) -> list[dict]:
    lookback = max(
        config.get('trendSlowPeriod', 50),
        config.get('adxPeriod', 14),
        config.get('bbPeriod', 20),
        config.get('rsiPeriod', 14),
        config.get('atrPeriod', 14)
    )

    if len(df) < lookback + 2:
        return []

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

    if len(df) < 3:
        return []

    trades = []

    # === realistic parameters ===
    fee_rate = float(config.get("feeRate", 0.0005))  # 0.05%
    slippage = float(config.get("slippage", 0.0005))  # 0.05%

    initial_balance = float(config.get('initialBalance', 10000))
    cash = initial_balance
    shares = 0.0

    risk_per_trade = float(config.get('riskPerTrade', 1.0)) / 100.0

    in_position = False
    stop_loss = 0.0
    highest_price = 0.0

    # === MAIN LOOP ===
    # i = execution candle
    # i-1 = signal candle
    for i in range(1, len(df)):
        row = df.iloc[i]        # execution candle
        prev = df.iloc[i - 1]   # signal candle

        time = int(row['epoch_seconds'])

        open_price = float(row['open'])
        high = float(row['high'])
        low = float(row['low'])
        close_prev = float(prev['close'])

        # apply slippage to execution price
        buy_price = open_price * (1 + slippage)
        sell_price = open_price * (1 - slippage)

        # === SIGNALS computed ONLY on prev ===
        adx_val = float(prev['adx'])
        prev_adx_val = float(df.iloc[i-2]['adx']) if i > 1 else adx_val

        adx_threshold = float(config['adxThreshold'])
        adx_rising = adx_val > prev_adx_val

        is_trending_bullish = (
            prev['ema_fast'] > prev['ema_slow'] and
            adx_val > adx_threshold and
            adx_rising
        )

        is_trending_bearish = (
            prev['ema_fast'] < prev['ema_slow'] and
            adx_val > adx_threshold and
            adx_rising
        )

        is_flat = adx_val <= adx_threshold

        is_oversold = (
            prev['rsi'] < config['rsiOversold'] or
            close_prev < prev['bb_lband']
        )

        is_overbought = (
            prev['rsi'] > config['rsiOverbought'] or
            close_prev > prev['bb_hband']
        )

        equity = cash + shares * open_price

        # =========================
        # ENTRY
        # =========================
        if not in_position:
            long_signal = (
                (is_trending_bullish and close_prev > prev['ema_fast']) or
                (is_flat and is_oversold)
            )

            if long_signal:
                atr = float(prev['atr'])
                stop_dist = atr * float(config['atrMultiplier'])

                if stop_dist > 0:
                    risk_amount = equity * risk_per_trade
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

                        shares = shares_to_buy
                        cash -= (cost + fee)
                        in_position = True

                        highest_price = buy_price
                        stop_loss = buy_price - stop_dist

        # =========================
        # POSITION MANAGEMENT
        # =========================
        else:
            # update trailing stop using previous ATR
            highest_price = max(highest_price, high)

            trailing_stop = highest_price - (
                float(prev['atr']) * float(config['atrMultiplier'])
            )

            stop_loss = max(stop_loss, trailing_stop)

            exit_signal = (
                is_trending_bearish or
                (is_flat and is_overbought)
            )

            exited = False

            # === INTRABAR STOP (REALISTIC) ===
            if low < stop_loss:
                exit_price = stop_loss * (1 - slippage)
                exited = True
                exit_time = time

            # === NORMAL EXIT (next open) ===
            elif exit_signal:
                exit_price = sell_price
                exited = True
                exit_time = time

            if exited:
                proceeds = shares * exit_price
                fee = proceeds * fee_rate

                trades.append({
                    "symbol": symbol,
                    "time": int(exit_time),
                    "amount": -float(shares)
                })

                cash += (proceeds - fee)
                shares = 0.0
                in_position = False

    return trades