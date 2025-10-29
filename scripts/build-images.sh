#!/bin/bash

# Script to build all Docker images for SolarMan application
# This script must be run from the project root directory

set -e

echo "========================================"
echo "Building SolarMan Docker Images"
echo "========================================"

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Build PostgreSQL image
echo ""
echo "📦 Building PostgreSQL image..."
docker build -t solarman-postgres:latest -f docker/postgresql/Dockerfile docker/postgresql/
echo "✅ PostgreSQL image built successfully"

# Build Backend image (includes frontend build)
echo ""
echo "📦 Building Backend image (this may take several minutes)..."
docker build -t solarman-backend:latest -f backend/Dockerfile .
echo "✅ Backend image built successfully"

# Build Frontend image
echo ""
echo "📦 Building Frontend image..."
docker build -t solarman-frontend:latest -f frontend/Dockerfile frontend/
echo "✅ Frontend image built successfully"

echo ""
echo "========================================"
echo "✅ All images built successfully!"
echo "========================================"
echo ""
echo "Available images:"
docker images | grep solarman

echo ""
echo "Next steps:"
echo "  - Test with Docker Compose: ./scripts/docker-compose-up.sh"
echo "  - Deploy to Kubernetes: ./scripts/k8s-deploy.sh"
