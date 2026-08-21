#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "Missing .env. Copy .env.example to .env and replace both secret values first." >&2
  exit 1
fi

docker compose config --quiet
docker compose pull
docker compose up -d --build --remove-orphans
docker compose ps
