#!/bin/sh
# wait-for-db.sh
# Usage: ./wait-for-db.sh <host> <command>
# Example: ./wait-for-db.sh db uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

set -e

host="$1"
shift
cmd="$@"

# 環境変数からユーザーとDB名を取得（デフォルトはpostgres）
db_user="${POSTGRES_USER:-postgres}"
db_name="${POSTGRES_DB:-postgres}"

until pg_isready -h "$host" -U "$db_user" -d "$db_name"; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 2
done

>&2 echo "Postgres is up - executing command"
exec $cmd