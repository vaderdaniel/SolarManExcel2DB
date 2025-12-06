# Init Container Tests - Quick Reference

## 🚀 Quick Start

```bash
# Run all tests (recommended)
./k8s/tests/run-all-tests.sh
```

## 📋 Test Scripts

| Script | Purpose | Requires Cluster |
|--------|---------|------------------|
| `run-all-tests.sh` | Run complete test suite | Optional |
| `validate-init-containers.sh` | Validate YAML configuration | ❌ No |
| `init-container-tests.sh` | Test runtime behavior | ✅ Yes |

## ✅ Test Coverage

All 5 requirements are fully tested:

1. ✅ Backend waits for PostgreSQL:5432
2. ✅ Frontend waits for Backend:8080
3. ✅ Grafana waits for PostgreSQL:5432
4. ✅ Continuous polling with retry
5. ✅ Main container waits for init completion

## 📊 Test Results

### Current Status
- **YAML Validation**: 19 tests
- **Integration Tests**: 5-9 tests (dynamic)
- **Total**: 24-28 tests

### Expected Results
```
Tests Passed: 24-28
Tests Failed: 0
Overall Status: SUCCESS
```

## 🔧 Common Commands

```bash
# Make scripts executable (first time only)
chmod +x k8s/tests/*.sh

# Run complete suite
./k8s/tests/run-all-tests.sh

# Run only YAML validation (no cluster)
./k8s/tests/validate-init-containers.sh

# Run only integration tests (requires cluster)
./k8s/tests/init-container-tests.sh
```

## 🐛 Troubleshooting

### Tests fail with "kubectl not found"
```bash
# Install kubectl (macOS)
brew install kubectl

# Verify installation
kubectl version --client
```

### Tests fail with "Cannot connect to cluster"
```bash
# Check cluster status
kubectl cluster-info

# For Docker Desktop: Enable Kubernetes in settings
# For Minikube: minikube start
```

### Integration tests are skipped
This is normal if no cluster is running. The test suite will:
- ✅ Run all YAML validation tests
- ⚠️  Skip integration tests gracefully
- ✅ Report overall SUCCESS

## 📖 More Information

- Full documentation: `k8s/tests/README.md`
- Detailed test breakdown: `k8s/tests/TEST_SUMMARY.md`
- Deployment guide: `DOCKER_KUBERNETES_DEPLOYMENT.md`
