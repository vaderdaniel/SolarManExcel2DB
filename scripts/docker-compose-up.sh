#!/bin/bash

# Script to start the application using Docker Compose
# Use this for local testing before Kubernetes deployment

set -e

echo "========================================"
echo "Starting SolarMan with Docker Compose"
echo "========================================"

# Check if running from correct directory
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Stop and remove existing containers
echo ""
echo "🧹 Cleaning up existing containers..."
docker-compose down -v

# Start services
echo ""
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check status
echo ""
echo "📊 Service status:"
docker-compose ps

echo ""
echo "========================================"
echo "✅ Services started successfully!"
echo "========================================"
echo ""
echo "Access the application:"
echo "  Frontend: http://localhost:8081"
echo "  Backend API: http://localhost:8080/api"
echo "  PostgreSQL: localhost:5432"
echo ""
echo "View logs:"
echo "  All services: docker-compose logs -f"
echo "  Frontend: docker-compose logs -f frontend"
echo "  Backend: docker-compose logs -f backend"
echo "  PostgreSQL: docker-compose logs -f postgres"
echo ""
echo "Stop services: docker-compose down"
