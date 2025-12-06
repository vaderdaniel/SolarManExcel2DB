# Init Container Test Summary

This document provides a comprehensive overview of all tests that verify init container behavior in the Kubernetes deployments.

## Test Coverage Overview

| Test Category | Test Script | Tests | Description |
|--------------|-------------|-------|-------------|
| YAML Validation | `validate-init-containers.sh` | 19 tests | Static validation of YAML configuration |
| Integration | `init-container-tests.sh` | 5-9 tests | Runtime behavior verification |
| **Total** | `run-all-tests.sh` | **24-28 tests** | **Complete test suite** |

## Detailed Test Cases

### YAML Validation Tests (19 tests)

These tests validate the YAML configuration files directly without requiring a running cluster.

#### Backend Init Container Tests (3 tests)
1. **Backend deployment contains wait-for-postgres init container**
   - Verifies that `backend-deployment.yaml` includes an init container named `wait-for-postgres`
   
2. **Backend init container configured for postgres-service:5432**
   - Validates that the init container targets the correct service and port
   - Confirms the command includes `postgres-service` and `5432`
   
3. **Backend init container has continuous polling logic**
   - Ensures the init container uses `until` loop for continuous polling
   - Verifies `sleep` command is present for retry intervals

#### Frontend Init Container Tests (3 tests)
4. **Frontend deployment contains wait-for-backend init container**
   - Verifies that `frontend-deployment.yaml` includes an init container named `wait-for-backend`
   
5. **Frontend init container configured for backend-service:8080**
   - Validates that the init container targets the correct service and port
   - Confirms the command includes `backend-service` and `8080`
   
6. **Frontend init container has continuous polling logic**
   - Ensures the init container uses `until` loop for continuous polling
   - Verifies `sleep` command is present for retry intervals

#### Grafana Init Container Tests (3 tests)
7. **Grafana deployment contains wait-for-postgres init container**
   - Verifies that `grafana-deployment.yaml` includes an init container named `wait-for-postgres`
   
8. **Grafana init container configured for postgres-service:5432**
   - Validates that the init container targets the correct service and port
   - Confirms the command includes `postgres-service` and `5432`
   
9. **Grafana init container has continuous polling logic**
   - Ensures the init container uses `until` loop for continuous polling
   - Verifies `sleep` command is present for retry intervals

#### Structural Tests (3 tests)
10. **Backend: initContainers defined before containers**
    - Verifies proper YAML structure with init containers preceding main containers
    
11. **Frontend: initContainers defined before containers**
    - Verifies proper YAML structure with init containers preceding main containers
    
12. **Grafana: initContainers defined before containers**
    - Verifies proper YAML structure with init containers preceding main containers

#### Image Tests (3 tests)
13. **Backend init container uses busybox image**
    - Confirms the init container uses `busybox` image with `nc` utility
    
14. **Frontend init container uses busybox image**
    - Confirms the init container uses `busybox` image with `nc` utility
    
15. **Grafana init container uses busybox image**
    - Confirms the init container uses `busybox` image with `nc` utility

#### YAML Syntax Tests (4 tests)
16. **Backend deployment has valid Kubernetes YAML syntax**
    - Validates YAML syntax using `kubectl apply --dry-run`
    
17. **Frontend deployment has valid Kubernetes YAML syntax**
    - Validates YAML syntax using `kubectl apply --dry-run`
    
18. **Grafana deployment has valid Kubernetes YAML syntax**
    - Validates YAML syntax using `kubectl apply --dry-run`
    
19. **Postgres deployment has valid Kubernetes YAML syntax**
    - Validates YAML syntax using `kubectl apply --dry-run`

---

### Integration Tests (5-9 tests)

These tests verify actual runtime behavior when pods are running in a Kubernetes cluster.

#### Configuration Tests (3 tests)
1. **Backend init container waits for PostgreSQL on port 5432**
   - Queries the Kubernetes API for backend deployment specifications
   - Verifies init container command includes `postgres-service:5432`
   - **Requirement**: Backend deployment must be applied to cluster

2. **Frontend init container waits for backend service on port 8080**
   - Queries the Kubernetes API for frontend deployment specifications
   - Verifies init container command includes `backend-service:8080`
   - **Requirement**: Frontend deployment must be applied to cluster

3. **Grafana init container waits for PostgreSQL on port 5432**
   - Queries the Kubernetes API for Grafana deployment specifications
   - Verifies init container command includes `postgres-service:5432`
   - **Requirement**: Grafana deployment must be applied to cluster

