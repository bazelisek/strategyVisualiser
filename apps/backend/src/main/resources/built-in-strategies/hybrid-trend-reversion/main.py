import json
import logging
import sys
from math import inf
from typing import Any, Dict, TypedDict, cast

import pandas as pd

from strategy_logic import get_signals
from workspace_io import load_bars, load_config


class Position(TypedDict):
    shares: float
    in_position: bool
    stop_loss: float
    highest_price: float
    last_price: float


class PortfolioState(TypedDict):
    cash: float
    positions: Dict[str, Position]


def execute_signals(
    signals: Dict[str, dict],
    portfolio_state: PortfolioState,
    current_data: Dict[str, pd.Series],
    config: Dict[str, Any],
) -> list:
    trades_made = []
    fee_rate = float(config.get("feeRate", config.get("fees", 0.0)))
    slippage = float(config.get("slippage", 0.0001))
    max_fill_fraction = config.get("maxFillFraction", 0.25)

    for symbol, signal_data in signals.items():
        signal = signal_data.get("signal", "HOLD")
        if symbol not in current_data:
            continue

        row = current_data[symbol]
        open_price = float(row["open"])
        low_price = float(row["low"])
        high_price = float(row["high"])
        epoch = int(row["epoch_seconds"])

        position = portfolio_state["positions"][symbol]

        if position["in_position"]:
            exit_price = None

            if open_price < position["stop_loss"]:
                exit_price = open_price * (1 - slippage)
            elif low_price < position["stop_loss"]:
                exit_price = position["stop_loss"] * (1 - slippage)
            elif signal == "SELL":
                exit_price = open_price * (1 - slippage)

            if exit_price is not None:
                exit_price = max(low_price, min(high_price, exit_price))

                shares = position["shares"]
                volume = float(row.get("volume", 0))
                max_shares_liquidity = volume * max_fill_fraction if volume > 0 else float("inf")
                shares = min(shares, max_shares_liquidity)

                if shares > 0:
                    proceeds = shares * exit_price
                    fee = proceeds * fee_rate
                    portfolio_state["cash"] += (proceeds - fee)

                    trades_made.append({
                        "symbol": symbol,
                        "time": epoch,
                        "amount": -float(shares),
                        "price": float(exit_price),
                    })

                    remaining = position["shares"] - shares
                    if remaining <= 0:
                        position["shares"] = 0.0
                        position["in_position"] = False
                        position["stop_loss"] = float("inf")
                        position["highest_price"] = float("-inf")
                        position["last_price"] = float("-inf")
                    else:
                        position["shares"] = remaining

    for symbol, signal_data in signals.items():
        position = portfolio_state["positions"].get(symbol)
        if position and position["in_position"]:
            atr_val = float(signal_data.get("atr", 0.0))
            atr_mult = float(signal_data.get("trailing_stop_atr_multiplier", 2.5))
            prev_high = float(signal_data.get("prev_high", 0.0))

            position["highest_price"] = max(position["highest_price"], prev_high)
            trailing_stop = position["highest_price"] - (atr_val * atr_mult)
            position["stop_loss"] = max(position.get("stop_loss", 0.0), trailing_stop)

    for symbol, signal_data in signals.items():
        signal = signal_data.get("signal", "HOLD")
        if signal != "BUY" or symbol not in current_data:
            continue

        row = current_data[symbol]
        position = portfolio_state["positions"][symbol]

        if not position["in_position"]:
            open_price = float(row["open"])
            low_price = float(row["low"])
            high_price = float(row["high"])
            volume = float(row.get("volume", 0))
            epoch = int(row["epoch_seconds"])
            max_shares_liquidity = volume * max_fill_fraction if volume > 0 else float("inf")

            shares = float(signal_data.get("shares", 0.0))
            shares = min(shares, max_shares_liquidity)

            if shares > 0.01:
                buy_price = open_price * (1 + slippage)
                buy_price = max(low_price, min(high_price, buy_price))

                cost = shares * buy_price
                fee = cost * fee_rate

                if cost + fee > portfolio_state["cash"]:
                    shares = portfolio_state["cash"] / (buy_price * (1 + fee_rate))
                    if shares <= 0.01:
                        continue
                    cost = shares * buy_price
                    fee = cost * fee_rate

                portfolio_state["cash"] -= (cost + fee)
                position["shares"] = shares
                position["in_position"] = True
                position["highest_price"] = buy_price
                position["last_price"] = buy_price

                atr_val = float(signal_data.get("atr", 0.0))
                atr_mult = float(signal_data.get("trailing_stop_atr_multiplier", 2.5))
                position["stop_loss"] = buy_price - (atr_val * atr_mult)

                trades_made.append({
                    "symbol": symbol,
                    "time": epoch,
                    "amount": float(shares),
                    "price": float(buy_price),
                })

    for symbol, row in current_data.items():
        position = portfolio_state["positions"].get(symbol)
        if position and position["in_position"]:
            position["last_price"] = float(row["close"])

    return trades_made


