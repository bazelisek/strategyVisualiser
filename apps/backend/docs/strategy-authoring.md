# Strategy authoring guide

This document describes how **user-supplied Java and Python strategies** run in Strategize: what the backend prepares for each job, what your code must output, and what the web UI consumes.

Implementation references (for maintainers):

- Job workspace and I/O: `cz.vko.stockstrategy.service.AnalysisJobService`
- Container invocation: `cz.vko.stockstrategy.service.StrategyExecutionService`
- Runtime resolution: `cz.vko.stockstrategy.service.StrategySourceFiles`
- Result parsing (last JSON line): `sanitizeStrategyOutput` in `AnalysisJobService`
- Chart trade markers: `extractTradeMarkersFromJobResult` in the web app (`util/serverFetch.ts`)
- Example strategy sources: `src/main/resources/built-in-strategies/` (e.g. moving average crossover)

---

## 1. End-to-end workflow

### 1.1 Create or update a strategy (HTTP API)

Strategies are stored in the backend database with at least:

| Field            | Role |
|-----------------|------|
| `name`          | Display name |
| `description`   | Optional |
| `runtime`       | `java` or `python` (default inferred from file extensions) |
| `code`          | **Primary source code** (legacy field, still supported for single-file Java strategies) |
| `sourceFiles`   | **List of source files** (recommended): `[{ "path": "main.py", "content": "..." }]` |
| `entryFile`     | Path to the entry file (e.g. `StrategyMain.java` or `main.py`) |
| `configuration` | JSON describing configurable parameters and universe (see §5). |
| `requirements`  | JSON describing configurable requirements and their boundaries (see §5). |
| `ownerEmail`, `isPublic` | Ownership / visibility |

- **Create:** `POST /api/strategies` with body matching `StrategyCreateDTO`.
- **Update:** `PATCH /api/strategies/{id}`.
- **Load:** `GET /api/strategies/{id}`.

The web app builds configuration by prepending a reserved **`universe`** multi-select to user-defined options (`util/strategies/configuration.ts`). Authors editing JSON by hand should include a `universe` array where applicable.

### 1.2 Run an analysis job

- **Request:** `POST /api/strategies/{id}/analyze`  
  Body (optional, `AnalyzeStrategyRequestDTO`):

  ```json
  {
    "config": { "maRange1": 10, "maRange2": 30, "universe": ["AAPL", "MSFT"] },
    "symbol": "AAPL",
    "fromDate": "2024-01-01",
    "toDate": "2024-06-01"
  }
  ```

  - `config` overrides strategy defaults (keys match your configuration option `id`s, plus `universe` when used).
  - `fromDate` / `toDate` restrict OHLC data loaded for the job (when both are set).
  - `symbol` is carried on the request for UI context; the backend resolves **which tickers to load** from `universe` in configuration.

- **Response:** `202 Accepted` with `{ "job_id": <long>, "status": "accepted" }`.

  Job execution is asynchronous; the HTTP call returns before the container finishes.

### 1.3 Poll until completion

- **Request:** `GET /api/jobs/{jobId}?symbol=AAPL` (symbol optional).

  When `symbol` is present, the backend **filters** the strategy output so the result focuses on that ticker (see §8 for filtering logic).

- **Useful fields:** `status` (`pending` | `running` | `completed` | `failed`), `result` (string holding JSON), `errorMessage`, `consoleOutput`.

---

## 2. Runtime model (sandbox)

For each job the backend uses a **Docker/Podman** image (default name `strategy-runner`, override `STRATEGY_CONTAINER_IMAGE`). Typical limits match `StrategyExecutionService`:

- **Network:** disabled (`--network=none`).
- **CPU / memory / processes:** `--cpus=1`, `--memory=1g`, `--pids-limit=128`.
- **Filesystem:** container root is read-only; the **job workspace is bind-mounted** read-write at `/opt/strategy/workspace`.
- **Writable temps:** tmpfs at `/tmp` and `/opt/strategy/tmp` (sizes configured on the backend side).

Environment variables passed into the container include:

| Variable | Purpose |
|----------|---------|
| `STRATEGY_CONFIG_FILE` | Absolute path to `config.json` inside the workspace |
| `STRATEGY_STOCK_DATA_FILE` | Absolute path to `stock-data.csv` |
| `STRATEGY_JOB_CONTEXT_FILE` | Absolute path to `job-context.json` |
| `STRATEGY_TMP_DIR` | Temp directory (typically `/tmp`) |
| `STRATEGY_RUNTIME` | Current runtime (`java` or `python`) |
| `STRATEGY_JOB_ID` | Current analysis job id |
| `STRATEGY_ID` | Strategy record id |

