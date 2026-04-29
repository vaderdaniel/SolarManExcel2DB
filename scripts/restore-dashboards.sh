#!/bin/bash

# Restore Grafana dashboards from backup JSON files
# This script wraps dashboard JSON in the proper API format and imports them

set -e

GRAFANA_URL="http://localhost:3000"
GRAFANA_USER="admin"
GRAFANA_PASSWORD="admin123"
DASHBOARD_DIR="grafana/dashboards"

echo "🔄 Starting Grafana dashboard restore process..."
echo "📍 Grafana URL: $GRAFANA_URL"
echo ""

# Check if port-forward is needed
if ! curl -s -f "$GRAFANA_URL/api/health" > /dev/null 2>&1; then
    echo "⚠️  Grafana not accessible at $GRAFANA_URL"
    echo "🔌 Starting port-forward in background..."
    kubectl port-forward svc/grafana-service 3000:3000 -n default > /dev/null 2>&1 &
    PORT_FORWARD_PID=$!
    sleep 3
    
    # Verify connection
    if ! curl -s -f "$GRAFANA_URL/api/health" > /dev/null 2>&1; then
        echo "❌ Failed to connect to Grafana after port-forward"
        kill $PORT_FORWARD_PID 2>/dev/null || true
        exit 1
    fi
    echo "✅ Port-forward established (PID: $PORT_FORWARD_PID)"
    echo ""
fi

# Function to restore a dashboard
restore_dashboard() {
    local file=$1
    local name=$(basename "$file" .json)
    
    echo "📊 Restoring: $name"
    
    # Create temporary file with wrapped JSON
    local temp_file=$(mktemp)
    
    # Wrap dashboard JSON in API format
    jq -n --slurpfile dashboard "$file" '{
        dashboard: $dashboard[0],
        overwrite: true
    }' > "$temp_file"
    
    # Import dashboard
    response=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Content-Type: application/json" \
        -u "$GRAFANA_USER:$GRAFANA_PASSWORD" \
        -d @"$temp_file" \
        "$GRAFANA_URL/api/dashboards/db")
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    rm -f "$temp_file"
    
    if [ "$http_code" = "200" ]; then
        uid=$(echo "$body" | jq -r '.uid // "unknown"')
        echo "   ✅ Success - UID: $uid"
        return 0
    else
        echo "   ❌ Failed (HTTP $http_code)"
        echo "   Response: $body" | head -n 3
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

# Clean up port-forward if we started it
if [ ! -z "$PORT_FORWARD_PID" ]; then
    echo "⚠️  Port-forward still running (PID: $PORT_FORWARD_PID)"
    echo "   To stop: kill $PORT_FORWARD_PID"
    echo "   Or keep it running to access Grafana"
fi

exit $fail_count
