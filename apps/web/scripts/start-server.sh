#!/bin/sh

set -eu

usage() {
  cat <<'USAGE'
Usage: ./scripts/start-server.sh [--dry-run] [--help]

Starts the production stack:
  1. Ensures the Postgres container exists, is running, and has the configured role/database.
  2. Builds and starts the Java backend.
  3. Builds and starts the Next.js production server.

Configuration is via environment variables:
  APP_PORT                 Frontend port. Defaults to PORT, then 3000.
  BACKEND_PORT             Java backend port. Defaults to 8080.
  DB_PORT                  Host Postgres port. Defaults to 5433.
  DB_NAME                  Postgres database. Defaults to postgres.
  DB_USER                  Postgres user. Defaults to strategyuser.
  DB_PASSWORD              Postgres password. Defaults to password.
  DB_CONTAINER_NAME        Container name. Defaults to strategy-visualiser-postgres.
  DB_IMAGE                 Postgres image. Defaults to docker.io/library/postgres:16.
  DB_VOLUME                Named data volume. Defaults to strategy-visualiser-postgres-data.
  CONTAINER_RUNTIME        docker or podman. Defaults to auto-detect.
  RUN_DIR                  PID/log directory. Defaults to apps/web/.run.
  SKIP_BUILD               Set to 1 to skip backend/frontend builds.
USAGE
}

DRY_RUN=0
case "${1:-}" in
  --dry-run)
    DRY_RUN=1
    ;;
  --help|-h)
    usage
    exit 0
    ;;
  "")
    ;;
  *)
    usage >&2
    exit 2
    ;;
esac

SCRIPT_DIR=$(CDPATH= cd "$(dirname "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd "$SCRIPT_DIR/../../.." && pwd)
WEB_DIR="$ROOT_DIR/apps/web"
BACKEND_DIR="$ROOT_DIR/apps/backend"

APP_PORT="${APP_PORT:-${PORT:-3000}}"
BACKEND_PORT="${BACKEND_PORT:-8080}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-strategyuser}"
DB_PASSWORD="${DB_PASSWORD:-password}"
DB_CONTAINER_NAME="${DB_CONTAINER_NAME:-strategy-visualiser-postgres}"
DB_IMAGE="${DB_IMAGE:-docker.io/library/postgres:16}"
DB_VOLUME="${DB_VOLUME:-strategy-visualiser-postgres-data}"
RUN_DIR="${RUN_DIR:-$WEB_DIR/.run}"
SKIP_BUILD="${SKIP_BUILD:-0}"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:$BACKEND_PORT}"
NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-http://127.0.0.1:$APP_PORT}"
SPRING_DATASOURCE_URL="${SPRING_DATASOURCE_URL:-jdbc:postgresql://$DB_HOST:$DB_PORT/$DB_NAME}"
SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-$DB_USER}"
SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-$DB_PASSWORD}"

BACKEND_PID_FILE="$RUN_DIR/backend.pid"
BACKEND_LOG_FILE="$RUN_DIR/backend.log"
FRONTEND_LOG_FILE="$RUN_DIR/frontend.log"

log() {
  printf '%s\n' "$*"
}

die() {
  printf 'Error: %s\n' "$*" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "$1 is required but was not found in PATH."
}

is_safe_identifier() {
  case "$1" in
    ""|*[!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_]*)
      return 1
      ;;
    *)
      return 0
      ;;
  esac
}

quote_sql_literal() {
  printf "%s" "$1" | sed "s/'/''/g"
}

detect_container_runtime() {
  if [ -n "${CONTAINER_RUNTIME:-}" ]; then
    command -v "$CONTAINER_RUNTIME" >/dev/null 2>&1 ||
      die "CONTAINER_RUNTIME=$CONTAINER_RUNTIME was set but the command was not found."
    printf '%s\n' "$CONTAINER_RUNTIME"
    return
  fi

  if command -v docker >/dev/null 2>&1; then
    printf '%s\n' docker
    return
  fi

  if command -v podman >/dev/null 2>&1; then
    printf '%s\n' podman
    return
  fi

  die "Neither docker nor podman was found in PATH."
}

