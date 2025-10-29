# Docker & Kubernetes Deployment Guide

This guide covers deploying the SolarMan application using Docker and Kubernetes (Rancher Desktop) on macOS.

## 📋 Prerequisites

- **Docker**: Installed via Rancher Desktop
- **Kubernetes**: Running via Rancher Desktop
- **kubectl**: Command-line tool for Kubernetes
- **PostgreSQL Data**: Existing database at `/Users/danieloots/LOOTS_PG/`

## 🏗️ Architecture Overview

The application consists of three containerized services:

1. **PostgreSQL**: Database service (ClusterIP)
   - Uses existing data at `/Users/danieloots/LOOTS_PG/`
   - Internal port: 5432
   
2. **Spring Boot Backend**: REST API service (ClusterIP)
   - Internal port: 8080
   - Not exposed externally
   
3. **Angular Frontend**: Web UI with nginx (NodePort)
   - External access: `http://localhost:30080`
   - Proxies API requests to backend

## 🚀 Quick Start

### Option 1: Kubernetes Deployment (Recommended)

```bash
# 1. Build Docker images
./scripts/build-images.sh

# 2. Deploy to Kubernetes
./scripts/k8s-deploy.sh

# 3. Access the application
open http://localhost:30080
```

### Option 2: Docker Compose (Testing)

```bash
# 1. Build and start with Docker Compose
./scripts/docker-compose-up.sh

# 2. Access the application
open http://localhost:8081
```

## 📦 Building Docker Images

Build all three Docker images from source:

```bash
./scripts/build-images.sh
```

This script builds:
- `solarman-postgres:latest` - PostgreSQL 16 with Alpine Linux
- `solarman-backend:latest` - Spring Boot backend with embedded frontend
- `solarman-frontend:latest` - Angular app served with nginx

**Build times:**
- PostgreSQL: ~30 seconds
- Backend: ~5-10 minutes (includes Maven dependencies and Angular build)
- Frontend: ~3-5 minutes (includes npm dependencies)

### Manual Build Commands

If you need to build images individually:

```bash
# PostgreSQL
docker build -t solarman-postgres:latest -f docker/postgresql/Dockerfile docker/postgresql/

# Backend (includes frontend build)
docker build -t solarman-backend:latest -f backend/Dockerfile .

# Frontend
docker build -t solarman-frontend:latest -f frontend/Dockerfile frontend/
```

## ☸️ Kubernetes Deployment

### Deploy Application

```bash
./scripts/k8s-deploy.sh
```

This script performs the following steps:
1. Applies ConfigMap with database credentials
2. Creates PersistentVolume and PersistentVolumeClaim for PostgreSQL
3. Deploys PostgreSQL and waits for readiness
4. Deploys Backend and waits for readiness
5. Deploys Frontend and waits for readiness

### Access Application

- **Frontend URL**: http://localhost:30080
- **Backend API**: Not exposed externally (ClusterIP only)
- **PostgreSQL**: Not exposed externally (ClusterIP only)

### View Deployment Status

```bash
# All resources
kubectl get all

# Pods
kubectl get pods

# Services
kubectl get svc

# ConfigMaps
kubectl get configmap

# PersistentVolumes
kubectl get pv,pvc
```

### View Logs

```bash
# Frontend logs
kubectl logs -l app=frontend -f

# Backend logs
kubectl logs -l app=backend -f

# PostgreSQL logs
kubectl logs -l app=postgres -f
```

### Delete Deployment

```bash
./scripts/k8s-delete.sh
```

**Note**: This does NOT delete the PostgreSQL data at `/Users/danieloots/LOOTS_PG/`

## 🐳 Docker Compose Deployment

### Start Services

```bash
./scripts/docker-compose-up.sh
```

### Access Application

- **Frontend**: http://localhost:8081
- **Backend API**: http://localhost:8080/api
- **PostgreSQL**: localhost:5432

### View Logs

