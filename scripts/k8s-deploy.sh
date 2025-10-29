#!/bin/bash

# Script to deploy SolarMan application to Kubernetes (Rancher Desktop)
# This script must be run from the project root directory

set -e

echo "========================================"
echo "Deploying SolarMan to Kubernetes"
echo "========================================"

# Check if running from correct directory
if [ ! -d "k8s" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Check if images are built
echo ""
echo "🔍 Checking for Docker images..."
if ! docker images | grep -q "solarman-postgres"; then
    echo "❌ Error: solarman-postgres image not found"
    echo "Please run: ./scripts/build-images.sh"
    exit 1
fi
if ! docker images | grep -q "solarman-backend"; then
    echo "❌ Error: solarman-backend image not found"
    echo "Please run: ./scripts/build-images.sh"
    exit 1
fi
if ! docker images | grep -q "solarman-frontend"; then
    echo "❌ Error: solarman-frontend image not found"
    echo "Please run: ./scripts/build-images.sh"
    exit 1
fi
echo "✅ All Docker images found"

# Apply ConfigMap
echo ""
echo "📝 Applying ConfigMap..."
kubectl apply -f k8s/configmap.yaml

# Apply PersistentVolume and PersistentVolumeClaim
echo ""
echo "💾 Applying PersistentVolume and PVC..."
kubectl apply -f k8s/postgres-pv.yaml

# Wait for PVC to be bound
echo "⏳ Waiting for PVC to be bound..."
kubectl wait --for=condition=bound pvc/postgres-pvc --timeout=60s || true

# Deploy PostgreSQL
echo ""
echo "🗄️  Deploying PostgreSQL..."
kubectl apply -f k8s/postgres-deployment.yaml

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=120s

# Deploy Backend
echo ""
echo "☕ Deploying Backend..."
kubectl apply -f k8s/backend-deployment.yaml

# Wait for Backend to be ready
echo "⏳ Waiting for Backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend --timeout=180s

# Deploy Frontend
echo ""
echo "🌐 Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

# Wait for Frontend to be ready
echo "⏳ Waiting for Frontend to be ready..."
kubectl wait --for=condition=ready pod -l app=frontend --timeout=120s

# Display deployment status
echo ""
echo "========================================"
echo "✅ Deployment completed successfully!"
echo "========================================"
echo ""
echo "📊 Deployment status:"
kubectl get all

echo ""
echo "========================================"
echo "🌐 Access Information"
echo "========================================"
echo "Frontend: http://localhost:30080"
echo ""
echo "Useful commands:"
echo "  View all resources: kubectl get all"
echo "  View pods: kubectl get pods"
echo "  View services: kubectl get svc"
echo "  View logs (frontend): kubectl logs -l app=frontend -f"
echo "  View logs (backend): kubectl logs -l app=backend -f"
echo "  View logs (postgres): kubectl logs -l app=postgres -f"
echo "  Delete deployment: ./scripts/k8s-delete.sh"
echo ""
