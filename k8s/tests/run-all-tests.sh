#!/bin/bash
# Master test runner for init container tests
# Runs both YAML validation and integration tests

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Init Container Test Suite${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

# Track overall status
VALIDATION_PASSED=false
INTEGRATION_PASSED=false
INTEGRATION_SKIPPED=false

# Run YAML validation tests (always run, no cluster required)
echo -e "${YELLOW}Step 1: Running YAML Validation Tests${NC}"
echo "These tests validate the YAML configuration files."
echo ""

if "$SCRIPT_DIR/validate-init-containers.sh"; then
    VALIDATION_PASSED=true
    echo ""
    echo -e "${GREEN}✓ YAML validation tests passed${NC}"
else
    echo ""
    echo -e "${RED}✗ YAML validation tests failed${NC}"
fi

echo ""
echo "------------------------------------------------------"
echo ""

# Check if kubectl is available and cluster is accessible
echo -e "${YELLOW}Step 2: Running Integration Tests${NC}"
echo "These tests verify runtime behavior in a Kubernetes cluster."
echo ""

if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}⚠ kubectl not found - skipping integration tests${NC}"
    INTEGRATION_SKIPPED=true
elif ! kubectl cluster-info &> /dev/null; then
    echo -e "${YELLOW}⚠ Cannot connect to Kubernetes cluster - skipping integration tests${NC}"
    INTEGRATION_SKIPPED=true
else
    echo -e "${GREEN}✓ Kubernetes cluster accessible${NC}"
    echo ""
    
    if "$SCRIPT_DIR/init-container-tests.sh"; then
        INTEGRATION_PASSED=true
        echo ""
        echo -e "${GREEN}✓ Integration tests passed${NC}"
    else
        echo ""
        echo -e "${RED}✗ Integration tests failed${NC}"
    fi
fi

# Final summary
echo ""
echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  Test Suite Summary${NC}"
echo -e "${BLUE}======================================================${NC}"
echo ""

if $VALIDATION_PASSED; then
    echo -e "${GREEN}✓ YAML Validation: PASSED${NC}"
else
    echo -e "${RED}✗ YAML Validation: FAILED${NC}"
fi

if $INTEGRATION_SKIPPED; then
    echo -e "${YELLOW}⊘ Integration Tests: SKIPPED${NC}"
elif $INTEGRATION_PASSED; then
    echo -e "${GREEN}✓ Integration Tests: PASSED${NC}"
else
    echo -e "${RED}✗ Integration Tests: FAILED${NC}"
fi

echo ""

# Determine exit code
if $VALIDATION_PASSED && ($INTEGRATION_PASSED || $INTEGRATION_SKIPPED); then
    echo -e "${GREEN}Overall Status: SUCCESS${NC}"
    echo ""
    if $INTEGRATION_SKIPPED; then
        echo -e "${YELLOW}Note: Integration tests were skipped. To run them, ensure:${NC}"
        echo "  1. kubectl is installed and in PATH"
        echo "  2. A Kubernetes cluster is running and accessible"
        echo "  3. Deployments are applied to the cluster"
    fi
    exit 0
else
    echo -e "${RED}Overall Status: FAILURE${NC}"
    exit 1
fi