def run_step_by_step(all_data: pd.DataFrame, config: Dict[str, Any], universe: list[str]):
    start_str = config.get("start")
    end_str = config.get("end")

    start_dt = pd.to_datetime(start_str) if start_str else None
    end_dt = pd.to_datetime(end_str) if end_str else None

    all_data = all_data.copy()
    all_data["date"] = pd.to_datetime(all_data["date"])
    all_data = all_data.sort_values("date").reset_index(drop=True)

    if start_dt is not None:
        all_data = all_data[all_data["date"] >= start_dt]
    if end_dt is not None:
        all_data = all_data[all_data["date"] <= end_dt]

    trading_dates = sorted(all_data["date"].unique())

    portfolio_state: PortfolioState = {
        "cash": float(config.get("initialBalance", 10000.0)),
        "positions": {
            symbol: {
                "shares": 0.0,
                "in_position": False,
                "stop_loss": inf,
                "highest_price": -inf,
                "last_price": 0.0,
            }
            for symbol in universe
        },
    }

    all_trades = []

    for current_date in trading_dates:
        historical_data = all_data[all_data["date"] < current_date]
        current_bars = all_data[all_data["date"] == current_date]

        if current_bars.empty:
            continue

        history_by_symbol = {
            symbol: historical_data[historical_data["symbol"] == symbol]
            for symbol in historical_data["symbol"].unique()
        }

        execution_opens = {
            row["symbol"]: float(row["open"])
            for _, row in current_bars.iterrows()
        }

        for symbol, open_price in execution_opens.items():
            if symbol in portfolio_state["positions"]:
                portfolio_state["positions"][symbol]["last_price"] = open_price

        signals = get_signals(
            history_by_symbol,
            execution_opens,
            cast(Dict[str, Any], portfolio_state),
            config,
        )

        current_data = {
            row["symbol"]: row
            for _, row in current_bars.iterrows()
        }

        all_trades.extend(execute_signals(signals, portfolio_state, current_data, config))

    return all_trades


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.DEBUG,
        format="[hybrid-strategy] %(levelname)s %(message)s",
        stream=sys.stdout,
    )


def main() -> None:
    configure_logging()
    logger = logging.getLogger(__name__)

    try:
        config = load_config()
        logger.debug("Config loaded: %s", config)

        bars_by_symbol = load_bars()
        universe = config.get("universe") or list(bars_by_symbol.keys())

        dfs = []
        for symbol, df in bars_by_symbol.items():
            temp = df.copy()
            temp["symbol"] = symbol
            dfs.append(temp)

        if not dfs:
            print(json.dumps({
                "status": "ok",
                "strategy": "Hybrid Trend Reversion",
                "runtime": "python",
                "tradeCount": 0,
                "trades": [],
            }))
            return

        all_data = pd.concat(dfs)
        all_data = all_data.dropna(subset=["open", "high", "low", "close"])

        date_col = next((col for col in all_data.columns if col.lower() in ["date", "datetime"]), None)
        if date_col:
            all_data = all_data.rename(columns={date_col: "date"})
        elif all_data.index.name and all_data.index.name.lower() in ["date", "datetime"]:
            all_data = all_data.reset_index().rename(columns={all_data.index.name: "date"})

        if "date" not in all_data.columns:
            raise KeyError(f"Could not find date column. Available columns: {all_data.columns.tolist()}")

        all_trades = run_step_by_step(all_data, config, universe)
        all_trades.sort(key=lambda trade: (trade["time"], trade["symbol"]))

        result = {
            "status": "ok",
            "strategy": "Hybrid Trend Reversion",
            "runtime": "python",
            "tradeCount": len(all_trades),
            "trades": all_trades,
        }

        logger.debug("Emitting final result with %s trades", len(all_trades))
        print(json.dumps(result))

    except Exception as exc:
        logger.exception("Strategy failed: %s", exc)
        print(json.dumps({"status": "failed", "errorMessage": str(exc)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
