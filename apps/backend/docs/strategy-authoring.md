# Strategy authoring guide

This document describes how **user-supplied Java strategies** run in Strategy Visualiser: what the backend prepares for each job, what your code must output, and what the web UI consumes.

Implementation references (for maintainers):

- Job workspace and I/O: `cz.vko.stockstrategy.service.AnalysisJobService`
- Container invocation: `cz.vko.stockstrategy.service.StrategyExecutionService`
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
| `code`          | **Full Java source** of your entry class (see §3). Typically one file: `StrategyMain.java`. |
| `configuration` | JSON describing configurable parameters and universe (see §5). |
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

  When `symbol` is present, the backend may **filter** JSON arrays/objects whose elements carry `symbol`, `ticker`, or `instrument` so the result focuses on that ticker (`filterResultBySymbol` in `AnalysisJobService`).

- **Useful fields:** `status` (`pending` | `running` | `completed` | `failed`), `result` (string holding JSON), `errorMessage`, `consoleOutput`.

---

## 2. Runtime model (sandbox)

For each job the backend uses a **Docker/Podman** image (default name `strategy-runner`, override `STRATEGY_CONTAINER_IMAGE`). Typical limits match `StrategyExecutionService`:

- **Network:** disabled (`--network=none`).
- **CPU / memory / processes:** `--cpus=1`, `--memory=512m`, `--pids-limit=128`.
- **Filesystem:** container root is read-only; the **job workspace is bind-mounted** read-write at `/opt/strategy/workspace`.
- **Writable temps:** tmpfs at `/tmp` and `/opt/strategy/tmp` (sizes configured on the backend side).

Environment variables passed into the container include:

| Variable | Purpose |
|----------|---------|
| `STRATEGY_CONFIG_FILE` | Absolute path to `config.json` inside the workspace |
| `STRATEGY_STOCK_DATA_FILE` | Absolute path to `stock-data.csv` |
| `STRATEGY_JOB_CONTEXT_FILE` | Absolute path to `job-context.json` |
| `STRATEGY_TMP_DIR` | Temp directory (typically `/tmp`) |
| `STRATEGY_JOB_ID` | Current analysis job id |
| `STRATEGY_ID` | Strategy record id |

Optional entrypoint behavior (image `entrypoint.sh`): `RUN_TIMEOUT_SECONDS` (default **300**) wraps compile and run; `STRATEGY_LIB_DIR` defaults to `/opt/strategy/lib`.

---

## 3. Java entry contract

- Source file written by the backend is always named **`StrategyMain.java`**.
- The entrypoint compiles that file and runs the class **`StrategyMain`** (`RUN_MAIN_CLASS` can override, but the platform does not set it).
- Required shape:

  ```java
  public class StrategyMain {
      public static void main(String[] args) throws Exception {
          // read inputs, write JSON to stdout
      }
  }
  ```

- **Classpath:** `.` (compiled classes under a temp dir) plus `/opt/strategy/lib/*` (see §6).

Use **UTF-8** source encoding (`javac -encoding UTF-8`).

---

## 4. Input files and schemas

All paths below are under the job workspace on the host (e.g. `/tmp/strategyVisualizer/job_<id>/`); inside the container they appear under `/opt/strategy/workspace/`.

### 4.1 `config.json`

Pretty-printed JSON. Produced from your strategy’s **resolved** configuration (defaults merged with any overrides from the analyze request).

**Two configuration shapes** are supported server-side:

1. **Array of options** (recommended for UI-driven strategies): each element has at least `id` and `defaultValue`. The resolved file contains one JSON field per `id` (e.g. `maRange1`, `universe`).
2. **Legacy single object:** may contain `universe`, or nested `marketData.universe` / `marketData.symbol`.

Universe resolution prefers explicit JSON arrays of ticker strings; duplicates are removed while preserving order.

### 4.2 `stock-data.csv`

Written by `writeStockDataCsv`. Header row (exactly):

```text
ticker,period,tradeDate,tradeTime,open,high,low,close,volume,openInterest
```

- **`tradeDate`:** ISO local date (e.g. `2024-03-15`).
- **`tradeTime`:** ISO local time or empty (daily bars often use midnight).
- **Prices / volume:** decimal numbers as strings; missing numeric cells may be empty.
- **Semantics:** one row per bar; rows are sorted by ticker, date, time. Multiple tickers appear in one file when the universe has multiple symbols.

