#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import math
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from statistics import mean, pstdev
from typing import Any

import requests


@dataclass(frozen=True)
class Candle:
    time: int
    open: float
    close: float


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Benchmark built-in or user strategies through the live backend API.",
    )
    parser.add_argument("--base-url", default="http://127.0.0.1:18080")
    parser.add_argument("--from-date", required=True)
    parser.add_argument("--to-date", required=True)
    parser.add_argument(
        "--symbols",
        nargs="+",
        required=True,
        help="Ticker symbols to benchmark, for example AAPL MSFT BTC-USD ETH-USD",
    )
    parser.add_argument(
        "--strategies",
        nargs="*",
        help="Strategy names to benchmark. Defaults to all public strategies.",
    )
    parser.add_argument(
        "--snapshot",
        default=str(
            Path(__file__).resolve().parents[2]
            / "web"
            / "util"
            / "assetUniverseSnapshot.json"
        ),
    )
    parser.add_argument("--poll-interval-seconds", type=float, default=0.5)
    parser.add_argument("--timeout-seconds", type=float, default=300.0)
    parser.add_argument("--output")
    return parser.parse_args()


def load_asset_types(snapshot_path: str) -> dict[str, str]:
    path = Path(snapshot_path)
    if not path.exists():
        return {}
    payload = json.loads(path.read_text())
    return {
        asset["symbol"]: asset["type"]
        for asset in payload.get("assets", [])
        if isinstance(asset, dict) and "symbol" in asset and "type" in asset
    }


def fetch_json(
    session: requests.Session,
    method: str,
    url: str,
    *,
    timeout: float,
    **kwargs: Any,
) -> Any:
    response = session.request(method, url, timeout=timeout, **kwargs)
    response.raise_for_status()
    return response.json()


def fetch_strategies(
    session: requests.Session,
    base_url: str,
    requested_names: list[str] | None,
    timeout: float,
) -> list[dict[str, Any]]:
    strategies = fetch_json(session, "GET", f"{base_url}/api/strategies", timeout=timeout)
    if not requested_names:
        return strategies
    requested_set = set(requested_names)
    selected = [strategy for strategy in strategies if strategy.get("name") in requested_set]
    missing = requested_set - {strategy.get("name") for strategy in selected}
    if missing:
        raise SystemExit(f"Unknown strategies requested: {', '.join(sorted(missing))}")
    return selected


def fetch_candles(
    session: requests.Session,
    base_url: str,
    symbol: str,
    from_date: str,
    to_date: str,
    timeout: float,
) -> list[Candle]:
    rows = fetch_json(
        session,
        "GET",
        f"{base_url}/api/yahoo/{symbol}",
        params={"interval": "1d", "from": from_date, "to": to_date},
        timeout=timeout,
    )
    candles: list[Candle] = []
    for row in rows:
        trade_time = str(row.get("tradeTime") or "00:00:00")[:8]
        trade_date = str(row["tradeDate"])
        timestamp = int(datetime.fromisoformat(f"{trade_date}T{trade_time}+00:00").timestamp())
        candles.append(
            Candle(
                time=timestamp,
                open=float(row["open"]),
                close=float(row["close"]),
            )
        )
    candles.sort(key=lambda candle: candle.time)
    return candles


def run_strategy(
    session: requests.Session,
    base_url: str,
    strategy_id: int,
    symbol: str,
    from_date: str,
    to_date: str,
    poll_interval_seconds: float,
    timeout_seconds: float,
) -> dict[str, Any]:
    job = fetch_json(
        session,
        "POST",
        f"{base_url}/api/strategies/{strategy_id}/analyze",
        json={"symbol": symbol, "fromDate": from_date, "toDate": to_date},
        timeout=timeout_seconds,
    )
    job_id = int(job["job_id"])
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        job_data = fetch_json(
            session,
            "GET",
            f"{base_url}/api/jobs/{job_id}",
            params={"symbol": symbol},
            timeout=timeout_seconds,
        )
        status = str(job_data.get("status", ""))
        if status == "completed":
            result = job_data.get("result")
            if isinstance(result, str):
                return json.loads(result)
            return result
        if status == "failed":
            raise RuntimeError(job_data.get("errorMessage") or f"Job {job_id} failed.")
        time.sleep(poll_interval_seconds)
    raise TimeoutError(f"Timed out waiting for job {job_id} ({symbol})")


