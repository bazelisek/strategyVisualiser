from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Any
import pandas as pd
import numpy as np

LOGGER = logging.getLogger(__name__)


# ==========================================
# State Objects
# ==========================================

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


# ==========================================
# Indicators & Cycle Processing
# ==========================================

def prepare_indicators(df: pd.DataFrame, config: dict) -> pd.DataFrame:
    """
    Calculates technical and cycle-detection indicators for a single symbol's DataFrame.
    """
    df = df.copy()

    if "epoch_seconds" not in df.columns:
        raise ValueError("Input dataframe must contain 'epoch_seconds'.")

    df = df.sort_values("epoch_seconds").reset_index(drop=True)

    # 1. Determine safe historical lookback length based on indicators
    lookback = max(
        config.get("cycleLookbackPeriod", 60),
        0
    )

    if len(df) < lookback:
        return pd.DataFrame()

    # Data is cleaned and sorted; cycle fitting is done dynamically in get_signals.
    return df


# ==========================================
# Decision Engine (get_signals)
# ==========================================

def get_signals(
    candles_by_symbol: Dict[str, pd.DataFrame],
    execution_opens: Dict[str, float],
    portfolio_state: Dict[str, Any],
    config: Dict[str, Any],
) -> Dict[str, dict]:
    """
    Fits a linear trend + sine wave to recent historical prices to determine if
    each symbol is at the top (SELL) or bottom (BUY) of its dominant cycle.

    Arguments:
        candles_by_symbol: Dict of symbol name -> historical pandas DataFrame containing price data.
        execution_opens: Dict of symbol name -> open price of the current execution bar.
        portfolio_state: Current portfolio snapshot (cash and active positions).
        config: Optional configuration dictionary.

    Returns:
        signals: Dict of symbol -> signal details:
            {
                symbol: {
                    "signal": "BUY" | "SELL" | "HOLD",
                    "shares": float,
                    "trailing_stop_atr_multiplier": float,
                    "atr": float (used for trailing stop distance),
                    "prev_high": float (used for trailing stop reference)
                }
            }
    """
    signals: Dict[str, dict] = {}
    
    # Extract config parameters
    lookback = int(config.get("cycleLookbackPeriod", 60))
    min_period = int(config.get("minCyclePeriod", 10))
    max_period = int(config.get("maxCyclePeriod", 45))
    atr_multiplier = float(config.get("atrMultiplier", 2.5))
    max_positions = int(config.get("maxPositions", 5))
    
    cash = float(portfolio_state["cash"])
    positions = portfolio_state["positions"]
    
    # Calculate current equity for position sizing
    equity = cash + sum(
        float(pos["shares"]) * float(pos["last_price"])
        for pos in positions.values()
        if float(pos["shares"]) > 0
    )
    
    active_count = sum(1 for pos in positions.values() if pos.get("in_position", False))
    fee_rate = float(config.get("feeRate", config.get("fees", 0.0)))
    slippage = float(config.get("slippage", 0.0001))
    
    market_signals = {}
    
    for symbol, df in candles_by_symbol.items():
        if df.empty:
            continue
            
        execution_open = execution_opens.get(symbol)
        if execution_open is None:
            continue
            
        # Ensure chronological sorting and clean data
        df_sorted = df.dropna(subset=["close"]).sort_values("epoch_seconds") if "epoch_seconds" in df.columns else df.dropna(subset=["close"])
        
        closes = df_sorted["close"].tail(lookback).values
        if len(closes) < lookback:
            continue
            
        n = len(closes)
        t = np.arange(n)
        
        try:
            # 1. Linear detrending: Fit y_trend = m * t + c
            A_matrix = np.vstack([t, np.ones(n)]).T
            m, c = np.linalg.lstsq(A_matrix, closes, rcond=None)[0]
            detrended = closes - (m * t + c)
            
            # 2. Grid search for dominant cycle period
            best_rss = float("inf")
            best_params = (0.0, 0.0, 0.0)  # Amplitude, omega, phi
            
            # Search within candidate periods
            periods = np.arange(min_period, min(max_period + 1, n // 2))
            if len(periods) == 0:
                continue
                
            for T in periods:
                omega = 2 * np.pi / T
                # Fit detrended = a * sin(omega * t) + b * cos(omega * t)
                X = np.vstack([np.sin(omega * t), np.cos(omega * t)]).T
                a, b = np.linalg.lstsq(X, detrended, rcond=None)[0]
                fit = a * np.sin(omega * t) + b * np.cos(omega * t)
                rss = np.sum((detrended - fit) ** 2)
                if rss < best_rss:
                    best_rss = rss
                    amp = np.sqrt(a**2 + b**2)
                    phi = np.arctan2(b, a)
                    best_params = (amp, omega, phi)
                    
            amp, omega, phi = best_params
            
            if amp > 0:
                t_end = n - 1
                val_at_end = amp * np.sin(omega * t_end + phi)
                val_norm = val_at_end / amp  # Normalized cycle position between [-1, 1]
                
                # Cycle rate of change (derivative)
                deriv_at_end = amp * omega * np.cos(omega * t_end + phi)
                
                # Bottom of cycle: value is low/oversold (negative) and rising (derivative > 0)
                is_bottom = (val_norm < -0.5) and (deriv_at_end > 0)
                # Top of cycle: value is high/overbought (positive) and falling (derivative < 0)
                is_top = (val_norm > 0.5) and (deriv_at_end < 0)
                
                # Volatility estimation (standard deviation of cycle residuals as ATR replacement)
                residual_std = np.std(detrended)
                volatility = max(residual_std, execution_open * 0.01)  # Floor at 1% of price
                
                market_signals[symbol] = {
                    "is_bottom": is_bottom,
                    "is_top": is_top,
                    "strength": -val_norm,  # Higher value represents deeper bottom/stronger BUY
                    "volatility": volatility,
                    "prev_high": float(df_sorted["high"].iloc[-1])
                }
        except Exception as e:
            LOGGER.warning(f"Error fitting cycle for {symbol}: {e}")
            continue

    # 1. Check Exits first
    exited_symbols = set()
    for symbol, state in positions.items():
        if not state.get("in_position", False):
            continue
            
        # Default HOLD
        signals[symbol] = {
            "signal": "HOLD",
            "shares": 0.0,
            "trailing_stop_atr_multiplier": atr_multiplier,
            "atr": execution_opens.get(symbol, 0.0) * 0.02,
            "prev_high": execution_opens.get(symbol, 0.0)
        }
        
        info = market_signals.get(symbol)
        if info is not None:
            signals[symbol]["atr"] = info["volatility"]
            signals[symbol]["prev_high"] = info["prev_high"]
            
            if info["is_top"]:
                signals[symbol] = {
                    "signal": "SELL",
                    "shares": float(state["shares"]),
                    "trailing_stop_atr_multiplier": atr_multiplier,
                    "atr": info["volatility"],
                    "prev_high": info["prev_high"]
                }
                exited_symbols.add(symbol)
                active_count -= 1

    # 2. Check Entries second
    candidates = []
    for symbol, info in market_signals.items():
        state = positions.get(symbol, {"in_position": False})
        if state.get("in_position", False) or symbol in exited_symbols:
            continue
            
        if info["is_bottom"]:
            candidates.append((symbol, info))
            
    # Prioritize candidates: deepest trough (most oversold) first
    candidates.sort(key=lambda x: x[1]["strength"], reverse=True)
    
    available_cash = cash
    for symbol, info in candidates:
        if active_count >= max_positions or available_cash <= 0:
            break
            
        open_price = execution_opens[symbol]
        buy_price = open_price * (1 + slippage)
        volatility = info["volatility"]
        
        # Sizing using risk and capital limits
        risk_per_trade = float(config.get("riskPerTrade", 20.0)) / 100.0
        max_allocation_pct = float(config.get("maxAllocationPerTrade", 20.0)) / 100.0
        
        stop_dist = volatility * atr_multiplier
        if stop_dist <= 0:
            continue
            
        risk_amount = equity * risk_per_trade
        shares = risk_amount / stop_dist
        
        max_alloc = equity * max_allocation_pct
        shares = min(shares, max_alloc / buy_price)
        
        cost = shares * buy_price
        fee = cost * fee_rate
        if cost + fee > available_cash:
            shares = available_cash / (buy_price * (1 + fee_rate))
            
        if shares > 0.01:
            signals[symbol] = {
                "signal": "BUY",
                "shares": float(shares),
                "trailing_stop_atr_multiplier": atr_multiplier,
                "atr": volatility,
                "prev_high": info["prev_high"]
            }
            active_count += 1
            available_cash -= (shares * buy_price * (1 + fee_rate))
            
    # 3. Fill remaining symbols with HOLD
    for symbol in execution_opens:
        if symbol not in signals:
            signals[symbol] = {
                "signal": "HOLD",
                "shares": 0.0,
                "trailing_stop_atr_multiplier": atr_multiplier,
            }
            
    return signals


# ==========================================
# Strategy Engine
# ==========================================

class CycleDetectionStrategy:
    """
    Execution strategy class for cycle detection logic.
    Handles historical backtests and live bar-by-bar execution.
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

    def snapshot(self) -> dict:
        """
        Returns a snapshot of the current state.
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
        """
        Loads a state snapshot.
        """
        self.state.cash = float(snapshot.get("cash", self.state.cash))
        positions = snapshot.get("positions", {})

        restored: Dict[str, PositionState] = {}
        for symbol, pos_data in positions.items():
            restored[symbol] = PositionState(
                shares=float(pos_data.get("shares", 0.0)),
                stop_loss=float(pos_data.get("stop_loss", 0.0)),
                highest_price=float(pos_data.get("highest_price", 0.0)),
                in_position=bool(pos_data.get("in_position", False)),
                last_price=float(pos_data.get("last_price", 0.0)),
            )
        self.state.positions = restored

    def emit_trades(self, bars_by_symbol: Dict[str, pd.DataFrame]) -> List[dict]:
        """
        Runs a full historical backtest and returns a list of trades.
        """
        self.reset(initial_balance=float(self.config.get("initialBalance", 10000.0)))

        # Build timeline of events
        prepared_data = {}
        for symbol, df in bars_by_symbol.items():
            processed_df = prepare_indicators(df, self.config)
            if not processed_df.empty:
                prepared_data[symbol] = processed_df

        if not prepared_data:
            return []

        # Get all unique timestamps
        timestamps = sorted(list(set(
            t for df in prepared_data.values() for t in df["epoch_seconds"].astype(int)
        )))

        trades: List[dict] = []
        fee_rate = float(self.config.get("feeRate", self.config.get("fees", 0.0)))
        slippage = float(self.config.get("slippage", 0.0001))

        for t in timestamps:
            # Reconstruct historical data up to t (exclusive) and execution opens at t
            history_by_symbol = {}
            execution_opens = {}
            current_rows = {}

            for symbol, df in prepared_data.items():
                hist_df = df[df["epoch_seconds"] < t]
                curr_df = df[df["epoch_seconds"] == t]

                if not curr_df.empty:
                    history_by_symbol[symbol] = hist_df
                    row = curr_df.iloc[0]
                    execution_opens[symbol] = float(row["open"])
                    current_rows[symbol] = row

            if not execution_opens:
                continue

            # Update last price of active positions to current open for equity sizing
            for symbol, open_price in execution_opens.items():
                state = self._ensure_symbol_state(symbol)
                state.last_price = open_price

            # Get signals from the decision engine
            portfolio_snapshot = self.snapshot()
            signals = get_signals(history_by_symbol, execution_opens, portfolio_snapshot, self.config)

            # Sells first
            exited_this_step = set()
            for symbol, signal_data in signals.items():
                signal = signal_data.get("signal", "HOLD")
                state = self._ensure_symbol_state(symbol)
                if not state.in_position or symbol not in current_rows:
                    continue

                row = current_rows[symbol]
                open_price = float(row["open"])
                low_price = float(row["low"])
                high_price = float(row["high"])

                exit_price = None
                if open_price < state.stop_loss:
                    exit_price = open_price * (1 - slippage)
                elif low_price < state.stop_loss:
                    exit_price = state.stop_loss * (1 - slippage)
                elif signal == "SELL":
                    exit_price = open_price * (1 - slippage)

                if exit_price is not None:
                    exit_price = max(low_price, min(high_price, exit_price))
                    proceeds = state.shares * exit_price
                    fee = proceeds * fee_rate
                    self.state.cash += (proceeds - fee)

                    trades.append({
                        "symbol": symbol,
                        "time": t,
                        "amount": -float(state.shares),
                        "price": float(exit_price)
                    })
                    state.shares = 0.0
                    state.in_position = False
                    exited_this_step.add(symbol)

            # Trailing stops for survivors
            for symbol, signal_data in signals.items():
                state = self._ensure_symbol_state(symbol)
                if not state.in_position or symbol in exited_this_step or symbol not in history_by_symbol:
                    continue

                hist = history_by_symbol[symbol]
                if hist.empty:
                    continue
                prev_high = float(hist.iloc[-1]["high"])
                state.highest_price = max(state.highest_price, prev_high)

                atr_val = float(signal_data.get("atr", state.highest_price * 0.02))
                atr_mult = float(signal_data.get("trailing_stop_atr_multiplier", 2.5))
                trailing_stop = state.highest_price - (atr_val * atr_mult)
                state.stop_loss = max(state.stop_loss, trailing_stop)

            # Buys last
            for symbol, signal_data in signals.items():
                signal = signal_data.get("signal", "HOLD")
                state = self._ensure_symbol_state(symbol)
                if signal != "BUY" or state.in_position or symbol in exited_this_step or symbol not in current_rows:
                    continue

                row = current_rows[symbol]
                open_price = float(row["open"])
                low_price = float(row["low"])
                high_price = float(row["high"])

                shares = float(signal_data.get("shares", 0.0))
                if shares <= 0.01:
                    continue

                buy_price = open_price * (1 + slippage)
                buy_price = max(low_price, min(high_price, buy_price))
                cost = shares * buy_price
                fee = cost * fee_rate

                if cost + fee > self.state.cash:
                    shares = self.state.cash / (buy_price * (1 + fee_rate))
                    if shares <= 0.01:
                        continue
                    cost = shares * buy_price
                    fee = cost * fee_rate

                self.state.cash -= (cost + fee)
                state.shares = shares
                state.in_position = True
                state.highest_price = buy_price

                atr_val = float(signal_data.get("atr", buy_price * 0.02))
                atr_mult = float(signal_data.get("trailing_stop_atr_multiplier", 2.5))
                state.stop_loss = buy_price - (atr_val * atr_mult)

                trades.append({
                    "symbol": symbol,
                    "time": t,
                    "amount": float(shares),
                    "price": float(buy_price)
                })

            # Update last price of active positions to current close
            for symbol in execution_opens:
                state = self._ensure_symbol_state(symbol)
                if state.in_position and symbol in current_rows:
                    state.last_price = float(current_rows[symbol]["close"])

        return trades


# ==========================================
# Compatibility Wrapper
# ==========================================

def emit_trades(bars_by_symbol: Dict[str, pd.DataFrame], config: dict) -> List[dict]:
    """
    Backwards-compatible wrapper.
    """
    strategy = CycleDetectionStrategy(config)
    return strategy.emit_trades(bars_by_symbol)
