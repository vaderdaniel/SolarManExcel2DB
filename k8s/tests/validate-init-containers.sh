#!/bin/bash
# Unit tests for init container YAML configurations
# These tests validate the YAML files directly without requiring a running Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
K8S_DIR="$(dirname "$SCRIPT_DIR")"

# Helper functions
log_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

log_failure() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

# Check if yq is available for YAML parsing
check_yaml_parser() {
    if command -v yq &> /dev/null; then
        return 0
    else
        log_info "yq not found, using grep-based validation"
        return 1
    fi
}

# Test 1: Backend deployment has wait-for-postgres init container
test_backend_init_container_exists() {
    log_info "Test 1: Backend deployment contains wait-for-postgres init container"
    
    local file="$K8S_DIR/backend-deployment.yaml"
    
    if [ ! -f "$file" ]; then
        log_failure "Backend deployment file not found at $file"
        return 1
    fi
    
    if grep -q "wait-for-postgres" "$file"; then
        log_success "Backend deployment contains wait-for-postgres init container"
        return 0
    else
        log_failure "Backend deployment missing wait-for-postgres init container"
        return 1
    fi
}

# Test 2: Backend init container targets postgres-service:5432
test_backend_init_container_config() {
    log_info "Test 2: Backend init container configured for postgres-service:5432"
    
    local file="$K8S_DIR/backend-deployment.yaml"
    
    if grep -A5 "wait-for-postgres" "$file" | grep -q "postgres-service" && \
       grep -A5 "wait-for-postgres" "$file" | grep -q "5432"; then
        log_success "Backend init container correctly targets postgres-service:5432"
        return 0
    else
        log_failure "Backend init container not properly configured"
        return 1
    fi
}

# Test 3: Backend init container has retry logic
test_backend_init_container_retry() {
    log_info "Test 3: Backend init container has continuous polling logic"
    
    local file="$K8S_DIR/backend-deployment.yaml"
    
    if grep -A5 "wait-for-postgres" "$file" | grep -q "until" && \
       grep -A5 "wait-for-postgres" "$file" | grep -q "sleep"; then
        log_success "Backend init container has continuous polling with sleep intervals"
        return 0
    else
        log_failure "Backend init container missing retry/polling logic"
        return 1
    fi
}

# Test 4: Frontend deployment has wait-for-backend init container
test_frontend_init_container_exists() {
    log_info "Test 4: Frontend deployment contains wait-for-backend init container"
    
    local file="$K8S_DIR/frontend-deployment.yaml"
    
    if [ ! -f "$file" ]; then
        log_failure "Frontend deployment file not found at $file"
        return 1
    fi
    
    if grep -q "wait-for-backend" "$file"; then
        log_success "Frontend deployment contains wait-for-backend init container"
        return 0
    else
        log_failure "Frontend deployment missing wait-for-backend init container"
        return 1
    fi
}

# Test 5: Frontend init container targets backend-service:8080
test_frontend_init_container_config() {
    log_info "Test 5: Frontend init container configured for backend-service:8080"
    
    local file="$K8S_DIR/frontend-deployment.yaml"
    
    if grep -A5 "wait-for-backend" "$file" | grep -q "backend-service" && \
       grep -A5 "wait-for-backend" "$file" | grep -q "8080"; then
        log_success "Frontend init container correctly targets backend-service:8080"
        return 0
    else
        log_failure "Frontend init container not properly configured"
        return 1
    fi
}

# Test 6: Frontend init container has retry logic
test_frontend_init_container_retry() {
    log_info "Test 6: Frontend init container has continuous polling logic"
    
    local file="$K8S_DIR/frontend-deployment.yaml"
    
    if grep -A5 "wait-for-backend" "$file" | grep -q "until" && \
       grep -A5 "wait-for-backend" "$file" | grep -q "sleep"; then
        log_success "Frontend init container has continuous polling with sleep intervals"
        return 0
    else
        log_failure "Frontend init container missing retry/polling logic"
        return 1
    fi
}

# Test 7: Grafana deployment has wait-for-postgres init container
test_grafana_init_container_exists() {
    log_info "Test 7: Grafana deployment contains wait-for-postgres init container"
    
    local file="$K8S_DIR/grafana-deployment.yaml"
    
    if [ ! -f "$file" ]; then
        log_failure "Grafana deployment file not found at $file"
        return 1
    fi
    
    if grep -q "wait-for-postgres" "$file"; then
        log_success "Grafana deployment contains wait-for-postgres init container"
        return 0
    else
        log_failure "Grafana deployment missing wait-for-postgres init container"
        return 1
    fi
}

# Test 8: Grafana init container targets postgres-service:5432
test_grafana_init_container_config() {
    log_info "Test 8: Grafana init container configured for postgres-service:5432"
    
    local file="$K8S_DIR/grafana-deployment.yaml"
    
    if grep -A5 "wait-for-postgres" "$file" | grep -q "postgres-service" && \
       grep -A5 "wait-for-postgres" "$file" | grep -q "5432"; then
        log_success "Grafana init container correctly targets postgres-service:5432"
        return 0
    else
        log_failure "Grafana init container not properly configured"
        return 1
    fi
}

# Test 9: Grafana init container has retry logic
test_grafana_init_container_retry() {
    log_info "Test 9: Grafana init container has continuous polling logic"
    
    local file="$K8S_DIR/grafana-deployment.yaml"
    
    if grep -A5 "wait-for-postgres" "$file" | grep -q "until" && \
       grep -A5 "wait-for-postgres" "$file" | grep -q "sleep"; then
        log_success "Grafana init container has continuous polling with sleep intervals"
        return 0
    else
        log_failure "Grafana init container missing retry/polling logic"
        return 1
    fi
}

