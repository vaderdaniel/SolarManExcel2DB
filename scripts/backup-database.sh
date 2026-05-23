#!/bin/bash

# Backup the LOOTS PostgreSQL database running in Rancher Desktop Kubernetes.
# Saves a gzip-compressed pg_dump to ~/LOOTS_PG/.
# Credentials are read from the 'solarman-secret' Kubernetes secret.
# If kubectl is unavailable or the secret cannot be read, the user is prompted.

set -euo pipefail

BACKUP_DIR="$HOME/LOOTS_PG"
DB_NAME="LOOTS"
NAMESPACE="default"
SECRET_NAME="solarman-secret"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/loots_backup_${TIMESTAMP}.sql.gz"

echo "========================================"
echo "  SolarMan Database Backup"
echo "========================================"

# ── Resolve credentials ──────────────────────────────────────────────────────

resolve_secret() {
    local key="$1"
    kubectl get secret "$SECRET_NAME" -n "$NAMESPACE" \
        -o jsonpath="{.data.${key}}" 2>/dev/null \
        | base64 --decode 2>/dev/null
}

DB_USER=""
DB_PASSWORD=""

if command -v kubectl &>/dev/null && kubectl cluster-info &>/dev/null 2>&1; then
    DB_USER=$(resolve_secret "DB_USER")
    DB_PASSWORD=$(resolve_secret "DB_PASSWORD")
fi

if [[ -z "$DB_USER" ]]; then
    read -rp "Database username: " DB_USER
fi

if [[ -z "$DB_PASSWORD" ]]; then
    read -rsp "Database password: " DB_PASSWORD
    echo
fi

# ── Find the postgres pod ─────────────────────────────────────────────────────

POSTGRES_POD=$(kubectl get pod -n "$NAMESPACE" -l app=postgres \
    -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [[ -z "$POSTGRES_POD" ]]; then
    echo "❌  No postgres pod found (label app=postgres) in namespace '$NAMESPACE'."
    exit 1
fi

echo "✅  Postgres pod : $POSTGRES_POD"
echo "✅  Backup target: $BACKUP_FILE"
echo ""

# ── Run pg_dump inside the pod and stream to a local gzip file ───────────────

echo "⏳  Running pg_dump (maximum gzip compression)..."

PGPASSWORD="$DB_PASSWORD" kubectl exec -n "$NAMESPACE" "$POSTGRES_POD" -- \
    pg_dump -U "$DB_USER" "$DB_NAME" \
    | gzip -9 > "$BACKUP_FILE"

# ── Verify ───────────────────────────────────────────────────────────────────

if [[ -f "$BACKUP_FILE" ]]; then
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
    echo "✅  Backup complete: $BACKUP_FILE ($SIZE)"
else
    echo "❌  Backup failed — output file not found."
    exit 1
fi
