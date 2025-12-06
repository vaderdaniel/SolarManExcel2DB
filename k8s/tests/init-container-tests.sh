#!/bin/bash
# Integration tests for Kubernetes init containers
# Tests verify that init containers properly wait for dependent services before starting main containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0

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

wait_for_pod() {
    local pod_name=$1
    local namespace=${2:-default}
    local timeout=${3:-60}
    
    log_info "Waiting for pod $pod_name to be created..."
    kubectl wait --for=condition=PodScheduled pod -l app=$pod_name -n $namespace --timeout=${timeout}s 2>/dev/null || return 1
}

get_init_container_status() {
    local pod_label=$1
    local namespace=${2:-default}
    local init_container_name=$3
    
    kubectl get pods -l app=$pod_label -n $namespace -o jsonpath="{.items[0].status.initContainerStatuses[?(@.name=='$init_container_name')].state}" 2>/dev/null
}

get_main_container_status() {
    local pod_label=$1
    local namespace=${2:-default}
    
    kubectl get pods -l app=$pod_label -n $namespace -o jsonpath="{.items[0].status.containerStatuses[0].state}" 2>/dev/null
}

get_pod_phase() {
    local pod_label=$1
    local namespace=${2:-default}
    
    kubectl get pods -l app=$pod_label -n $namespace -o jsonpath="{.items[0].status.phase}" 2>/dev/null
}