def compute_metrics(candles: list[Candle], trades: list[dict[str, Any]]) -> dict[str, Any]:
    trade_map: dict[int, list[int]] = {}
    for trade in trades:
        time_value = int(trade["time"])
        amount = int(trade["amount"])
        trade_map.setdefault(time_value, []).append(amount)

    cash = 1.0
    shares = 0.0
    equity_curve: list[float] = []
    matched_trade_count = 0

    for candle in candles:
        for amount in trade_map.get(candle.time, []):
            if amount > 0 and shares == 0.0 and cash > 0.0:
                shares = cash / candle.open
                cash = 0.0
                matched_trade_count += 1
            elif amount < 0 and shares > 0.0:
                cash = shares * candle.open
                shares = 0.0
                matched_trade_count += 1
        equity_curve.append(cash if shares == 0.0 else shares * candle.close)

    if not equity_curve:
        return {
            "total_return": None,
            "max_drawdown": None,
            "sharpe": None,
            "trade_count": len(trades),
            "matched_trade_count": 0,
            "open_position_at_end": False,
        }

    daily_returns = [
        0.0 if previous == 0.0 else current / previous - 1.0
        for previous, current in zip(equity_curve, equity_curve[1:])
    ]
    peak = equity_curve[0]
    max_drawdown = 0.0
    for value in equity_curve:
        peak = max(peak, value)
        max_drawdown = min(max_drawdown, (value / peak) - 1.0)

    sharpe = None
    if daily_returns and len({round(value, 12) for value in daily_returns}) > 1:
        sigma = pstdev(daily_returns)
        if sigma > 0:
            sharpe = (mean(daily_returns) / sigma) * math.sqrt(252.0)

    return {
        "total_return": equity_curve[-1] - 1.0,
        "max_drawdown": max_drawdown,
        "sharpe": sharpe,
        "trade_count": len(trades),
        "matched_trade_count": matched_trade_count,
        "open_position_at_end": shares > 0.0,
    }


def summarize_group(entries: list[dict[str, Any]]) -> dict[str, Any]:
    completed = [entry for entry in entries if entry["metrics"]["total_return"] is not None]
    returns = [entry["metrics"]["total_return"] for entry in completed]
    drawdowns = [entry["metrics"]["max_drawdown"] for entry in completed]
    sharpes = [entry["metrics"]["sharpe"] for entry in completed if entry["metrics"]["sharpe"] is not None]
    unmatched = [
        entry["symbol"]
        for entry in completed
        if entry["metrics"]["trade_count"] != entry["metrics"]["matched_trade_count"]
    ]
    return {
        "asset_count": len(entries),
        "average_total_return": mean(returns) if returns else None,
        "average_max_drawdown": mean(drawdowns) if drawdowns else None,
        "average_sharpe": mean(sharpes) if sharpes else None,
        "symbols_with_unmatched_trades": unmatched,
    }


def main() -> None:
    args = parse_args()
    asset_types = load_asset_types(args.snapshot)
    session = requests.Session()
    session.headers.update({"User-Agent": "strategy-benchmark/1.0"})

    strategies = fetch_strategies(session, args.base_url, args.strategies, args.timeout_seconds)
    candle_cache = {
        symbol: fetch_candles(
            session,
            args.base_url,
            symbol,
            args.from_date,
            args.to_date,
            args.timeout_seconds,
        )
        for symbol in args.symbols
    }

    report: dict[str, Any] = {
        "base_url": args.base_url,
        "from_date": args.from_date,
        "to_date": args.to_date,
        "symbols": args.symbols,
        "strategies": [],
    }

    for strategy in strategies:
        strategy_entries: list[dict[str, Any]] = []
        for symbol in args.symbols:
            result = run_strategy(
                session,
                args.base_url,
                int(strategy["id"]),
                symbol,
                args.from_date,
                args.to_date,
                args.poll_interval_seconds,
                args.timeout_seconds,
            )
            trades = result.get("trades", []) if isinstance(result, dict) else []
            metrics = compute_metrics(candle_cache[symbol], trades)
            strategy_entries.append(
                {
                    "symbol": symbol,
                    "asset_type": asset_types.get(symbol, "crypto" if symbol.endswith("-USD") else "equity"),
                    "metrics": metrics,
                }
            )

        stocks = [entry for entry in strategy_entries if entry["asset_type"] == "equity"]
        crypto = [entry for entry in strategy_entries if entry["asset_type"] == "crypto"]
        report["strategies"].append(
            {
                "id": strategy["id"],
                "name": strategy["name"],
                "entries": strategy_entries,
                "summary": {
                    "stocks": summarize_group(stocks),
                    "crypto": summarize_group(crypto),
                    "all": summarize_group(strategy_entries),
                },
            }
        )

    serialized = json.dumps(report, indent=2)
    if args.output:
        Path(args.output).write_text(serialized + "\n")
    print(serialized)


if __name__ == "__main__":
    main()
