import workspace_io
from strategyLogic import get_signals
from datetime import datetime
import pandas as pd
from math import inf
from typing import TypedDict, Dict

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
    current_data: Dict[str, pd.Series],  # místo jen price!
    config: dict,
):
    fee_rate = config.get("fees", 0.0)
    slippage = config.get("slippage", 0.0)
    max_alloc = config.get("maxAllocationPerTrade", 20) / 100.0
    max_fill_fraction = config.get("maxFillFraction", 0.25)

    for symbol, signal_data in signals.items():
        signal = signal_data.get("signal", "HOLD")

        if symbol not in current_data:
            continue

        row = current_data[symbol]
        price = float(row["close"])
        volume = float(row.get("volume", 0))

        position = portfolio_state["positions"][symbol]

        # --- simulace likvidity ---
        max_shares_liquidity = volume * max_fill_fraction if volume > 0 else float("inf")

        # ================= BUY =================
        if signal == "BUY" and not position["in_position"]:
            cash = portfolio_state["cash"]
            alloc_cash = cash * max_alloc

            raw_shares = alloc_cash / price

            # partial fill limit
            shares = min(raw_shares, max_shares_liquidity)

            if shares <= 0:
                continue

            # slippage (kupuješ dráž)
            fill_price = price * (1 + slippage)

            cost = shares * fill_price
            fee = cost * fee_rate

            total_cost = cost + fee

            if total_cost > portfolio_state["cash"]:
                continue

            # update state
            portfolio_state["cash"] -= total_cost

            position["shares"] = shares
            position["in_position"] = True
            position["highest_price"] = fill_price
            position["last_price"] = fill_price

        # ================= SELL =================
        elif signal == "SELL" and position["in_position"]:
            shares = position["shares"]

            # partial fill
            shares = min(shares, max_shares_liquidity)

            if shares <= 0:
                continue

            # slippage (prodáváš levněji)
            fill_price = price * (1 - slippage)

            proceeds = shares * fill_price
            fee = proceeds * fee_rate

            net_proceeds = proceeds - fee

            portfolio_state["cash"] += net_proceeds

            remaining = position["shares"] - shares

            if remaining <= 0:
                # full exit
                position["shares"] = 0.0
                position["in_position"] = False
                position["stop_loss"] = float("inf")
                position["highest_price"] = float("-inf")
                position["last_price"] = float("-inf")
            else:
                # partial exit
                position["shares"] = remaining

        # ================= UPDATE =================
        if position["in_position"]:
            position["last_price"] = price
            position["highest_price"] = max(position["highest_price"], price)

if __name__ == "__main__":
    config = workspace_io.load_config()
    start = datetime.fromisoformat(config['start']) if config.get('start') else None
    end = datetime.fromisoformat(config['end']) if config.get('end') else None
    interval = config.get('interval', '1d')
    universe = config.get('universe', [])
    dict = workspace_io.load_bars(universe, start, end, interval)
    
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

    for current_date in dates:
        history = all_data[all_data['date'] <= current_date]
        

        history_by_symbol = {
            symbol: df
            for symbol, df in history.groupby('symbol')
        }
        # print(history_by_symbol)
        signals = get_signals(history_by_symbol, portfolio_state, config)
        debug_arr = [(symbol, data["signal"]) for symbol, data in signals.items() if data["signal"] != 'HOLD']
        
        current_data = {
            symbol: df.iloc[-1]
            for symbol, df in history_by_symbol.items()
            if len(df) > 0
        }
                
        execute_signals(signals, portfolio_state, current_data, config)
        if len(debug_arr) > 0:
            print([(symbol, data["signal"]) for symbol, data in signals.items() if data["signal"] != 'HOLD'])
            print(current_date, portfolio_state["cash"])
    print(portfolio_state)
            
        
    
    
    #get_signals()