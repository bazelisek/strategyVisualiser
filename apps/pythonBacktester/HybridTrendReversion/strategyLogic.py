from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Any

import pandas as pd
from ta.trend import EMAIndicator, ADXIndicator
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands, AverageTrueRange

LOGGER = logging.getLogger(__name__)


# =========================
# State objects
# =========================

@dataclass
class PositionState:
    shares: float = 0.0
    stop_loss: float = 0.0
    highest_price: float = 0.0
    in_position: bool = False
    last_price: float = 0.0

    def to_snapshot(self) -> dict:
        return {
            "shares": float(self.shares),
            "stop_loss": float(self.stop_loss),
            "highest_price": float(self.highest_price),
            "in_position": bool(self.in_position),
            "last_price": float(self.last_price),
        }


@dataclass
class StrategyState:
    cash: float
    positions: Dict[str, PositionState] = field(default_factory=dict)

    def to_portfolio_snapshot(self) -> dict:
        return {
            "cash": float(self.cash),
            "positions": {symbol: pos.to_snapshot() for symbol, pos in self.positions.items()},
        }


# =========================
# Indicators
# =========================

def prepare_indicators(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """Calculates all technical indicators for a single symbol's dataframe."""
    df = df.copy()

    if "epoch_seconds" not in df.columns:
        raise ValueError("Input dataframe must contain 'epoch_seconds'.")

    df = df.sort_values("epoch_seconds").reset_index(drop=True)

    lookback = max(
        config.get("trendSlowPeriod", 50),
        config.get("adxPeriod", 14),
        config.get("bbPeriod", 20),
        config.get("rsiPeriod", 14),
        config.get("atrPeriod", 14),
    )
    
    #print("RAW LEN:", len(df))
    #print(df[["close","high","low"]].head())

    if len(df) < lookback:
        return pd.DataFrame()

    # Safe: backward-looking only
    df["ema_fast"] = EMAIndicator(df["close"], window=config["trendFastPeriod"]).ema_indicator()
    df["ema_slow"] = EMAIndicator(df["close"], window=config["trendSlowPeriod"]).ema_indicator()

    adx_ind = ADXIndicator(df["high"], df["low"], df["close"], window=config["adxPeriod"])
    df["adx"] = adx_ind.adx()

    df["rsi"] = RSIIndicator(df["close"], window=config["rsiPeriod"]).rsi()

    bb = BollingerBands(df["close"], window=config["bbPeriod"], window_dev=config["bbStdDev"])
    df["bb_hband"] = bb.bollinger_hband()
    df["bb_lband"] = bb.bollinger_lband()

    df["atr"] = AverageTrueRange(
        df["high"], df["low"], df["close"], window=config["atrPeriod"]
    ).average_true_range()

    required_cols = ["ema_fast", "ema_slow", "adx", "rsi", "bb_hband", "bb_lband", "atr"]
    #print("NaNs before drop:")
    #print(df[["ema_fast","ema_slow","adx","rsi","bb_hband","bb_lband","atr"]].isna().sum())

    
    df = df.dropna(subset=required_cols).reset_index(drop=True)

    #print("AFTER DROP:", len(df))
    return df


# =========================
# Signals
# =========================

def check_exit_signal(prev, prev_prev, config) -> bool:
    adx_val = float(prev["adx"])
    prev_adx_val = float(prev_prev["adx"])
    adx_rising = adx_val > prev_adx_val
    adx_threshold = float(config["adxThreshold"])

    is_trending_bearish = (
        prev["ema_fast"] < prev["ema_slow"]
        and adx_val > adx_threshold
        and adx_rising
    )

    is_flat = adx_val <= adx_threshold
    is_overbought = (
        prev["rsi"] > config["rsiOverbought"]
        or float(prev["close"]) > prev["bb_hband"]
    )

    return is_trending_bearish or (is_flat and is_overbought)


def check_entry_signal(prev, prev_prev, config) -> tuple[bool, float]:
    close_prev = float(prev["close"])
    adx_val = float(prev["adx"])
    prev_adx_val = float(prev_prev["adx"])
    adx_threshold = float(config["adxThreshold"])
    adx_rising = adx_val > prev_adx_val
    rsi_val = float(prev["rsi"])

    is_trending_bullish = (
        prev["ema_fast"] > prev["ema_slow"]
        and adx_val > adx_threshold
        and adx_rising
    )

    is_flat = adx_val <= adx_threshold
    is_oversold = (
        rsi_val < config["rsiOversold"]
        or close_prev < prev["bb_lband"]
    )

    long_signal = (
        (is_trending_bullish and close_prev > prev["ema_fast"])
        or (is_flat and is_oversold)
    )

    if not long_signal:
        return False, 0.0

    strength = (
        adx_val if is_trending_bullish
        else (config["rsiOversold"] - rsi_val + 50)
    )

    return True, strength


def calculate_position_size(
    current_equity: float,
    cash: float,
    buy_price: float,
    atr: float,
    config: dict,
) -> float:
    risk_per_trade = float(config.get("riskPerTrade", 1.0)) / 100.0
    max_allocation_pct = float(config.get("maxAllocationPerTrade", 20)) / 100.0
    fee_rate = float(config.get("feeRate", config.get("fees", 0.0)))

    stop_dist = atr * float(config["atrMultiplier"])
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


# =========================
# Decision engine
# =========================

def get_signals(
    candles_by_symbol: Dict[str, pd.DataFrame],
    execution_opens: Dict[str, float],
    portfolio_state: Dict[str, Any],
    config: Dict[str, Any],
) -> Dict[str, dict]:
    """
    Core signal generation logic for external execution.
    Calculates technical indicators on the fly and returns signals.

    candles_by_symbol: Dict of historical dataframes (UP TO Day N-1)
    execution_opens: Dict of Open prices for Day N
    portfolio_state:
        {
            "cash": float,
            "positions": {
                symbol: {
                    "shares": float,
                    "in_position": bool,
                    "stop_loss": float,
                    "highest_price": float,
                    "last_price": float
                }
            }
        }

    Returns:
        {
            symbol: {
                "signal": "BUY" | "SELL" | "HOLD",
                "shares": float,
                "trailing_stop_atr_multiplier": float (info for external handler)
            }
        }
    """
    max_positions = int(config.get("maxPositions", 5))
    cash = float(portfolio_state["cash"])
    positions = portfolio_state["positions"]

    # Current equity for position sizing
    equity = cash + sum(
        float(s["shares"]) * float(s["last_price"])
        for s in positions.values()
        if float(s["shares"]) > 0
    )

    active_count = sum(1 for s in positions.values() if s["in_position"])
    signals: Dict[str, dict] = {}

    # Support both 'feeRate' and 'fees' for consistency
    fee_rate = float(config.get("feeRate", config.get("fees", 0.0)))

    # Pre-process all symbols
    market_data = {}
    for symbol, df in candles_by_symbol.items():
        if df.empty:
            continue
            
        execution_open = execution_opens.get(symbol)
        if execution_open is None:
            continue
        
        # Calculate indicators on historical data
        # Ensure no lookahead and consistent signals whether at Open or Close.
        processed_df = prepare_indicators(df, config)
        
        if not processed_df.empty:
            market_data[symbol] = {
                "open": execution_open, # Day N Open (where trade happens)
                "prev": processed_df.iloc[-1], # Day N-1 (Signals ready)
                "prev_prev": processed_df.iloc[-2] if len(processed_df) >= 2 else processed_df.iloc[-1],
            }


    # 1. Check Exits first
    exited_symbols = set()
    for symbol, data in market_data.items():
        state = positions.get(symbol, {"in_position": False, "shares": 0.0, "stop_loss": float("inf")})
        if not state["in_position"]:
            continue

        prev = data["prev"]
        prev_prev = data["prev_prev"]
        open_price = data["open"]

        exit_signal = check_exit_signal(prev, prev_prev, config)
        stop_hit_at_open = open_price < float(state.get("stop_loss", float("inf")))

        if exit_signal or stop_hit_at_open:
            signals[symbol] = {
                "signal": "SELL",
                "shares": float(state["shares"]),
                "trailing_stop_atr_multiplier": float(config["atrMultiplier"]),
                "atr": float(prev["atr"]),
                "prev_high": float(prev["high"]),
            }
            exited_symbols.add(symbol)
            active_count -= 1
        else:
            signals[symbol] = {
                "signal": "HOLD",
                "shares": 0.0,
                "trailing_stop_atr_multiplier": float(config["atrMultiplier"]),
                "atr": float(prev["atr"]),
                "prev_high": float(prev["high"]),
            }

    # 2. Check Entries second
    candidates: List[tuple[str, float]] = []
    for symbol, data in market_data.items():
        state = positions.get(symbol, {"in_position": False})
        if state["in_position"] or symbol in exited_symbols:
            continue

        prev = data["prev"]
        prev_prev = data["prev_prev"]

        ok, strength = check_entry_signal(prev, prev_prev, config)
        if ok:
            candidates.append((symbol, strength))

    # Prioritize by signal strength
    candidates.sort(key=lambda x: x[1], reverse=True)

    available_cash = cash
    for symbol, _ in candidates:
        if active_count >= max_positions or available_cash <= 0:
            break

        data = market_data[symbol]
        open_price = data["open"]
        prev = data["prev"]
        
        # Match emit_trades: Use the open of the execution bar for sizing, including slippage
        slippage = float(config.get("slippage", 0.0001))
        buy_price = float(open_price) * (1 + slippage)
        atr = float(prev["atr"])

        shares = calculate_position_size(
            equity,
            available_cash,
            buy_price,
            atr,
            config
        )

        if shares > 0.01:
            signals[symbol] = {
                "signal": "BUY",
                "shares": float(shares),
                "trailing_stop_atr_multiplier": float(config["atrMultiplier"]),
                "atr": atr,
                "prev_high": float(prev["high"]),
            }
            active_count += 1
            # Simple cash reservation for next symbol sizing
            available_cash -= (shares * buy_price * (1 + fee_rate))

    # 3. Fill the rest with HOLD
    for symbol in market_data:
        if symbol not in signals:
            signals[symbol] = {
                "signal": "HOLD",
                "shares": 0.0,
                "trailing_stop_atr_multiplier": float(config["atrMultiplier"]),
            }

    return signals


def decide_actions(
    market_data: Dict[str, dict],
    config: Dict[str, Any],
    portfolio_state: Dict[str, Any],
) -> Dict[str, dict]:
    """
    Decision layer only. No fills here.

    market_data:
        {
            symbol: {
                "row": current_row,
                "prev": prev_row,
                "prev_prev": prev_prev_row
            }
        }

    portfolio_state:
        {
            "cash": float,
            "positions": {
                symbol: {
                    "shares": float,
                    "in_position": bool,
                    "stop_loss": float,
                    "highest_price": float,
                    "last_price": float
                }
            }
        }
    """
    slippage = float(config.get("slippage", 0.0001))
    max_positions = int(config.get("maxPositions", 5))
    fee_rate = float(config.get("feeRate", config.get("fees", 0.0)))

    cash = float(portfolio_state["cash"])
    positions = portfolio_state["positions"]

    equity = cash + sum(
        float(s["shares"]) * float(s["last_price"])
        for s in positions.values()
    )

    active = sum(1 for s in positions.values() if s["in_position"])

    actions: Dict[str, dict] = {}
    exited = set()

    # Exits first
    for symbol, data in market_data.items():
        state = positions.get(symbol)
        if not state or not state["in_position"]:
            continue

        row = data["row"]
        prev = data["prev"]
        prev_prev = data["prev_prev"]

        open_price = float(row["open"])
        
        # Only Signal Exit or Gap-down Stop Loss is known at Open
        exit_signal = check_exit_signal(prev, prev_prev, config)
        stop_hit_at_open = open_price < float(state["stop_loss"])

        if exit_signal or stop_hit_at_open:
            actions[symbol] = {
                "action": "SELL",
                "amount": float(state["shares"]),
            }
            exited.add(symbol)
            active -= 1
        else:
            actions[symbol] = {"action": "HOLD", "amount": 0.0}

    # Entries second
    candidates: List[tuple[str, dict, float]] = []

    for symbol, data in market_data.items():
        state = positions[symbol]

        if state["in_position"] or symbol in exited:
            continue

        prev = data["prev"]
        prev_prev = data["prev_prev"]

        ok, strength = check_entry_signal(prev, prev_prev, config)
        if ok:
            candidates.append((symbol, data, strength))

    candidates.sort(key=lambda x: x[2], reverse=True)

    available_cash = cash

    for symbol, data, _ in candidates:
        if active >= max_positions or available_cash <= 0:
            break

        row = data["row"]
        prev = data["prev"]

        buy_price = float(row["open"]) * (1 + slippage)
        atr = float(prev["atr"])

        shares = calculate_position_size(
            equity,
            available_cash,
            buy_price,
            atr,
            config
        )

        if shares > 0:
            estimated_cost = shares * buy_price
            estimated_fee = estimated_cost * fee_rate

            total_cost = estimated_cost + estimated_fee

            if total_cost > available_cash:
                shares = available_cash / (buy_price * (1 + fee_rate))
                total_cost = shares * buy_price * (1 + fee_rate)

            if shares > 0:
                actions[symbol] = {
                    "action": "BUY",
                    "amount": float(shares),
                }

                available_cash -= total_cost   # <-- reserve cash
                active += 1
            else:
                actions.setdefault(symbol, {"action": "HOLD", "amount": 0.0})
                actions.setdefault(symbol, {"action": "HOLD", "amount": 0.0})

    for symbol in market_data:
        actions.setdefault(symbol, {"action": "HOLD", "amount": 0.0})

    return actions


# =========================
# Strategy engine
# =========================

class ProductionStrategy:
    """
    Single strategy core for both:
    - historical backtests
    - live bar-by-bar execution

    This keeps the trading logic identical in both modes.
    """

    def __init__(self, config: dict):
        self.config = dict(config)
        self.reset()

    def reset(self, initial_balance: float | None = None) -> None:
        cash = initial_balance
        if cash is None:
            cash = float(self.config.get("initialBalance", 10000.0))

        self.state = StrategyState(cash=float(cash), positions={})

    def _ensure_symbol_state(self, symbol: str) -> PositionState:
        if symbol not in self.state.positions:
            self.state.positions[symbol] = PositionState()
        return self.state.positions[symbol]

    def _build_event_timeline(
        self, bars_by_symbol: Dict[str, pd.DataFrame]
    ) -> Dict[int, List[dict]]:
        prepared_data: Dict[str, pd.DataFrame] = {}

        for symbol, df in bars_by_symbol.items():
            processed_df = prepare_indicators(df, self.config)
            if not processed_df.empty and len(processed_df) >= 3:
                prepared_data[symbol] = processed_df

        if not prepared_data:
            return {}

        # Make sure every symbol exists in state.
        for symbol in prepared_data:
            self._ensure_symbol_state(symbol)

        events_by_time: Dict[int, List[dict]] = {}
        for symbol, df in prepared_data.items():
            for i in range(1, len(df)):
                row = df.iloc[i]
                prev = df.iloc[i - 1]
                prev_prev = df.iloc[i - 2] if i > 1 else prev
                t = int(row["epoch_seconds"])

                events_by_time.setdefault(t, []).append(
                    {
                        "symbol": symbol,
                        "row": row,
                        "prev": prev,
                        "prev_prev": prev_prev,
                    }
                )

        return events_by_time

    def step(self, current_events: List[dict]) -> List[dict]:
        """
        Executes one timestamp group of events and mutates internal state.

        current_events format:
        [
            {
                "symbol": str,
                "row": current_row,
                "prev": prev_row,
                "prev_prev": prev_prev_row
            },
            ...
        ]
        """
        trades: List[dict] = []

        # Update live prices first.
        for event in current_events:
            symbol = event["symbol"]
            state = self._ensure_symbol_state(symbol)
            state.last_price = float(event["row"]["open"])

        market_data = {
            e["symbol"]: {
                "row": e["row"],
                "prev": e["prev"],
                "prev_prev": e["prev_prev"],
            }
            for e in current_events
        }

        portfolio_state = self.state.to_portfolio_snapshot()
        actions = decide_actions(market_data, self.config, portfolio_state)

        exited_this_step = set()
        fee_rate = float(self.config.get("feeRate", self.config.get("fees", 0.0)))
        slippage = float(self.config.get("slippage", 0.0001))

        # Sells first
        for event in current_events:
            symbol = event["symbol"]
            action = actions.get(symbol, {"action": "HOLD", "amount": 0.0})
            state = self._ensure_symbol_state(symbol)

            if not state.in_position:
                continue

            row = event["row"]
            open_price = float(row["open"])
            low = float(row["low"])
            high = float(row["high"])

            exit_price = None
            if open_price < state.stop_loss:
                # Gap down below stop loss - exit at open
                exit_price = open_price * (1 - slippage)
            elif low < state.stop_loss:
                # Hit stop loss during the bar
                exit_price = state.stop_loss * (1 - slippage)
            elif action["action"] == "SELL":
                # Exit signal (from previous bar)
                exit_price = open_price * (1 - slippage)

            if exit_price is None:
                continue

            # Clamp price to [low, high]
            exit_price = max(low, min(high, exit_price))

            proceeds = state.shares * exit_price
            fee = proceeds * fee_rate

            self.state.cash += (proceeds - fee)

            trades.append(
                {
                    "symbol": symbol,
                    "time": int(row["epoch_seconds"]),
                    "amount": -float(state.shares),
                    "price": float(exit_price),
                }
            )

            state.shares = 0.0
            state.in_position = False
            exited_this_step.add(symbol)

        # Trailing stops for survivors
        for event in current_events:
            symbol = event["symbol"]
            state = self._ensure_symbol_state(symbol)

            if not state.in_position or symbol in exited_this_step:
                continue

            row = event["row"]
            prev = event["prev"]

            high = float(prev["high"])
            state.highest_price = max(state.highest_price, high)

            trailing_stop = state.highest_price - (
                float(prev["atr"]) * float(self.config["atrMultiplier"])
            )
            state.stop_loss = max(state.stop_loss, trailing_stop)

        # Buys last
        for event in current_events:
            symbol = event["symbol"]
            action = actions.get(symbol, {"action": "HOLD", "amount": 0.0})
            state = self._ensure_symbol_state(symbol)

            if action["action"] != "BUY" or state.in_position or symbol in exited_this_step:
                continue

            shares_to_buy = float(action["amount"])
            if shares_to_buy <= 0:
                continue

            row = event["row"]
            prev = event["prev"]
            low = float(row["low"])
            high = float(row["high"])

            buy_price = float(row["open"]) * (1 + slippage)
            # Clamp price to [low, high]
            buy_price = max(low, min(high, buy_price))

            cost = shares_to_buy * buy_price
            fee = cost * fee_rate

            if cost + fee > self.state.cash:
                shares_to_buy = self.state.cash / (buy_price * (1 + fee_rate))
                cost = shares_to_buy * buy_price
                fee = cost * fee_rate

            if shares_to_buy <= 0.01:
                continue

            trades.append(
                {
                    "symbol": symbol,
                    "time": int(row["epoch_seconds"]),
                    "amount": float(shares_to_buy),
                    "price": float(buy_price),
                }
            )

            state.shares = float(shares_to_buy)
            state.in_position = True
            state.highest_price = buy_price
            state.stop_loss = buy_price - (float(prev["atr"]) * float(self.config["atrMultiplier"]))

            self.state.cash -= (cost + fee)

        # Update last price for all positions to the close of the current bar
        for event in current_events:
            symbol = event["symbol"]
            state = self._ensure_symbol_state(symbol)
            if state.in_position:
                state.last_price = float(event["row"]["close"])

            # Removing for realism
            """
            # Immediate stop-out on the entry bar, same as your original logic
            if float(row["low"]) < state.stop_loss:
                exit_price = state.stop_loss * (1 - slippage)
                proceeds = state.shares * exit_price
                exit_fee = proceeds * fee_rate

                self.state.cash += (proceeds - exit_fee)

                trades.append(
                    {
                        "symbol": symbol,
                        "time": int(row["epoch_seconds"]),
                        "amount": -float(state.shares),
                    }
                )

                state.shares = 0.0
                state.in_position = False"""

        return trades

    def emit_trades(self, bars_by_symbol: Dict[str, pd.DataFrame]) -> List[dict]:
        """
        Full historical run. This resets the strategy state first.
        """
        self.reset(initial_balance=float(self.config.get("initialBalance", 10000.0)))

        events_by_time = self._build_event_timeline(bars_by_symbol)
        if not events_by_time:
            return []

        trades: List[dict] = []
        for t in sorted(events_by_time.keys()):
            current_events = events_by_time[t]
            step_trades = self.step(current_events)
            trades.extend(step_trades)

        return trades

    def snapshot(self) -> dict:
        """
        Useful for persistence between live sessions.
        """
        return {
            "cash": float(self.state.cash),
            "positions": {
                symbol: {
                    "shares": float(pos.shares),
                    "stop_loss": float(pos.stop_loss),
                    "highest_price": float(pos.highest_price),
                    "in_position": bool(pos.in_position),
                    "last_price": float(pos.last_price),
                }
                for symbol, pos in self.state.positions.items()
            },
        }

    def load_snapshot(self, snapshot: dict) -> None:
        self.state.cash = float(snapshot.get("cash", self.state.cash))
        positions = snapshot.get("positions", {})

        restored: Dict[str, PositionState] = {}
        for symbol, data in positions.items():
            restored[symbol] = PositionState(
                shares=float(data.get("shares", 0.0)),
                stop_loss=float(data.get("stop_loss", 0.0)),
                highest_price=float(data.get("highest_price", 0.0)),
                in_position=bool(data.get("in_position", False)),
                last_price=float(data.get("last_price", 0.0)),
            )

        self.state.positions = restored


# =========================
# Compatibility wrapper
# =========================

def emit_trades(bars_by_symbol: Dict[str, pd.DataFrame], config: dict) -> List[dict]:
    """
    Backwards-compatible wrapper.
    """
    strategy = ProductionStrategy(config)
    return strategy.emit_trades(bars_by_symbol)