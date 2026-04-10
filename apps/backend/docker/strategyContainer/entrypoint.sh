#!/usr/bin/env bash
set -euo pipefail

lib_dir="${STRATEGY_LIB_DIR:-/opt/strategy/lib}"
workdir="${STRATEGY_WORKDIR:-/opt/strategy/workspace}"
tmpdir="${STRATEGY_TMP_DIR:-/opt/strategy/tmp}"
timeout_seconds="${RUN_TIMEOUT_SECONDS:-300}"

mkdir -p "$workdir"
mkdir -p "$tmpdir"
cd "$workdir"

classpath=".:${lib_dir}/*"
class_output_dir="${tmpdir}/classes"

if [[ $# -eq 0 ]]; then
  set -- java -version
fi

case "$1" in
  java|javac|jshell|bash|sh)
    exec "$@"
    ;;
  *.java)
    source_file="$1"
    shift
    main_class="${RUN_MAIN_CLASS:-$(basename "$source_file" .java)}"
    mkdir -p "$class_output_dir"
    timeout --foreground "${timeout_seconds}s" javac -encoding UTF-8 -cp "$classpath" -d "$class_output_dir" "$source_file"
    if [[ "${COMPILE_ONLY:-false}" == "true" ]]; then
      exit 0
    fi
    exec timeout --foreground "${timeout_seconds}s" java -cp "${class_output_dir}:${lib_dir}/*" "$main_class" "$@"
    ;;
  *.jar)
    exec timeout --foreground "${timeout_seconds}s" java -jar "$@"
    ;;
  *)
    exec timeout --foreground "${timeout_seconds}s" "$@"
    ;;
esac
