import workspace_io
from strategyLogic import get_signals
from datetime import datetime
import pandas as pd
from math import inf
from typing import TypedDict, Dict
from strategyLogic import emit_trades

class Position(TypedDict):
    shares: float
    in_position: bool
    stop_loss: float
    highest_price: float
    last_price: float

class PortfolioState(TypedDict):
    cash: float
    positions: Dict[str, Position]

START_DATE = None
END_DATE = None

def execute_signals(
    signals: Dict[str, dict],
    portfolio_state: PortfolioState,
    current_data: Dict[str, pd.Series],
    config: dict,
) -> list:
    trades_made = []
    fee_rate = float(config.get("feeRate", config.get("fees", 0.0)))
    slippage = float(config.get("slippage", 0.0005))
    max_fill_fraction = config.get("maxFillFraction", 0.25)

    for symbol, signal_data in signals.items():
        signal = signal_data.get("signal", "HOLD")

        if symbol not in current_data:
            continue

        row = current_data[symbol]
        open_price = float(row["open"])
        low_price = float(row["low"])
        high_price = float(row["high"])
        volume = float(row.get("volume", 0))
        epoch = int(row["epoch_seconds"])

        position = portfolio_state["positions"][symbol]

        # --- simulace likvidity ---
        max_shares_liquidity = volume * max_fill_fraction if volume > 0 else float("inf")

        # ================= EXIT (Signal or Stop Loss) =================
        if position["in_position"]:
            exit_price = None
            
            # 1. Check Trailing Stop hit
            if open_price < position["stop_loss"]:
                # Gap down below stop
                exit_price = open_price * (1 - slippage)
            elif low_price < position["stop_loss"]:
                # Hit stop during bar
                exit_price = position["stop_loss"] * (1 - slippage)
            # 2. Check Signal Exit
            elif signal == "SELL":
                exit_price = open_price * (1 - slippage)

            if exit_price is not None:
                # Clamp to [low, high]
                exit_price = max(low_price, min(high_price, exit_price))
                
                shares = position["shares"]
                shares = min(shares, max_shares_liquidity)
                
                if shares > 0:
                    proceeds = shares * exit_price
                    fee = proceeds * fee_rate
                    portfolio_state["cash"] += (proceeds - fee)
                    
                    trades_made.append({
                        "symbol": symbol,
                        "time": epoch,
                        "amount": -float(shares),
                        "price": float(exit_price)
                    })

                    remaining = position["shares"] - shares
                    if remaining <= 0:
                        position["shares"] = 0.0
                        position["in_position"] = False
                        position["stop_loss"] = float("inf")
                        position["highest_price"] = float("-inf")
                        position["last_price"] = float("-inf")
                        # Skip BUY on the same bar if we just exited (to match ProductionStrategy)
                        continue
                    else:
                        position["shares"] = remaining

        # ================= BUY =================
        if signal == "BUY" and not position["in_position"]:
            shares = float(signal_data.get("shares", 0.0))
            shares = min(shares, max_shares_liquidity)

            if shares > 0.01:
                buy_price = open_price * (1 + slippage)
                # Clamp to [low, high]
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
                
                # Initial stop loss (matches ProductionStrategy.step)
                atr_val = float(signal_data.get("atr", 0.0))
                atr_mult = float(signal_data.get("trailing_stop_atr_multiplier", 2.5))
                position["stop_loss"] = buy_price - (atr_val * atr_mult)

                trades_made.append({
                    "symbol": symbol,
                    "time": epoch,
                    "amount": float(shares),
                    "price": float(buy_price)
                })

        # ================= UPDATE Trailing Stop =================
        if position["in_position"]:
            position["last_price"] = float(row["close"])
            # Update highest price seen (using high of current bar)
            pass

    # Update stops after the execution loop to match ProductionStrategy's end-of-step update
    for symbol, signal_data in signals.items():
        position = portfolio_state["positions"].get(symbol)
        if position and position["in_position"]:
            atr_val = float(signal_data.get("atr", 0.0))
            atr_mult = float(signal_data.get("trailing_stop_atr_multiplier", 2.5))
            prev_high = float(signal_data.get("prev_high", 0.0))
            
            position["highest_price"] = max(position["highest_price"], prev_high)
            trailing_stop = position["highest_price"] - (atr_val * atr_mult)
            position["stop_loss"] = max(position.get("stop_loss", 0.0), trailing_stop)

    return trades_made