#### Polling Logic Test (3 tests)
4. **Backend init container has continuous polling with retry logic**
   - Confirms polling command includes `until` and `sleep`
   
5. **Frontend init container has continuous polling with retry logic**
   - Confirms polling command includes `until` and `sleep`
   
6. **Grafana init container has continuous polling with retry logic**
   - Confirms polling command includes `until` and `sleep`

#### Runtime Behavior Test (1-3 tests, dynamic)
7. **Main container does not start until init container completes**
   - **Dynamic test**: Number of assertions depends on running pods
   - For each running pod (backend, frontend, grafana):
     - If init container is running/waiting → main container must not be running
     - If init container is terminated → main container can be running
   - If no pods are running → validates configuration is correct
   - **Passes**: 1-3 assertions depending on number of running pods

---

## Test Requirements Mapping

### Test Case to Requirement Mapping

| Your Requirement | Test Cases | Script |
|-----------------|------------|--------|
| 1. Backend waits for PostgreSQL:5432 | Validation Tests 1-3, Integration Test 1 | Both |
| 2. Frontend waits for Backend:8080 | Validation Tests 4-6, Integration Test 2 | Both |
| 3. Grafana waits for PostgreSQL:5432 | Validation Tests 7-9, Integration Test 3 | Both |
| 4. Continuous polling with retry | Validation Tests 3,6,9; Integration Tests 4-6 | Both |
| 5. Main container waits for init completion | Integration Test 7 | Integration only |

### Coverage Summary

✅ **All 5 requirements are covered** by both static validation and runtime integration tests.

- **Requirement 1**: 4 tests (3 validation + 1 integration)
- **Requirement 2**: 4 tests (3 validation + 1 integration)
- **Requirement 3**: 4 tests (3 validation + 1 integration)
- **Requirement 4**: 6 tests (3 validation + 3 integration)
- **Requirement 5**: 1-3 tests (integration only, dynamic)

---

## Running Tests

### Quick Start
```bash
# Run complete test suite (recommended)
./k8s/tests/run-all-tests.sh

# Or run individual test suites
./k8s/tests/validate-init-containers.sh      # No cluster required
./k8s/tests/init-container-tests.sh          # Requires cluster
```

### CI/CD Integration
```bash
# In CI pipeline (example)
cd k8s/tests
chmod +x *.sh

# Run validation tests (always)
./validate-init-containers.sh

# Run integration tests if cluster available
if kubectl cluster-info 2>/dev/null; then
    ./init-container-tests.sh
fi
```

---

## Test Output Examples

### Successful Validation Test Output
```
[INFO] Test 1: Backend deployment contains wait-for-postgres init container
[PASS] Backend deployment contains wait-for-postgres init container
```

### Successful Integration Test Output
```
[INFO] Test 1: Backend init container waits for PostgreSQL on port 5432
[PASS] Backend deployment has wait-for-postgres init container configured for postgres-service:5432
```

### Failed Test Output
```
[INFO] Test 1: Backend deployment contains wait-for-postgres init container
[FAIL] Backend deployment missing wait-for-postgres init container
```

---

## Test Maintenance

### Adding New Tests
1. Edit the appropriate test script (`validate-init-containers.sh` or `init-container-tests.sh`)
2. Add new test function following the naming convention `test_<description>()`
3. Update test counters using `log_success` and `log_failure`
4. Call the test function in the `main()` function
5. Update this summary document

### Modifying Existing Tests
1. Locate the test function in the appropriate script
2. Update the test logic
3. Ensure the test still follows the same patterns
4. Update documentation if the test behavior changes

---

## Test Design Principles

1. **Independence**: Each test is independent and can run in any order
2. **Idempotency**: Tests can be run multiple times with same results
3. **Clear Naming**: Test function names clearly describe what they test
4. **Graceful Degradation**: Integration tests gracefully handle missing resources
5. **Informative Output**: Each test provides clear pass/fail messages
6. **Color Coding**: Green for pass, red for fail, yellow for info/warnings

---

## Related Documentation

- Main README: `README.md`
- Deployment Guide: `DOCKER_KUBERNETES_DEPLOYMENT.md`
- Startup Sequence Changelog: `CHANGELOG_STARTUP_SEQUENCE.md`
- Kubernetes Official Docs: [Init Containers](https://kubernetes.io/docs/concepts/workloads/pods/init-containers/)
