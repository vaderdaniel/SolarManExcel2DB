# Kubernetes Init Container Tests

This directory contains integration tests for verifying the init container behavior in Kubernetes deployments.

## Overview

The tests verify that init containers properly coordinate the startup sequence of pods by ensuring dependent services are available before main containers start.

## Test Cases

### 1. Backend Wait for PostgreSQL (Test 1)
**Purpose**: Verify that the backend pod's init container waits for PostgreSQL on port 5432 before starting the main backend container.

**Verification**:
- Checks that `backend-deployment.yaml` has a `wait-for-postgres` init container
- Validates the init container command targets `postgres-service:5432`
- Confirms the init container uses `nc` (netcat) to test connectivity

### 2. Frontend Wait for Backend (Test 2)
**Purpose**: Verify that the frontend pod's init container waits for the backend service on port 8080 before starting the main frontend container.

**Verification**:
- Checks that `frontend-deployment.yaml` has a `wait-for-backend` init container
- Validates the init container command targets `backend-service:8080`
- Confirms the init container uses `nc` (netcat) to test connectivity

### 3. Grafana Wait for PostgreSQL (Test 3)
**Purpose**: Verify that the Grafana pod's init container waits for PostgreSQL on port 5432 before starting the main Grafana container.

**Verification**:
- Checks that `grafana-deployment.yaml` has a `wait-for-postgres` init container
- Validates the init container command targets `postgres-service:5432`
- Confirms the init container uses `nc` (netcat) to test connectivity

### 4. Continuous Polling (Test 4)
**Purpose**: Verify that init containers continuously poll dependent services until connectivity is established.

**Verification**:
- Confirms all init containers use `until` loops for continuous polling
- Validates that `sleep` commands are present for retry intervals
- Ensures the polling continues until the target service is reachable

### 5. Startup Sequence (Test 5)
**Purpose**: Verify that main containers do not start until their respective init containers successfully complete.

**Verification**:
- For running pods, checks that when init containers are in `running` or `waiting` state, main containers are not running
- Confirms that main containers only start after init containers reach `terminated` state
- Validates proper Kubernetes init container semantics

## Prerequisites

- `kubectl` installed and configured
- Access to a Kubernetes cluster (local or remote)
- Deployments must be applied to the cluster before running runtime tests

## Test Scripts

There are three test scripts available:

### 1. Test Suite Runner (`run-all-tests.sh`) - RECOMMENDED
**Master test runner** that executes both validation and integration tests with intelligent fallback.
- Always runs YAML validation tests
- Automatically runs integration tests if cluster is available
- Gracefully skips integration tests if no cluster is found
- Provides comprehensive summary

### 2. YAML Validation Tests (`validate-init-containers.sh`)
**Static tests** that validate YAML configuration without requiring a running cluster.

### 3. Integration Tests (`init-container-tests.sh`)
**Runtime tests** that verify actual behavior in a running Kubernetes cluster.

## Running the Tests

### Recommended - Run Complete Test Suite:
```bash
chmod +x k8s/tests/run-all-tests.sh
./k8s/tests/run-all-tests.sh
```

This will:
1. Run all YAML validation tests (always)
2. Run integration tests if cluster is available (or skip gracefully)
3. Provide a comprehensive summary

### Alternative - Run YAML Validation Only (No cluster required):
```bash
chmod +x k8s/tests/validate-init-containers.sh
./k8s/tests/validate-init-containers.sh
```

This validates:
- Init container configuration is present
- Target services and ports are correct
- Continuous polling logic exists
- Proper YAML syntax

### Full Integration Tests (Requires running cluster):
```bash
chmod +x k8s/tests/init-container-tests.sh
./k8s/tests/init-container-tests.sh
```

This validates:
- Runtime behavior of init containers
- Startup sequencing
- Pod lifecycle management

### Expected Output - YAML Validation:
```
================================================
  Init Container YAML Validation Tests
================================================

[INFO] Testing files in: /path/to/k8s

[INFO] Test 1: Backend deployment contains wait-for-postgres init container
[PASS] Backend deployment contains wait-for-postgres init container

[INFO] Test 2: Backend init container configured for postgres-service:5432
[PASS] Backend init container correctly targets postgres-service:5432

[INFO] Test 3: Backend init container has continuous polling logic
[PASS] Backend init container has continuous polling with sleep intervals

... (15 more tests)

================================================
  Test Results
================================================
Tests Passed: 19
Tests Failed: 0

All validation tests passed!
```

### Expected Output - Integration Tests:
```
================================================
  Kubernetes Init Container Integration Tests
================================================

[INFO] Connected to Kubernetes cluster

[INFO] Test 1: Backend init container waits for PostgreSQL on port 5432
[PASS] Backend deployment has wait-for-postgres init container configured for postgres-service:5432

[INFO] Test 2: Frontend init container waits for backend service on port 8080
[PASS] Frontend deployment has wait-for-backend init container configured for backend-service:8080

[INFO] Test 3: Grafana init container waits for PostgreSQL on port 5432
[PASS] Grafana deployment has wait-for-postgres init container configured for postgres-service:5432

[INFO] Test 4: Init containers continuously poll the dependent service
[PASS] Backend init container has continuous polling with retry logic
[PASS] Frontend init container has continuous polling with retry logic
[PASS] Grafana init container has continuous polling with retry logic

[INFO] Test 5: Main container does not start until init container completes
[PASS] Init container configuration ensures proper startup sequence

================================================
  Test Results
================================================
Tests Passed: 7
Tests Failed: 0

All tests passed!
```

## Test Types

### Static Configuration Tests (Tests 1-4)
These tests verify the YAML configuration by querying the Kubernetes API for deployment specifications. They can run even if pods are not currently running.

### Runtime Behavior Tests (Test 5)
These tests verify actual pod behavior when pods are running. They check the real-time status of init containers and main containers to ensure proper startup sequencing.

## Troubleshooting

### kubectl not found
Ensure `kubectl` is installed:
```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
```

### Cannot connect to cluster
Ensure your Kubernetes cluster is running:
```bash
# For Docker Desktop
# Enable Kubernetes in Docker Desktop settings

# For Minikube
minikube start

# Verify cluster connection
kubectl cluster-info
```

### Deployments not found
Apply the deployments first:
```bash
# From the project root
kubectl apply -f k8s/postgres-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/grafana-deployment.yaml
```

### Tests pass but want to see runtime behavior
To observe init containers in action, you can temporarily make a service unavailable and watch the init container retry:

```bash
# Scale down postgres to see backend init container waiting
kubectl scale deployment postgres --replicas=0

# Watch backend pod status (init container will keep retrying)
kubectl get pods -l app=backend -w

# Check init container logs
kubectl logs <backend-pod-name> -c wait-for-postgres

# Restore postgres
kubectl scale deployment postgres --replicas=1
```

## Integration with CI/CD

These tests can be integrated into a CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Init Container Tests
  run: |
    # Setup cluster (e.g., kind, minikube)
    kind create cluster
    
    # Apply configurations
    kubectl apply -f k8s/
    
    # Run tests
    ./k8s/tests/init-container-tests.sh
```

## Related Documentation

- [Kubernetes Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
- [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- Project deployment guide: `DOCKER_KUBERNETES_DEPLOYMENT.md`
- Startup sequence changelog: `CHANGELOG_STARTUP_SEQUENCE.md`
