#!/bin/bash

# SolarManExcel2DB Backend Security Scan Script
# Uses Trivy to scan Maven dependencies, JAR files, and Docker images
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
echo -e "${BLUE}  Trivy Security Scan - Backend${NC}"
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

# Function to scan Maven dependencies
scan_maven_dependencies() {
    echo -e "${YELLOW}[1/3] Scanning Maven Dependencies...${NC}"
    
    # Generate dependency tree for scanning
    mvn dependency:tree -DoutputFile="${REPORTS_DIR}/dependency-tree.txt" -DoutputType=text > /dev/null 2>&1
    
    # Scan using Trivy filesystem mode on pom.xml
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --format json \
        --output "${REPORTS_DIR}/maven-dependencies.json" \
        --scanners vuln \
        pom.xml
    
    # Generate SARIF report
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --format sarif \
        --output "${REPORTS_DIR}/maven-dependencies.sarif" \
        --scanners vuln \
        pom.xml
    
    # Display results to console
    echo ""
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --scanners vuln \
        pom.xml
    
    # Check for critical vulnerabilities in JSON output
    CRITICAL_COUNT=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "${REPORTS_DIR}/maven-dependencies.json" 2>/dev/null || echo "0")
    
    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo -e "${RED}✗ Found ${CRITICAL_COUNT} CRITICAL vulnerabilities in Maven dependencies${NC}"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✓ No CRITICAL vulnerabilities found in Maven dependencies${NC}"
    fi
    echo ""
}

# Function to scan JAR file
scan_jar_file() {
    echo -e "${YELLOW}[2/3] Scanning JAR Artifact...${NC}"
    
    # Find the built JAR file
    JAR_FILE=$(find target -name "*.jar" -type f | head -n 1)
    
    if [ -z "$JAR_FILE" ]; then
        echo -e "${YELLOW}⚠ No JAR file found in target/ directory. Skipping JAR scan.${NC}"
        echo -e "${YELLOW}  Run 'mvn package' first to build the JAR.${NC}"
        echo ""
        return
    fi
    
    echo "Scanning: $JAR_FILE"
    
    # Scan JAR file using fs (filesystem) mode
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --format json \
        --output "${REPORTS_DIR}/jar-artifact.json" \
        --scanners vuln \
        "${JAR_FILE}"
    
    # Generate SARIF report
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --format sarif \
        --output "${REPORTS_DIR}/jar-artifact.sarif" \
        --scanners vuln \
        "${JAR_FILE}"
    
    # Display results to console
    echo ""
    trivy fs \
        --severity "${SEVERITY_THRESHOLD}" \
        --scanners vuln \
        "${JAR_FILE}"
    
    # Check for critical vulnerabilities
    CRITICAL_COUNT=$(jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")] | length' "${REPORTS_DIR}/jar-artifact.json" 2>/dev/null || echo "0")
    
    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo -e "${RED}✗ Found ${CRITICAL_COUNT} CRITICAL vulnerabilities in JAR artifact${NC}"
        EXIT_CODE=1
    else
        echo -e "${GREEN}✓ No CRITICAL vulnerabilities found in JAR artifact${NC}"
    fi
    echo ""
}

# Function to scan Docker image
scan_docker_image() {
    echo -e "${YELLOW}[3/3] Scanning Docker Image...${NC}"
    
    # Check if Docker image exists
    IMAGE_NAME="solarman-backend:latest"
    
    if ! docker image inspect "${IMAGE_NAME}" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠ Docker image '${IMAGE_NAME}' not found. Skipping Docker scan.${NC}"
        echo -e "${YELLOW}  Build the image first with: docker build -t ${IMAGE_NAME} -f Dockerfile ..${NC}"
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
    scan_maven_dependencies
    scan_jar_file
    scan_docker_image
    
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}  Security Scan Summary${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""
    echo "Reports generated in: ${REPORTS_DIR}/"
    echo "  - maven-dependencies.json/sarif"
    echo "  - jar-artifact.json/sarif"
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