run() {
  if [ "$DRY_RUN" -eq 1 ]; then
    printf '[dry-run]'
    for arg in "$@"; do
      printf ' %s' "$arg"
    done
    printf '\n'
  else
    "$@"
  fi
}

container_exists() {
  "$CONTAINER" container inspect "$DB_CONTAINER_NAME" >/dev/null 2>&1
}

container_running() {
  [ "$("$CONTAINER" inspect -f '{{.State.Running}}' "$DB_CONTAINER_NAME" 2>/dev/null || true)" = "true" ]
}

start_database() {
  log "Checking database container..."

  if container_exists; then
    if container_running; then
      log "Database container '$DB_CONTAINER_NAME' is already running."
    else
      log "Starting existing database container '$DB_CONTAINER_NAME'..."
      run "$CONTAINER" start "$DB_CONTAINER_NAME"
    fi
  else
    log "Creating database container '$DB_CONTAINER_NAME'..."
    run "$CONTAINER" run -d \
      --name "$DB_CONTAINER_NAME" \
      -e "POSTGRES_USER=$DB_USER" \
      -e "POSTGRES_PASSWORD=$DB_PASSWORD" \
      -e "POSTGRES_DB=$DB_NAME" \
      -p "$DB_PORT:5432" \
      -v "$DB_VOLUME:/var/lib/postgresql/data" \
      "$DB_IMAGE"
  fi

  wait_for_database
  configure_database
}

wait_for_database() {
  log "Waiting for Postgres to accept connections..."

  i=0
  while [ "$i" -lt 60 ]; do
    if "$CONTAINER" exec "$DB_CONTAINER_NAME" pg_isready -U "$DB_USER" -d "$DB_NAME" >/dev/null 2>&1; then
      log "Postgres is ready."
      return
    fi
    i=$((i + 1))
    sleep 1
  done

  die "Postgres did not become ready within 60 seconds."
}

database_login_works() {
  "$CONTAINER" exec -e "PGPASSWORD=$DB_PASSWORD" "$DB_CONTAINER_NAME" \
    psql -U "$DB_USER" -d "$DB_NAME" -tAc "SELECT 1" >/dev/null 2>&1
}

configure_database() {
  if database_login_works; then
    log "Database role and database are configured."
    return
  fi

  log "Database login failed; attempting to configure role/database inside the container..."

  is_safe_identifier "$DB_USER" ||
    die "DB_USER may only contain letters, digits, and underscores when auto-configuring."
  is_safe_identifier "$DB_NAME" ||
    die "DB_NAME may only contain letters, digits, and underscores when auto-configuring."

  password_sql=$(quote_sql_literal "$DB_PASSWORD")

  if ! "$CONTAINER" exec "$DB_CONTAINER_NAME" psql -U postgres -d postgres -tAc "SELECT 1" >/dev/null 2>&1; then
    die "Could not connect as the postgres superuser to configure the database."
  fi

  if ! "$CONTAINER" exec "$DB_CONTAINER_NAME" psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep 1 >/dev/null 2>&1; then
    run "$CONTAINER" exec "$DB_CONTAINER_NAME" psql -U postgres -d postgres \
      -c "CREATE ROLE \"$DB_USER\" LOGIN PASSWORD '$password_sql'"
  fi

  if ! "$CONTAINER" exec "$DB_CONTAINER_NAME" psql -U postgres -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep 1 >/dev/null 2>&1; then
    run "$CONTAINER" exec "$DB_CONTAINER_NAME" createdb -U postgres -O "$DB_USER" "$DB_NAME"
  fi

  database_login_works || die "Database was configured, but login as $DB_USER to $DB_NAME still failed."
  log "Database role and database are configured."
}

pid_is_running() {
  [ -s "$1" ] && kill -0 "$(cat "$1")" >/dev/null 2>&1
}

find_backend_jar() {
  find "$BACKEND_DIR/target" -maxdepth 1 -type f -name '*.jar' ! -name '*.original' 2>/dev/null | head -n 1
}

