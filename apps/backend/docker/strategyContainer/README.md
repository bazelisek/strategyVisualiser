# Strategy Container

This image is intended to run user-supplied Java strategy code from the backend job executor.

**Strategy authoring (workflow, input/output contracts, examples):** see [docs/strategy-authoring.md](../../docs/strategy-authoring.md).

## What it contains

- Java 21, matching the backend project
- Preloaded technical analysis libraries:
  - `org.ta4j:ta4j-core`
  - `com.yahoofinance-api:YahooFinanceAPI`
  - `org.apache.poi:poi-ooxml`
  - `org.apache.commons:commons-math3`
  - `com.fasterxml.jackson.core:jackson-databind`
  - `org.slf4j:slf4j-simple`
- `tini` as PID 1
- A non-root `strategy` user
- A small entrypoint that can compile and run a single `.java` file or execute `java`, `javac`, or `java -jar`

## Typical usage

Build:

```bash
docker build -t strategy-runner ./docker/strategyContainer
```

Run a single source file from a mounted workspace:

```bash
docker run --rm \
  --network=none \
  --cpus=1 \
  --memory=512m \
  --pids-limit=128 \
  --read-only \
  --tmpfs /opt/strategy/tmp:rw,noexec,nosuid,size=512m \
  --tmpfs /opt/strategy/workspace:rw,nosuid,size=512m \
  -v "$PWD/job:/opt/strategy/workspace:Z" \
  strategy-runner /opt/strategy/workspace/MyStrategy.java
```

Run an explicit command:

```bash
docker run --rm strategy-runner java -version
```

## Security notes

The image reduces risk by default, but the real isolation comes from how the backend starts containers.

Recommended runtime flags:

- `--network=none` unless the strategy truly needs market data access
- `--read-only`
- `--tmpfs` for writable paths
- `--cpus`, `--memory`, and `--pids-limit`
- `--cap-drop=ALL`
- `--security-opt=no-new-privileges`
- A restrictive seccomp profile if you add one on the backend side

On SELinux-enabled hosts such as Fedora, add a relabel option like `:Z` or `:z`
to bind-mounted workspaces so the container can see strategy source files.
