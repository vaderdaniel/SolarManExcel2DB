#!/bin/bash

# SolarManExcel2DB Frontend Security Scan Script
# Uses npm audit and Trivy to scan npm dependencies and Docker images
# Exits with code 1 if CRITICAL vulnerabilities are found

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPORTS_DIR="reports"
SEVERITY_THRESHOLD="CRITICAL"
EXIT_CODE=0

# Ensure reports directory exists
mkdir -p "${REPORTS_DIR}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Security Scan - Frontend${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check if Trivy is installed
check_trivy() {
    if ! command -v trivy &> /dev/null; then
        echo -e "${RED}ERROR: Trivy is not installed${NC}"
        echo "Install with: brew install trivy"
        exit 1
    fi
    echo -e "${GREEN}✓ Trivy installed: $(trivy --version | head -n1)${NC}"
    echo ""
}

# Function to run npm audit
scan_npm_audit() {
    echo -e "${YELLOW}[1/3] Running npm audit...${NC}"

    if [ ! -d "solarman-ui/node_modules" ]; then
        echo -e "${YELLOW}  Installing dependencies first...${NC}"
        (cd solarman-ui && npm ci --silent)
    fi

    # Run npm audit and save JSON report
    (cd solarman-ui && npm audit --json > "../${REPORTS_DIR}/npm-audit.json" 2>/dev/null) || true

    # Display results to console
    echo ""
    (cd solarman-ui && npm audit 2>/dev/null) || true

    # Check for critical vulnerabilities
    CRITICAL_COUNT=$(jq '[.vulnerabilities | to_entries[]? | select(.value.severity == "critical")] | length' "${REPORTS_DIR}/npm-audit.json" 2>/dev/null || echo "0")

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo -e "${RED}✗ Found ${CRITICAL_COUNT} CRITICAL vulnerabilities in npm dependencies${NC}"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✓ No CRITICAL vulnerabilities found in npm dependencies${NC}"
    fi
    echo ""
}

# Function to scan npm dependencies with Trivy
scan_npm_dependencies() {
    echo -e "${YELLOW}[2/3] Scanning npm dependencies with Trivy...${NC}"

    if [ ! -f "solarman-ui/package-lock.json" ]; then
        echo -e "${YELLOW}⚠ No package-lock.json found. Skipping Trivy npm scan.${NC}"
        echo ""
        return
    fi

    # Scan using Trivy filesystem mode on the project directory
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --format json \
        --output "${REPORTS_DIR}/npm-dependencies-trivy.json" \
        --scanners vuln \
        solarman-ui/

    # Generate SARIF report
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --format sarif \
        --output "${REPORTS_DIR}/npm-dependencies-trivy.sarif" \
        --scanners vuln \
        solarman-ui/

    # Display results to console
    echo ""
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --scanners vuln \
        solarman-ui/

    # Check for critical vulnerabilities in JSON output
    CRITICAL_COUNT=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "${REPORTS_DIR}/npm-dependencies-trivy.json" 2>/dev/null || echo "0")

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo -e "${RED}✗ Found ${CRITICAL_COUNT} CRITICAL vulnerabilities via Trivy${NC}"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✓ No CRITICAL vulnerabilities found via Trivy${NC}"
    fi
    echo ""
}

# Function to scan Docker image
scan_docker_image() {
    echo -e "${YELLOW}[3/3] Scanning Docker Image...${NC}"

    # Check if Docker image exists
    IMAGE_NAME="solarman-frontend:latest"

    if ! docker image inspect "${IMAGE_NAME}" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Docker image '${IMAGE_NAME}' not found. Skipping Docker scan.${NC}"
        echo -e "${YELLOW}  Build the image first with: docker build -t ${IMAGE_NAME} frontend/${NC}"
        echo ""
        return
    fi

    echo "Scanning: ${IMAGE_NAME}"

    # Scan Docker image
    trivy image \
        --severity "${SEVERITY_THRESHOLD}" \
        --format json \
        --output "${REPORTS_DIR}/docker-image.json" \
        "${IMAGE_NAME}"

    # Generate SARIF report
    trivy image \
        --severity "${SEVERITY_THRESHOLD}" \
        --format sarif \
        --output "${REPORTS_DIR}/docker-image.sarif" \
        "${IMAGE_NAME}"

    # Display results to console
    echo ""
    trivy image \
        --severity "${SEVERITY_THRESHOLD}" \
        "${IMAGE_NAME}"

    # Check for critical vulnerabilities
    CRITICAL_COUNT=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "${REPORTS_DIR}/docker-image.json" 2>/dev/null || echo "0")

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo -e "${RED}✗ Found ${CRITICAL_COUNT} CRITICAL vulnerabilities in Docker image${NC}"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✓ No CRITICAL vulnerabilities found in Docker image${NC}"
    fi
    echo ""
}

# Main execution
main() {
    check_trivy
    scan_npm_audit
    scan_npm_dependencies
    scan_docker_image

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Security Scan Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Reports generated in: ${REPORTS_DIR}/"
    echo "  - npm-audit.json"
    echo "  - npm-dependencies-trivy.json/sarif"
    echo "  - docker-image.json/sarif"
    echo ""

    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✓ Security scan completed successfully - No CRITICAL vulnerabilities found${NC}"
    else
        echo -e "${RED}✗ Security scan failed - CRITICAL vulnerabilities detected${NC}"
        echo -e "${RED}  Review the reports in ${REPORTS_DIR}/ for details${NC}"
    fi

    exit $EXIT_CODE
}

# Run main function
main
