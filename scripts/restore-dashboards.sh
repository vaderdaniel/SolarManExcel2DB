#!/bin/bash

# Restore Grafana dashboards with datasource UID correction
# This script updates datasource UIDs to match the current Grafana instance

set -e

GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin123"
DASHBOARD_DIR="grafana/dashboards"

echo "🔄 Starting Grafana dashboard restore process..."
echo "📍 Grafana URL: $GRAFANA_URL"
echo ""

# Get the actual datasource UID from Grafana
echo "🔍 Fetching datasource configuration..."
DATASOURCE_UID=$(curl -s -u "$GRAFANA_USER:$GRAFANA_PASSWORD" "$GRAFANA_URL/api/datasources" | jq -r '.[0].uid')

if [ -z "$DATASOURCE_UID" ] || [ "$DATASOURCE_UID" = "null" ]; then
    echo "❌ Failed to get datasource UID from Grafana"
    exit 1
fi

echo "✅ Found datasource UID: $DATASOURCE_UID"
echo ""

# Function to restore a dashboard
restore_dashboard() {
    local file=$1
    local name=$(basename "$file" .json)
    
    echo "📊 Restoring: $name"
    
    # Create temporary file with corrected datasource UID
    local temp_dashboard=$(mktemp)
    local temp_payload=$(mktemp)
    
    # Replace all datasource UIDs and remove ID in the dashboard JSON
    jq --arg uid "$DATASOURCE_UID" '
        del(.id) |
        walk(
            if type == "object" and has("datasource") and .datasource.type == "grafana-postgresql-datasource" 
            then .datasource.uid = $uid 
            else . 
            end
        )
    ' "$file" > "$temp_dashboard"
    
    # Wrap dashboard JSON in API format
    jq -n --slurpfile dashboard "$temp_dashboard" '{
        dashboard: $dashboard[0],
        overwrite: true
    }' > "$temp_payload"
    
    # Import dashboard
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
        -d @"$temp_payload" \
        "$GRAFANA_URL/api/dashboards/db")
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    rm -f "$temp_dashboard" "$temp_payload"
    
    if [ "$http_code" = "200" ]; then
        uid=$(echo "$body" | jq -r '.uid // "unknown"')
        url=$(echo "$body" | jq -r '.url // "unknown"')
        echo "   ✅ Success - UID: $uid"
        echo "   🔗 URL: $GRAFANA_URL$url"
        return 0
    else
        echo "   ❌ Failed (HTTP $http_code)"
        echo "   Response: $(echo "$body" | jq -r '.message // .')"
        return 1
    fi
}

# Restore all dashboards
success_count=0
fail_count=0

for dashboard_file in "$DASHBOARD_DIR"/*.json; do
    if [ -f "$dashboard_file" ]; then
        if restore_dashboard "$dashboard_file"; then
            ((success_count++))
        else
            ((fail_count++))
        fi
        echo ""
    fi
done

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 Restore Summary:"
echo "   ✅ Successful: $success_count"
echo "   ❌ Failed: $fail_count"
echo ""
echo "🌐 Access Grafana at: $GRAFANA_URL"
echo "   Username: $GRAFANA_USER"
echo "   Password: $GRAFANA_PASSWORD"
echo ""

if [ $success_count -gt 0 ]; then
    echo "✨ Dashboards restored successfully!"
fi

exit $fail_count