```bash
# All services
docker-compose logs -f

# Individual services
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Stop Services

```bash
docker-compose down
```

## 🗂️ Project Structure

```
SolarManExcel2DB/
├── backend/
│   ├── Dockerfile                 # Multi-stage build for Spring Boot
│   ├── src/
│   └── pom.xml
├── frontend/
│   ├── Dockerfile                 # Multi-stage build for Angular
│   ├── nginx.conf                 # Nginx configuration with API proxy
│   └── solarman-ui/
├── docker/
│   └── postgresql/
│       └── Dockerfile             # PostgreSQL with existing data
├── k8s/
│   ├── configmap.yaml             # Database credentials
│   ├── postgres-pv.yaml           # PersistentVolume with hostPath
│   ├── postgres-deployment.yaml   # PostgreSQL Deployment & Service
│   ├── backend-deployment.yaml    # Backend Deployment & Service
│   └── frontend-deployment.yaml   # Frontend Deployment & Service
├── scripts/
│   ├── build-images.sh            # Build all Docker images
│   ├── docker-compose-up.sh       # Start Docker Compose
│   ├── k8s-deploy.sh              # Deploy to Kubernetes
│   └── k8s-delete.sh              # Delete from Kubernetes
└── docker-compose.yml             # Docker Compose configuration
```

## ⚙️ Configuration

### Database Credentials

Stored in `k8s/configmap.yaml`:
```yaml
DB_USER: danieloots
DB_PASSWORD: SeweEen0528
POSTGRES_DB: LOOTS
```

### Environment Variables

**Backend** (from ConfigMap):
- `SPRING_DATASOURCE_URL`: jdbc:postgresql://postgres-service:5432/LOOTS
- `SPRING_DATASOURCE_USERNAME`: danieloots
- `SPRING_DATASOURCE_PASSWORD`: SeweEen0528
- `DB_USER`: danieloots
- `DB_PASSWORD`: SeweEen0528

**PostgreSQL** (from ConfigMap):
- `POSTGRES_DB`: LOOTS
- `POSTGRES_USER`: danieloots
- `POSTGRES_PASSWORD`: SeweEen0528
- `PGDATA`: /var/lib/postgresql/data/pgdata

### Networking

**Kubernetes Services**:
- `postgres-service`: ClusterIP on port 5432
- `backend-service`: ClusterIP on port 8080
- `frontend-service`: NodePort 30080 → 80

**Docker Compose**:
- All services on `solarman-network` bridge network
- PostgreSQL: localhost:5432
- Backend: localhost:8080
- Frontend: localhost:8081

### Resource Limits

**PostgreSQL**:
- Requests: 256Mi memory, 250m CPU
- Limits: 512Mi memory, 500m CPU

**Backend**:
- Requests: 512Mi memory, 500m CPU
- Limits: 1Gi memory, 1000m CPU

**Frontend**:
- Requests: 128Mi memory, 100m CPU
- Limits: 256Mi memory, 200m CPU

## 🔍 Troubleshooting

### Images Not Found in Kubernetes

If you see `ErrImageNeverPull` or similar errors:

```bash
# Verify images exist
docker images | grep solarman

# Rebuild if needed
./scripts/build-images.sh
```

### PersistentVolume Not Binding

Check that the directory exists and is accessible:

```bash
ls -la /Users/danieloots/LOOTS_PG/

# View PV/PVC status
kubectl get pv,pvc
kubectl describe pvc postgres-pvc
```

### Backend Health Checks Failing

The backend has health checks at `/api/health`. If failing:

```bash
# Check backend logs
kubectl logs -l app=backend -f

# Check if PostgreSQL is ready
kubectl get pods -l app=postgres

# Test database connection
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U danieloots -d LOOTS -c '\dt'
```

### Port Already in Use (Docker Compose)

If ports 8080, 8081, or 5432 are in use:

```bash
# Check what's using the ports
lsof -i :8080
lsof -i :8081
lsof -i :5432

# Stop conflicting services or change ports in docker-compose.yml
```

### Frontend Can't Reach Backend

Check nginx proxy configuration:

```bash
# View nginx config in container
docker exec solarman-frontend cat /etc/nginx/conf.d/default.conf

# Or for Kubernetes
kubectl exec -it $(kubectl get pod -l app=frontend -o jsonpath='{.items[0].metadata.name}') -- cat /etc/nginx/conf.d/default.conf
```

### Rancher Desktop Kubernetes Issues

```bash
# Restart Kubernetes in Rancher Desktop
# Or reset Kubernetes cluster via Rancher Desktop UI

# Verify kubectl is working
kubectl cluster-info
kubectl get nodes
```

## 🔐 Security Considerations

**Current Setup** (Development):
- Database credentials in ConfigMap (not encrypted)
- Simple NodePort exposure
- No TLS/SSL

**Production Recommendations**:
- Use Kubernetes Secrets instead of ConfigMap
- Implement TLS/SSL certificates
- Use Ingress controller with proper authentication
- Enable PostgreSQL SSL connections
- Use network policies to restrict traffic
- Regular security updates for base images

## 📊 Monitoring

### Check Resource Usage

```bash
# Pod resource usage
kubectl top pods

# Node resource usage
kubectl top nodes
```

### Database Monitoring

```bash
# Connect to PostgreSQL
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U danieloots -d LOOTS

# Check table size
\dt+

# Check recent data
SELECT COUNT(*), MAX(updated), MIN(updated) FROM public.loots_inverter;
```

## 🔄 Updating the Application

### Update Backend Code

```bash
# 1. Make changes to backend code
# 2. Rebuild backend image
docker build -t solarman-backend:latest -f backend/Dockerfile .

# 3. Restart backend pods in Kubernetes
kubectl rollout restart deployment/backend

# Or for Docker Compose
docker-compose up -d --build backend
```

### Update Frontend Code

```bash
# 1. Make changes to frontend code
# 2. Rebuild frontend image
docker build -t solarman-frontend:latest -f frontend/Dockerfile frontend/

# 3. Restart frontend pods in Kubernetes
kubectl rollout restart deployment/frontend

# Or for Docker Compose
docker-compose up -d --build frontend
```

### Update Database Schema

```bash
# Connect to PostgreSQL
kubectl exec -it $(kubectl get pod -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- psql -U danieloots -d LOOTS

# Run migration SQL
\i /path/to/migration.sql
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Rancher Desktop](https://rancherdesktop.io/)
- [Spring Boot on Kubernetes](https://spring.io/guides/gs/spring-boot-kubernetes/)
- [Angular Deployment](https://angular.io/guide/deployment)

## 🆘 Support

For issues specific to:
- **Docker/Kubernetes setup**: Check Rancher Desktop logs
- **Backend issues**: Review Spring Boot logs with `kubectl logs`
- **Frontend issues**: Check nginx logs and browser console
- **Database issues**: Check PostgreSQL logs and connection settings

---

**Last Updated**: October 29, 2025