build_backend() {
  if [ "$SKIP_BUILD" = "1" ]; then
    log "Skipping backend build because SKIP_BUILD=1."
    return
  fi

  log "Building Java backend..."
  (cd "$BACKEND_DIR" && run ./mvnw -DskipTests package)
}

start_backend() {
  if pid_is_running "$BACKEND_PID_FILE"; then
    log "Java backend is already running with PID $(cat "$BACKEND_PID_FILE")."
    return
  fi

  build_backend
  BACKEND_JAR=$(find_backend_jar)
  [ -n "$BACKEND_JAR" ] || die "No backend JAR found under $BACKEND_DIR/target."

  log "Starting Java backend on port $BACKEND_PORT..."
  if [ "$DRY_RUN" -eq 1 ]; then
    log "[dry-run] SPRING_DATASOURCE_URL=$SPRING_DATASOURCE_URL java -jar $BACKEND_JAR --server.port=$BACKEND_PORT"
    return
  fi

  (
    cd "$BACKEND_DIR"
    SPRING_DATASOURCE_URL="$SPRING_DATASOURCE_URL" \
    SPRING_DATASOURCE_USERNAME="$SPRING_DATASOURCE_USERNAME" \
    SPRING_DATASOURCE_PASSWORD="$SPRING_DATASOURCE_PASSWORD" \
    nohup java -jar "$BACKEND_JAR" --server.port="$BACKEND_PORT" >"$BACKEND_LOG_FILE" 2>&1 &
    printf '%s\n' "$!" >"$BACKEND_PID_FILE"
  )

  wait_for_backend
}

wait_for_backend() {
  log "Waiting for backend health check..."

  i=0
  while [ "$i" -lt 60 ]; do
    if http_get "$BACKEND_URL/api/health" >/dev/null 2>&1; then
      log "Java backend is ready."
      return
    fi
    i=$((i + 1))
    sleep 1
  done

  die "Backend did not become ready within 60 seconds. See $BACKEND_LOG_FILE."
}

http_get() {
  if command -v curl >/dev/null 2>&1; then
    curl -fsS "$1"
  elif command -v wget >/dev/null 2>&1; then
    wget -qO- "$1"
  else
    die "curl or wget is required for health checks."
  fi
}

build_frontend() {
  if [ "$SKIP_BUILD" = "1" ]; then
    log "Skipping frontend build because SKIP_BUILD=1."
    return
  fi

  log "Installing frontend dependencies if needed..."
  if [ ! -d "$WEB_DIR/node_modules" ]; then
    (cd "$WEB_DIR" && run npm ci)
  fi

  log "Building Next.js frontend..."
  (cd "$WEB_DIR" && run npm run build)
}

start_frontend() {
  build_frontend

  log "Starting Next.js production server on port $APP_PORT..."
  log "Frontend logs will stream here; backend logs are in $BACKEND_LOG_FILE."

  if [ "$DRY_RUN" -eq 1 ]; then
    log "[dry-run] BACKEND_URL=$BACKEND_URL NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL npm run start -- -p $APP_PORT"
    return
  fi

  cd "$WEB_DIR"
  BACKEND_URL="$BACKEND_URL" \
  NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  PORT="$APP_PORT" \
  npm run start -- -p "$APP_PORT" 2>&1 | tee "$FRONTEND_LOG_FILE"
}

if [ "$DRY_RUN" -eq 1 ]; then
  log "Dry run: validating script configuration only."
  log "Project root: $ROOT_DIR"
  log "Frontend port: $APP_PORT"
  log "Backend port: $BACKEND_PORT"
  log "Database: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
  log "Database container: $DB_CONTAINER_NAME"
  log "Database image: $DB_IMAGE"
  log "Run directory: $RUN_DIR"
  log "Would auto-detect docker/podman, ensure Postgres is running, build/start backend, then build/start Next."
  exit 0
fi

require_command java
require_command npm
require_command sed
require_command grep
require_command find
require_command head
require_command tee
CONTAINER=$(detect_container_runtime)
log "Using container runtime: $CONTAINER"

if [ "$DRY_RUN" -eq 0 ]; then
  mkdir -p "$RUN_DIR"
fi

start_database
start_backend
start_frontend