Optional entrypoint behavior (image `entrypoint.sh`): `RUN_TIMEOUT_SECONDS` (default **300**) wraps compile and run; `STRATEGY_LIB_DIR` defaults to `/opt/strategy/lib`.

---

## 3. Java entry contract

- The entrypoint compiles all `.java` files in the workspace and runs the specified **`entryFile`** (defaulting to `StrategyMain.java`).
- Required shape:

  ```java
  public class StrategyMain {
      public static void main(String[] args) throws Exception {
          // read inputs, write JSON to stdout
      }
  }
  ```

- **Classpath:** `.` (compiled classes under a temp dir) plus `/opt/strategy/lib/*` (see §6).
- **Packages:** Supported. The platform automatically resolves the full class name if a `package` declaration is present.

Use **UTF-8** source encoding (`javac -encoding UTF-8`).

---

## 4. Python entry contract

- The entrypoint runs the specified **`entryFile`** with `python3` (defaulting to `main.py`, `StrategyMain.py`, or `__main__.py`).
- **`PYTHONPATH`:** Automatically includes the workspace directory.
- **Shebang:** The platform ensures `#!/usr/bin/env python3` is present and files are executable.
- **Environment:** A virtual environment is pre-configured with common data science and trading libraries (see §6).

---

## 5. Input files and schemas

All paths below are under the job workspace on the host (e.g. `/tmp/strategyVisualizer/job_<id>/`); inside the container they appear under `/opt/strategy/workspace/`.

### 5.1 `config.json`

Pretty-printed JSON. Produced from your strategy’s **resolved** configuration (defaults merged with any overrides from the analyze request).

**Two configuration shapes** are supported server-side:

1. **Array of options** (recommended for UI-driven strategies): each element has at least `id` and `defaultValue`. The resolved file contains one JSON field per `id` (e.g. `maRange1`, `universe`).
2. **Legacy single object:** may contain `universe`, or nested `marketData.universe` / `marketData.symbol`.

Universe resolution prefers explicit JSON arrays of ticker strings; duplicates are removed while preserving order.

### 5.2 `stock-data.csv`

Written by `writeStockDataCsv`. Header row (exactly):

```text
ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest
```

- **`tradeDate`:** ISO local date (e.g. `2024-03-15`).
- **`tradeTime`:** ISO local time or empty (daily bars often use midnight).
- **Prices / volume:** decimal numbers as strings; missing numeric cells may be empty.
- **Semantics:** one row per bar; rows are sorted by ticker, date, time. Multiple tickers appear in one file when the universe has multiple symbols.

**Time alignment:** the chart and performance helpers treat **`time` on trades as UNIX epoch seconds (UTC)** derived from `tradeDate` + `tradeTime`. Your emitted trade times should match that convention so markers align with candles.

### 5.3 `job-context.json`

Metadata only (safe to ignore for logic, useful for logging):

| Field | Type | Meaning |
|-------|------|---------|
| `jobId` | number | Analysis job id |
| `strategyId` | number | Strategy id |
| `strategyName` | string | Strategy name |
| `configFile` | string | Filename `config.json` |
| `stockDataFile` | string | Filename `stock-data.csv` |
| `universe` | string array | Resolved ticker list |
| `rangeStart` | string or null | ISO date |
| `rangeEnd` | string or null | ISO date |
| `stockRowCount` | number | Total CSV rows (excluding header) |
| `stockRowCountBySymbol` | object | Map ticker → row count |

---

## 6. Configuration and Requirements JSON for authors

### 6.1 Option list format (used by the web UI)

The UI expects `configuration` to be a **JSON array** of options. Supported types include `number`, `boolean`, `select`, `string`, `multi-select`.

Supported fields per option:
- `id`: Unique identifier (used as key in `config.json`)
- `label`: Display name in UI
- `type`: One of the supported types above
- `defaultValue`: Initial value
- `options`: Array of strings (for `select` or `multi-select`)
- `required`: Boolean

The app injects a **`universe`** option automatically when saving from the UI.

### 6.2 Requirements list format

The UI expects `requirements` to be a **JSON object** with optional fields:

- **`symbol`**: `{ "whitelist": [...], "blacklist": [...] }`
- **`interval`**: `{ "whitelist": [...], "blacklist": [...] }`. Supported: `1m`, `2m`, `5m`, `15m`, `30m`, `60m`, `90m`, `1d`, `5d`, `1wk`, `1mo`, `3mo`.
- **`period`**: `{ "min": <unix_ts>, "max": <unix_ts> }`

---

## 7. Libraries available in the container

### 7.1 Java libraries

The container preloads dependencies from `strategy-libs-pom.xml` under `/opt/strategy/lib`.

- `org.ta4j:ta4j-core` (technical analysis)
- `com.yahoofinance-api:YahooFinanceAPI`
- `org.apache.poi:poi-ooxml`
- `org.apache.commons:commons-math3`
- `com.fasterxml.jackson.core:jackson-databind`
- `org.slf4j:slf4j-simple`

### 7.2 Python libraries

A pre-configured virtual environment includes:

- **Trading:** `backtrader`, `ccxt`, `ta`, `yfinance`
- **Data Science:** `pandas`, `numpy`, `scipy`, `scikit-learn`, `statsmodels`
- **Visualization:** `matplotlib`, `seaborn`
- **Other:** `requests`, `pyyaml`, `numba`, `networkx`, `torch` (CPU)

---

## 8. Standard output and result JSON contract

### 8.1 How the backend picks “the result”

- It scans stdout **from the last line upward** and uses the **last non-blank line that starts with `{` or `[`** as the persisted job result.
- If nothing matches, the stored result is **`{"status":"ok"}`**.

Therefore your program should print **one JSON value** (object or array) on a **single line** as the **last** meaningful line.

### 8.2 `trades` — required shape for chart markers

The web chart loads `result` and expects:

```json
{
  "status": "ok",
  "trades": [
    { "symbol": "AAPL", "time": 1710316800, "amount": 1 },
    { "symbol": "AAPL", "time": 1712966400, "amount": -1 }
  ]
}
```

- **`time`**: UNIX time in **seconds** (UTC), aligned with candle timestamps.
- **`amount`**: **> 0** buy / long, **< 0** sell / exit.
- **`symbol`**: Required for multi-symbol strategies to enable filtering.

### 8.3 Result Filtering by Symbol

When the UI requests a result for a specific symbol (e.g. `?symbol=AAPL`), the backend applies filtering:

1. **Arrays:** Only elements matching the symbol (via `symbol`, `ticker`, or `instrument` fields) are kept.
2. **Objects:** If a field's value is an object containing the symbol as a key, that value is extracted.

Example output:
```json
{
  "trades": {
    "AAPL": [{"time": 123, "amount": 1}],
    "MSFT": [{"time": 456, "amount": 1}]
  }
}
```
Result for `?symbol=AAPL`: `{"trades": [{"time": 123, "amount": 1}]}`.

---

## 9. Minimal examples (copy-paste)

### 9.1 Java (Simple)

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class StrategyMain {
    public static void main(String[] args) throws Exception {
        ObjectMapper m = new ObjectMapper();
        ObjectNode root = m.createObjectNode();
        root.put("status", "ok");
        var trades = root.putArray("trades");
        trades.addObject().put("symbol", "AAPL").put("time", 1704067200L).put("amount", 1);
        System.out.println(m.writeValueAsString(root));
    }
}
```

### 9.2 Python (Simple)

```python
import json
import os

def main():
    # Read config path from environment
    config_path = os.getenv("STRATEGY_CONFIG_FILE", "config.json")
    
    # Emit result
    result = {
        "status": "ok",
        "trades": [
            {"symbol": "AAPL", "time": 1704067200, "amount": 1}
        ]
    }
    print(json.dumps(result))

if __name__ == "__main__":
    main()
```

---

## 10. Building the runner image locally

See `apps/backend/docker/strategyContainer/README.md` for build instructions. The backend expects the image tag configured in `STRATEGY_CONTAINER_IMAGE` (default `strategy-runner`).

---

## 11. Troubleshooting checklist

| Symptom | Things to verify |
|--------|-------------------|
| Job `failed`, nonzero exit | Check `consoleOutput` for compile errors or Python stack traces |
| Empty chart markers | Result missing `trades` array; entries missing `time`/`amount` |
| Markers misaligned | `time` not equal to candle UNIX seconds (must be UTC) |
| Filtered result empty | Trades missing `symbol` field matching the query |
| Out of memory / timeout | Limits: **1GB** RAM, **300s** runtime (`RUN_TIMEOUT_SECONDS`) |