**Time alignment:** the chart and performance helpers treat **`time` on trades as UNIX epoch seconds (UTC)** derived from `tradeDate` + `tradeTime` the same way as the reference strategy (`LocalDateTime` → `toEpochSecond(ZoneOffset.UTC)`). Your emitted trade times should match that convention so markers align with candles.

### 4.3 `job-context.json`

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

## 5. Configuration JSON for authors

### 5.1 Option list format (used by the web UI)

The UI expects `configuration` to be a **JSON array** of options with fields such as `id`, `label`, `type`, `defaultValue`, `required`. Supported types include `number`, `boolean`, `select`, `string`, `multi-select`. The app injects a **`universe`** option automatically when saving from the UI.

Authors hand-writing JSON should:

- Include an option with `"id": "universe"` and a `defaultValue` string array of tickers **unless** you rely solely on legacy configuration (§5.2).
- Avoid duplicate semantics: the UI reserves `universe`; user-authored uploads cannot declare another `universe` option (`parseUserConfigOptions`).

### 5.2 Legacy object format

A single JSON object may include:

```json
{
  "universe": ["SPY", "QQQ"],
  "marketData": { "symbol": "SPY" }
}
```

The backend flattens overrides from `analyze` into this object when resolving.

---

## 6. Libraries available in the container

The image preloads dependencies declared in `apps/backend/docker/strategyContainer/strategy-libs-pom.xml`. Maven `dependency:copy-dependencies` also places **transitive** JARs under `/opt/strategy/lib`.

**Directly declared:**

- `org.ta4j:ta4j-core` (technical analysis)
- `com.yahoofinance-api:YahooFinanceAPI`
- `org.apache.poi:poi-ooxml`
- `org.apache.commons:commons-math3`
- `com.fasterxml.jackson.core:jackson-databind`
- `org.slf4j:slf4j-simple`

Use only APIs present on that classpath. There is **no network** in the default sandbox, so YahooFinance API calls will fail at runtime—stick to files provided by the job (`stock-data.csv`, `config.json`).

---

## 7. Files you can read or write

| Location | Read | Write |
|----------|------|--------|
| Workspace (`/opt/strategy/workspace` → host job dir) | `StrategyMain.java`, `config.json`, `stock-data.csv`, `job-context.json` | Same directory (e.g. debug files)—avoid relying on persistence after the job exits |
| `/tmp`, `/opt/strategy/tmp` | Yes | Yes (temp files, compiled classes during compile step) |
| Rest of container filesystem | System libraries, `/opt/strategy/lib` | Effectively no (read-only root) |

Do not depend on reading arbitrary host paths: only the mounted workspace is guaranteed.

---

## 8. Standard output and result JSON contract

### 8.1 How the backend picks “the result”

The combined stdout from the container may include compiler/runner log lines. The backend extracts **`sanitizeStrategyOutput`**:

- It scans stdout **from the last line upward** and uses the **last non-blank line that starts with `{` or `[`** as the persisted job result.
- If nothing matches, the stored result is **`{"status":"ok"}`**.

Therefore your program should print **one JSON value** (object or array) on a **single line** as the **last** meaningful line, typically with `System.out.println(json)`.

### 8.2 `trades` — required shape for chart markers

The web chart loads `result` and calls `extractTradeMarkersFromJobResult`, which expects:

```json
{
  "status": "ok",
  "trades": [
    { "symbol": "AAPL", "time": 1710316800, "amount": 1 },
    { "symbol": "AAPL", "time": 1712966400, "amount": -1 }
  ]
}
```

| Field | Type | Meaning |
|-------|------|---------|
| `time` | number | UNIX time in **seconds** (UTC), aligned with candle timestamps used by the app |
| `amount` | number | **> 0** buy / long entry, **< 0** sell / exit. Magnitude can represent size; the performance helper expands integer magnitudes into discrete legs. |
| `symbol` | string | Recommended when multiple tickers; enables server-side filtering via `?symbol=` |

Extra keys on trade objects are allowed but ignored by the extractor.

### 8.3 Signals

