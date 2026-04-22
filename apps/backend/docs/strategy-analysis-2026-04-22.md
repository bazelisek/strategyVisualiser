# Strategy Analysis - 2026-04-22

## Scope

- Built-in strategies analyzed before the new addition:
  - `Moving Average Crossover`
  - `SuperTrend`
- Final built-in added:
  - `EMA ADX Trend`
- Test basket:
  - Stocks: `AAPL`, `MSFT`, `NVDA`, `JPM`, `XOM`, `UNH`
  - Crypto: `BTC-USD`, `ETH-USD`, `SOL-USD`, `XRP-USD`, `DOGE-USD`
- Data and execution:
  - Daily Yahoo Finance candles fetched through the backend
  - Strategies executed inside the Docker strategy container
  - Metrics computed from benchmarked trades using the backend API

## Built-In Strategy Results

Window: `2023-01-01` to `2026-04-22`

| Strategy | Asset group | Avg total return | Avg max drawdown | Avg Sharpe |
|----------|-------------|------------------|------------------|------------|
| Moving Average Crossover | Stocks | `0.2301` | `-0.1426` | `0.5964` |
| Moving Average Crossover | Crypto | `3.5525` | `-0.2464` | `0.8191` |
| SuperTrend | Stocks | `-0.0513` | `-0.3393` | `-0.0182` |
| SuperTrend | Crypto | `-0.7297` | `-0.7890` | `-0.5493` |

### Findings

- `Moving Average Crossover` is the stronger existing built-in. It remained profitable on both the stock and crypto baskets, with acceptable drawdown and positive Sharpe.
- `Moving Average Crossover` is still regime-sensitive. Crypto gains were concentrated in a few explosive names, so returns were strong but uneven across the basket.
- `SuperTrend` is not robust on crypto in the tested setup. It lost money on every tested crypto asset:
  - `BTC-USD`: `-0.3961`
  - `ETH-USD`: `-0.7636`
  - `SOL-USD`: `-0.7647`
  - `XRP-USD`: `-0.8064`
  - `DOGE-USD`: `-0.9179`
- `SuperTrend` also underperformed on stocks, with materially worse drawdown and negative risk-adjusted returns.

## Strategy Design Iteration

### Candidate 1: Mean Reversion

Rules:

- Trend filter with a longer EMA
- Entry when RSI reaches oversold levels inside the uptrend
- Exit on RSI mean reversion or ATR stop

Result on `2023-01-01` to `2026-04-22`:

| Asset group | Avg total return | Avg max drawdown | Avg Sharpe |
|-------------|------------------|------------------|------------|
| Stocks | `-0.1838` | `-0.1946` | `-0.9119` |
| Crypto | `-0.4938` | `-0.5041` | `-0.9486` |

Decision:

- Rejected. The pullback logic was too eager and did not recover quickly enough in either asset class.

### Candidate 2: EMA + ADX Trend (v1)

Rules:

- Entry when `close > slow EMA`, `fast EMA > slow EMA`, and `ADX >= threshold`
- Exit when price loses trend structure or hits an ATR trailing stop

Result on `2023-01-01` to `2026-04-22`:

| Asset group | Avg total return | Avg max drawdown | Avg Sharpe |
|-------------|------------------|------------------|------------|
| Stocks | `1.4380` | `-0.1317` | `1.1757` |
| Crypto | `8.0376` | `-0.2196` | `1.4096` |

Decision:

- Kept and refined. It was already clearly better than mean reversion on both return and stability.

### Candidate 3: EMA + ADX Trend (v2, final)

Refinements:

- Tightened entry to require `close > fast EMA > slow EMA`
- Tightened exit to sell when price loses the fast EMA, trend strength drops below `75%` of the ADX threshold, or an ATR trailing stop is hit
- Forced final flattening so jobs always end flat

Result on `2023-01-01` to `2026-04-22`:

| Asset group | Avg total return | Avg max drawdown | Avg Sharpe |
|-------------|------------------|------------------|------------|
| Stocks | `1.2947` | `-0.1034` | `1.5366` |
| Crypto | `17.2851` | `-0.1551` | `1.9119` |

Decision:

- Chosen as the final built-in. Stock return dipped slightly versus v1, but drawdown improved and Sharpe improved materially. Crypto performance improved across all three target metrics.

## Final Built-In Validation

Built-in name: `EMA ADX Trend`

Implementation details:

- Seeded as a built-in strategy through `BuiltInStrategyCatalog`
- Runs inside the existing Docker strategy container
- Uses only indicators already available in the backend container:
  - `EMA`
  - `ADX`
  - `ATR`
- Interval requirement blacklists intraday data and keeps the strategy on higher-timeframe bars

Validation window 1: `2023-01-01` to `2026-04-22`

| Asset group | Avg total return | Avg max drawdown | Avg Sharpe |
|-------------|------------------|------------------|------------|
| Stocks | `1.2947` | `-0.1034` | `1.5366` |
| Crypto | `17.2851` | `-0.1551` | `1.9119` |

Validation window 2: `2025-01-01` to `2026-04-22`

| Asset group | Avg total return | Avg max drawdown | Avg Sharpe |
|-------------|------------------|------------------|------------|
| Stocks | `0.2665` | `-0.0891` | `1.5644` |
| Crypto | `0.5730` | `-0.1184` | `1.0961` |

Additional validation notes:

- All benchmarked runs had matched buy and sell counts.
- All benchmarked runs ended flat with no open position left at the end of the window.
- The final built-in remained profitable on both the stock and crypto baskets in both tested windows.