def compare_signals(legacy_trades: list, step_trades: list):
    """
    Compares actual trades from both methods.
    """
    print("\n--- Trade Comparison ---")
    
    def group_trades(trades):
        grouped = {}
        for t in trades:
            time = t['time']
            symbol = t['symbol']
            # We care about the action
            action = "BUY" if t['amount'] > 0 else "SELL"
            grouped.setdefault(time, {})[symbol] = action
        return grouped

    legacy_grouped = group_trades(legacy_trades)
    step_grouped = group_trades(step_trades)

    all_times = sorted(set(list(legacy_grouped.keys()) + list(step_grouped.keys())))
    
    diff_found = False
    for t in all_times:
        date_str = datetime.fromtimestamp(t).strftime('%Y-%m-%d')
        l_actions = legacy_grouped.get(t, {})
        s_actions = step_grouped.get(t, {})
        
        symbols = set(list(l_actions.keys()) + list(s_actions.keys()))
        
        for sym in symbols:
            l_act = l_actions.get(sym, "HOLD")
            s_act = s_actions.get(sym, "HOLD")
            
            if l_act != s_act:
                print(f"Diff at {date_str} ({t}) for {sym}: Legacy={l_act}, Step={s_act}")
                diff_found = True
    
    if not diff_found:
        print("No differences found between Legacy and Step trades.")

if __name__ == "__main__":
    config = workspace_io.load_config()
    start = datetime.fromisoformat(config['start']) if config.get('start') else None
    end = datetime.fromisoformat(config['end']) if config.get('end') else None
    interval = config.get('interval', '1d')
    universe = config.get('universe', [])
    dict = workspace_io.load_bars(universe, start, end, interval)
    
    # Legacy non safe
    
    all_trades = emit_trades(dict, config)
            
    # Ensure trades are sorted by time
    all_trades.sort(key=lambda x: (x['time'], x['symbol']))
    
    result = {
        "status": "ok",
        "strategy": "Hybrid Trend Reversion",
        "runtime": "python",
        "tradeCount": len(all_trades),
        "trades": all_trades,
    }
    
    print("Legacy: ", all_trades)
    # New safer non cheating
    # print(dict)
    
    dfs = []

    for symbol, df in dict.items():
        temp = df.copy()
        temp['symbol'] = symbol
        dfs.append(temp)

    all_data = pd.concat(dfs)    
    all_data = all_data.sort_values('date').reset_index(drop=True)

    dates = all_data['date'].drop_duplicates().tolist()
    
    portfolio_state: PortfolioState = { 
        "cash": config.get("initialBalance", 1000), 
        "positions": {
            s: {
                "shares" : 0.0, 
                "in_position" : False, 
                "stop_loss": inf, 
                "highest_price": -inf, 
                "last_price": 0.0
            } for s in universe
        }
    }

    step_trades_history = []

    for current_date in dates:
        history = all_data[all_data['date'] <= current_date]
        

        history_by_symbol = {
            symbol: df
            for symbol, df in history.groupby('symbol')
        }
        # print(history_by_symbol)
        signals = get_signals(history_by_symbol, portfolio_state, config)
        
        current_data = {
            symbol: df.iloc[-1]
            for symbol, df in history_by_symbol.items()
            if len(df) > 0
        }
                
        trades = execute_signals(signals, portfolio_state, current_data, config)
        step_trades_history.extend(trades)

        debug_arr = [(symbol, data["signal"]) for symbol, data in signals.items() if data["signal"] != 'HOLD']
        if len(trades) > 0:
            print(f"Trades at {current_date}: {trades}")
            print(current_date, portfolio_state["cash"])
    
    print(portfolio_state)
    
    compare_signals(all_trades, step_trades_history)
            
        
    
    
    #get_signals()