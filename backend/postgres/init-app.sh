#!/bin/sh
set -eu
psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set=app_password="$TASKFLOW_DB_PASSWORD" <<'SQL'
CREATE ROLE taskflow_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOCREATEDB NOCREATEROLE;
GRANT CONNECT ON DATABASE taskflow TO taskflow_app;
GRANT USAGE, CREATE ON SCHEMA public TO taskflow_app;
SQL
