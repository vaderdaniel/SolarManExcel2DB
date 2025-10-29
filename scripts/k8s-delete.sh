#!/bin/bash

# Script to delete SolarMan application from Kubernetes
# This script must be run from the project root directory

set -e

echo "========================================"
echo "Deleting SolarMan from Kubernetes"
echo "========================================"

# Check if running from correct directory
if [ ! -d "k8s" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

echo ""
echo "🗑️  Deleting Frontend..."
kubectl delete -f k8s/frontend-deployment.yaml --ignore-not-found=true

echo ""
echo "🗑️  Deleting Backend..."
kubectl delete -f k8s/backend-deployment.yaml --ignore-not-found=true

echo ""
echo "🗑️  Deleting PostgreSQL..."
kubectl delete -f k8s/postgres-deployment.yaml --ignore-not-found=true

echo ""
echo "🗑️  Deleting PersistentVolume and PVC..."
kubectl delete -f k8s/postgres-pv.yaml --ignore-not-found=true

echo ""
echo "🗑️  Deleting ConfigMap..."
kubectl delete -f k8s/configmap.yaml --ignore-not-found=true

echo ""
echo "========================================"
echo "✅ Cleanup completed!"
echo "========================================"
echo ""
echo "📊 Remaining resources:"
kubectl get all

echo ""
echo "Note: The PostgreSQL data at /Users/danieloots/LOOTS_PG/ was NOT deleted"