There is **no separate backend schema** for “signals.” Encode discretionary signals as extra arrays/objects on the root JSON if you need them for downstream tooling; the shipped UI does not consume them.

### 8.4 Metrics

There is **no required metrics schema.** Optional numeric summaries (`profitFactor`, `maxDrawdown`, etc.) may be added as JSON fields alongside `trades`; they will be stored and returned to clients but **are not used** by the default chart/calculation pipeline unless a future UI reads them.

### 8.5 Status field

Including `"status": "ok"` is conventional and readable by humans; it does not change execution semantics beyond documentation value.

---

## 9. Minimal examples (copy-paste)

Replace package/import statements as needed; the sandbox compiles a single file.

### 9.1 Smallest valid program (no trades)

Prints a JSON object on the last line. Useful for checking wiring.

```java
public class StrategyMain {
    public static void main(String[] args) throws Exception {
        System.out.println("{\"status\":\"ok\",\"trades\":[]}");
    }
}
```

### 9.2 Read config and data paths from the environment

```java
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.nio.file.Files;
import java.nio.file.Path;

public class StrategyMain {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public static void main(String[] args) throws Exception {
        Path cfg = Path.of(envOr("STRATEGY_CONFIG_FILE", "config.json"));
        Path csv = Path.of(envOr("STRATEGY_STOCK_DATA_FILE", "stock-data.csv"));
        Path ctx = Path.of(envOr("STRATEGY_JOB_CONTEXT_FILE", "job-context.json"));

        JsonNode config = MAPPER.readTree(Files.readString(cfg));
        JsonNode jobCtx = MAPPER.readTree(Files.readString(ctx));

        int rows = (int) Files.lines(csv).skip(1).count();

        ObjectNode root = MAPPER.createObjectNode();
        root.put("status", "ok");
        root.put("note", "read-only demo");
        root.put("maRange1", config.path("maRange1").asInt(0));
        root.put("stockRowCount", rows);
        root.put("jobId", jobCtx.path("jobId").asLong());
        root.putArray("trades");

        System.out.println(MAPPER.writeValueAsString(root));
    }

    private static String envOr(String key, String fallback) {
        String v = System.getenv(key);
        return (v == null || v.isBlank()) ? fallback : v;
    }
}
```

### 9.3 Emit a trade marker compatible with the chart

Use epoch seconds that match a row in `stock-data.csv` for the ticker you care about.

```java
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

public class StrategyMain {
    public static void main(String[] args) throws Exception {
        ObjectMapper m = new ObjectMapper();
        ObjectNode root = m.createObjectNode();
        root.put("status", "ok");
        var trades = root.putArray("trades");
        ObjectNode t = m.createObjectNode();
        t.put("symbol", "AAPL");
        t.put("time", 1704067200L); // replace with a real bar timestamp from your run
        t.put("amount", 1);
        trades.add(t);

        System.out.println(m.writeValueAsString(root));
    }
}
```

### 9.4 Pattern used by the shipped MA crossover example

The repository includes a fuller sample under:

`apps/backend/src/main/resources/built-in-strategies/moving-average-crossover/StrategyMain.java`

It demonstrates:

- Parsing `config.json` with Jackson.
- Loading `stock-data.csv` into per-symbol bar lists.
- Building ta4j `BarSeries` and emitting `trades` with `{ symbol, time, amount }`.

---

## 10. Building the runner image locally

See `apps/backend/docker/strategyContainer/README.md` for build instructions and security-oriented runtime flags. The backend expects the image tag configured in `STRATEGY_CONTAINER_IMAGE` (default `strategy-runner`).

---

## 11. Troubleshooting checklist

| Symptom | Things to verify |
|--------|-------------------|
| Job `failed`, nonzero exit | Stderr/stdout in `consoleOutput`; fix compile errors or uncaught exceptions |
| Empty chart markers | Root JSON missing `trades` array; entries missing `time`/`amount` or not numeric |
| Markers misaligned | `time` not equal to candle UNIX seconds used by the chart for that bar |
| Filtered result empty with `?symbol=` | Trades missing `symbol` / `ticker` / `instrument` matching the query |
| Out of memory / timeout | Simplify logic; default wall-clock limit **300s** per compile+run (`RUN_TIMEOUT_SECONDS`) |
