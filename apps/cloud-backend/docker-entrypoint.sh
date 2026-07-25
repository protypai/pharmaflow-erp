#!/bin/sh
set -e

PG_USER="${POSTGRES_USER:-pharmaflow}"
PG_HOST="${POSTGRES_HOST:-postgres}"

echo "Waiting for PostgreSQL at ${PG_HOST}..."
MAX=60
WAITED=0
until pg_isready -h "$PG_HOST" -U "$PG_USER" -q; do
  if [ "$WAITED" -ge "$MAX" ]; then
    echo "PostgreSQL not ready after ${MAX}s"
    exit 1
  fi
  sleep 2
  WAITED=$((WAITED + 2))
done
echo "PostgreSQL ready"

echo "Running migrations..."
npx prisma migrate deploy
echo "Migrations done"

exec "$@"