# Test 10: Init containers are properly positioned before main containers
test_init_container_position() {
    log_info "Test 10: Init containers are defined before main containers"
    
    local passed=true
    
    # Check backend
    local backend_init_line=$(grep -n "initContainers:" "$K8S_DIR/backend-deployment.yaml" | cut -d: -f1)
    local backend_container_line=$(grep -n "containers:" "$K8S_DIR/backend-deployment.yaml" | cut -d: -f1)
    
    if [ "$backend_init_line" -lt "$backend_container_line" ]; then
        log_success "Backend: initContainers defined before containers"
    else
        log_failure "Backend: initContainers not properly positioned"
        passed=false
    fi
    
    # Check frontend
    local frontend_init_line=$(grep -n "initContainers:" "$K8S_DIR/frontend-deployment.yaml" | cut -d: -f1)
    local frontend_container_line=$(grep -n "containers:" "$K8S_DIR/frontend-deployment.yaml" | cut -d: -f1)
    
    if [ "$frontend_init_line" -lt "$frontend_container_line" ]; then
        log_success "Frontend: initContainers defined before containers"
    else
        log_failure "Frontend: initContainers not properly positioned"
        passed=false
    fi
    
    # Check grafana
    local grafana_init_line=$(grep -n "initContainers:" "$K8S_DIR/grafana-deployment.yaml" | cut -d: -f1)
    local grafana_container_line=$(grep -n "containers:" "$K8S_DIR/grafana-deployment.yaml" | cut -d: -f1)
    
    if [ "$grafana_init_line" -lt "$grafana_container_line" ]; then
        log_success "Grafana: initContainers defined before containers"
    else
        log_failure "Grafana: initContainers not properly positioned"
        passed=false
    fi
    
    if $passed; then
        return 0
    else
        return 1
    fi
}

# Test 11: Init containers use appropriate base image
test_init_container_image() {
    log_info "Test 11: Init containers use busybox image with nc utility"
    
    local passed=true
    
    # Check all deployments use busybox
    for file in "$K8S_DIR/backend-deployment.yaml" "$K8S_DIR/frontend-deployment.yaml" "$K8S_DIR/grafana-deployment.yaml"; do
        if grep -A2 "initContainers:" "$file" | grep -q "busybox"; then
            log_success "$(basename $file): Init container uses busybox image"
        else
            log_failure "$(basename $file): Init container not using busybox image"
            passed=false
        fi
    done
    
    if $passed; then
        return 0
    else
        return 1
    fi
}

# Test 12: Validate YAML syntax
test_yaml_syntax() {
    log_info "Test 12: Validate YAML syntax for all deployment files"
    
    local passed=true
    
    # Check if we have kubectl for dry-run validation
    if command -v kubectl &> /dev/null; then
        for file in "$K8S_DIR"/*-deployment.yaml; do
            if kubectl apply --dry-run=client -f "$file" &> /dev/null; then
                log_success "$(basename $file): Valid Kubernetes YAML syntax"
            else
                log_failure "$(basename $file): Invalid Kubernetes YAML syntax"
                passed=false
            fi
        done
    # Check if we have yamllint
    elif command -v yamllint &> /dev/null; then
        for file in "$K8S_DIR"/*-deployment.yaml; do
            if yamllint -d relaxed "$file" &> /dev/null; then
                log_success "$(basename $file): Valid YAML syntax"
            else
                log_failure "$(basename $file): Invalid YAML syntax"
                passed=false
            fi
        done
    # Try Python with PyYAML
    elif command -v python3 &> /dev/null && python3 -c "import yaml" 2> /dev/null; then
        # Use Python's YAML parser as fallback
        for file in "$K8S_DIR"/*-deployment.yaml; do
            if python3 -c "import yaml; list(yaml.safe_load_all(open('$file')))" 2> /dev/null; then
                log_success "$(basename $file): Valid YAML syntax"
            else
                log_failure "$(basename $file): Invalid YAML syntax"
                passed=false
            fi
        done
    else
        log_info "No YAML validator found (tried kubectl, yamllint, python3+yaml), skipping syntax validation"
        return 0
    fi
    
    if $passed; then
        return 0
    else
        return 1
    fi
}

# Main test execution
main() {
    echo "================================================"
    echo "  Init Container YAML Validation Tests"
    echo "================================================"
    echo ""
    
    log_info "Testing files in: $K8S_DIR"
    echo ""
    
    # Run all tests
    test_backend_init_container_exists || true
    echo ""
    
    test_backend_init_container_config || true
    echo ""
    
    test_backend_init_container_retry || true
    echo ""
    
    test_frontend_init_container_exists || true
    echo ""
    
    test_frontend_init_container_config || true
    echo ""
    
    test_frontend_init_container_retry || true
    echo ""
    
    test_grafana_init_container_exists || true
    echo ""
    
    test_grafana_init_container_config || true
    echo ""
    
    test_grafana_init_container_retry || true
    echo ""
    
    test_init_container_position || true
    echo ""
    
    test_init_container_image || true
    echo ""
    
    test_yaml_syntax || true
    echo ""
    
    # Summary
    echo "================================================"
    echo "  Test Results"
    echo "================================================"
    echo -e "${GREEN}Tests Passed:${NC} $TESTS_PASSED"
    echo -e "${RED}Tests Failed:${NC} $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All validation tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some validation tests failed!${NC}"
        exit 1
    fi
}

# Run main function
main
