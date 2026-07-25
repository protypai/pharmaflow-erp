#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  _rest="${DATABASE_URL#postgresql://}"
  _rest="${_rest#postgres://}"
  _userpass="${_rest%%@*}"
  _hostdb="${_rest#*@}"
  PG_USER="${_userpass%%:*}"
  PG_HOST="${_hostdb%%:*}"
  PG_HOST="${PG_HOST%%/*}"
  PG_DB="${_hostdb##*/}"
  PG_DB="${PG_DB%%\?*}"
else
  PG_USER="${POSTGRES_USER:-postgres}"
  PG_HOST="${PGHOST:-postgres}"
  PG_DB="${POSTGRES_DB:-postgres}"
fi

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