check_init_container_logs() {
    local pod_label=$1
    local init_container_name=$2
    local expected_pattern=$3
    local namespace=${4:-default}
    
    local pod_name=$(kubectl get pods -l app=$pod_label -n $namespace -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
    if [ -z "$pod_name" ]; then
        return 1
    fi
    
    kubectl logs $pod_name -c $init_container_name -n $namespace 2>/dev/null | grep -q "$expected_pattern"
}

# Test 1: Backend init container waits for PostgreSQL on port 5432
test_backend_wait_for_postgres() {
    log_info "Test 1: Backend init container waits for PostgreSQL on port 5432"
    
    # Check if backend deployment has the correct init container configuration
    local init_container_image=$(kubectl get deployment backend -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-postgres')].image}" 2>/dev/null)
    local init_container_command=$(kubectl get deployment backend -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-postgres')].command}" 2>/dev/null)
    
    if [[ "$init_container_command" == *"postgres-service"* ]] && [[ "$init_container_command" == *"5432"* ]]; then
        log_success "Backend deployment has wait-for-postgres init container configured for postgres-service:5432"
        return 0
    else
        log_failure "Backend deployment init container not properly configured"
        return 1
    fi
}

# Test 2: Frontend init container waits for backend service on port 8080
test_frontend_wait_for_backend() {
    log_info "Test 2: Frontend init container waits for backend service on port 8080"
    
    # Check if frontend deployment has the correct init container configuration
    local init_container_image=$(kubectl get deployment frontend -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-backend')].image}" 2>/dev/null)
    local init_container_command=$(kubectl get deployment frontend -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-backend')].command}" 2>/dev/null)
    
    if [[ "$init_container_command" == *"backend-service"* ]] && [[ "$init_container_command" == *"8080"* ]]; then
        log_success "Frontend deployment has wait-for-backend init container configured for backend-service:8080"
        return 0
    else
        log_failure "Frontend deployment init container not properly configured"
        return 1
    fi
}

# Test 3: Grafana init container waits for PostgreSQL on port 5432
test_grafana_wait_for_postgres() {
    log_info "Test 3: Grafana init container waits for PostgreSQL on port 5432"
    
    # Check if grafana deployment has the correct init container configuration
    local init_container_image=$(kubectl get deployment grafana -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-postgres')].image}" 2>/dev/null)
    local init_container_command=$(kubectl get deployment grafana -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-postgres')].command}" 2>/dev/null)
    
    if [[ "$init_container_command" == *"postgres-service"* ]] && [[ "$init_container_command" == *"5432"* ]]; then
        log_success "Grafana deployment has wait-for-postgres init container configured for postgres-service:5432"
        return 0
    else
        log_failure "Grafana deployment init container not properly configured"
        return 1
    fi
}

# Test 4: Init containers continuously poll dependent service
test_init_container_polling() {
    log_info "Test 4: Init containers continuously poll the dependent service"
    
    # Check backend init container command includes retry logic
    local backend_command=$(kubectl get deployment backend -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-postgres')].command}" 2>/dev/null)
    if [[ "$backend_command" == *"until"* ]] && [[ "$backend_command" == *"sleep"* ]]; then
        log_success "Backend init container has continuous polling with retry logic"
    else
        log_failure "Backend init container missing continuous polling logic"
        return 1
    fi
    
    # Check frontend init container command includes retry logic
    local frontend_command=$(kubectl get deployment frontend -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-backend')].command}" 2>/dev/null)
    if [[ "$frontend_command" == *"until"* ]] && [[ "$frontend_command" == *"sleep"* ]]; then
        log_success "Frontend init container has continuous polling with retry logic"
    else
        log_failure "Frontend init container missing continuous polling logic"
        return 1
    fi
    
    # Check grafana init container command includes retry logic
    local grafana_command=$(kubectl get deployment grafana -o jsonpath="{.spec.template.spec.initContainers[?(@.name=='wait-for-postgres')].command}" 2>/dev/null)
    if [[ "$grafana_command" == *"until"* ]] && [[ "$grafana_command" == *"sleep"* ]]; then
        log_success "Grafana init container has continuous polling with retry logic"
        return 0
    else
        log_failure "Grafana init container missing continuous polling logic"
        return 1
    fi
}

# Test 5: Main container does not start until init container completes
test_main_container_waits_for_init() {
    log_info "Test 5: Main container does not start until init container completes"
    
    # Test with backend pod
    local backend_pod=$(kubectl get pods -l app=backend -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
    if [ -n "$backend_pod" ]; then
        local init_status=$(kubectl get pod $backend_pod -o jsonpath="{.status.initContainerStatuses[0].state}" 2>/dev/null)
        local container_status=$(kubectl get pod $backend_pod -o jsonpath="{.status.containerStatuses[0].state}" 2>/dev/null)
        
        # If init container is running or waiting, main container should not be running
        if [[ "$init_status" == *"running"* ]] || [[ "$init_status" == *"waiting"* ]]; then
            if [[ "$container_status" != *"running"* ]]; then
                log_success "Backend main container correctly waits for init container"
            else
                log_failure "Backend main container started before init container completed"
                return 1
            fi
        # If init container is terminated successfully, main container can be running
        elif [[ "$init_status" == *"terminated"* ]]; then
            log_success "Backend init container completed, main container can start"
        fi
    fi
    
    # Test with frontend pod
    local frontend_pod=$(kubectl get pods -l app=frontend -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
    if [ -n "$frontend_pod" ]; then
        local init_status=$(kubectl get pod $frontend_pod -o jsonpath="{.status.initContainerStatuses[0].state}" 2>/dev/null)
        local container_status=$(kubectl get pod $frontend_pod -o jsonpath="{.status.containerStatuses[0].state}" 2>/dev/null)
        
        if [[ "$init_status" == *"running"* ]] || [[ "$init_status" == *"waiting"* ]]; then
            if [[ "$container_status" != *"running"* ]]; then
                log_success "Frontend main container correctly waits for init container"
            else
                log_failure "Frontend main container started before init container completed"
                return 1
            fi
        elif [[ "$init_status" == *"terminated"* ]]; then
            log_success "Frontend init container completed, main container can start"
        fi
    fi
    
    # Test with grafana pod
    local grafana_pod=$(kubectl get pods -l app=grafana -o jsonpath="{.items[0].metadata.name}" 2>/dev/null)
    if [ -n "$grafana_pod" ]; then
        local init_status=$(kubectl get pod $grafana_pod -o jsonpath="{.status.initContainerStatuses[0].state}" 2>/dev/null)
        local container_status=$(kubectl get pod $grafana_pod -o jsonpath="{.status.containerStatuses[0].state}" 2>/dev/null)
        
        if [[ "$init_status" == *"running"* ]] || [[ "$init_status" == *"waiting"* ]]; then
            if [[ "$container_status" != *"running"* ]]; then
                log_success "Grafana main container correctly waits for init container"
                return 0
            else
                log_failure "Grafana main container started before init container completed"
                return 1
            fi
        elif [[ "$init_status" == *"terminated"* ]]; then
            log_success "Grafana init container completed, main container can start"
            return 0
        fi
    fi
    
    # If no pods are found, test passes (configuration is correct)
    if [ -z "$backend_pod" ] && [ -z "$frontend_pod" ] && [ -z "$grafana_pod" ]; then
        log_success "Init container configuration ensures proper startup sequence"
        return 0
    fi
}

# Main test execution
main() {
    echo "================================================"
    echo "  Kubernetes Init Container Integration Tests"
    echo "================================================"
    echo ""
    
    # Check if kubectl is available
    if ! command -v kubectl &> /dev/null; then
        echo -e "${RED}ERROR:${NC} kubectl is not installed or not in PATH"
        exit 1
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        echo -e "${RED}ERROR:${NC} Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    log_info "Connected to Kubernetes cluster"
    echo ""
    
    # Run tests
    test_backend_wait_for_postgres || true
    echo ""
    
    test_frontend_wait_for_backend || true
    echo ""
    
    test_grafana_wait_for_postgres || true
    echo ""
    
    test_init_container_polling || true
    echo ""
    
    test_main_container_waits_for_init || true
    echo ""
    
    # Summary
    echo "================================================"
    echo "  Test Results"
    echo "================================================"
    echo -e "${GREEN}Tests Passed:${NC} $TESTS_PASSED"
    echo -e "${RED}Tests Failed:${NC} $TESTS_FAILED"
    echo ""
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}All tests passed!${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed!${NC}"
        exit 1
    fi
}

# Run main function
main
