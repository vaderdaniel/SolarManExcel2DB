# Security Scanning with Trivy

This document describes the security scanning setup for the SolarManExcel2DB backend using Trivy.

## Overview

The backend build process includes automated security scanning using [Trivy](https://trivy.dev/), which scans for vulnerabilities in:
- **Maven dependencies** (Java libraries in `pom.xml`)
- **JAR artifacts** (the built application)
- **Docker images** (the containerized runtime)

The build will **fail** if **CRITICAL** severity vulnerabilities are detected.

## Prerequisites

Trivy must be installed locally:

```bash
# Install on macOS
brew install trivy

# Verify installation
trivy --version
```

## Running Security Scans

### Option 1: Integrated with Maven Build

Security scanning runs automatically during the `verify` phase:

```bash
# Build and scan
mvn verify

# Build, test, and scan
mvn clean verify

# Skip tests but include scan
mvn verify -DskipTests
```

### Option 2: Standalone Script

Run the security scan script directly:

```bash
# From the backend directory
./security-scan.sh
```

This is useful for:
- Quick security checks without full builds
- Testing security configurations
- CI/CD pipeline integration

## Scan Targets

### 1. Maven Dependencies (pom.xml)
Scans all dependencies declared in `pom.xml` for known vulnerabilities.

**Example finding:**
```
Library: org.apache.tomcat.embed:tomcat-embed-core
Vulnerability: CVE-2025-24813
Severity: CRITICAL
Installed Version: 10.1.18
Fixed Version: 11.0.3, 10.1.35, 9.0.99
```

### 2. JAR Artifact
Scans the built JAR file in `target/solarman-ui-backend-*.jar` for vulnerabilities.

**Note:** The JAR must be built first with `mvn package`.

### 3. Docker Image
Scans the Docker image `solarman-backend:latest` for vulnerabilities in base images and runtime.

**Note:** The Docker image must be built first:
```bash
docker build -t solarman-backend:latest -f Dockerfile ..
```

## Scan Reports

Reports are generated in the `backend/reports/` directory:

```
backend/reports/
├── maven-dependencies.json      # Maven deps - JSON format
├── maven-dependencies.sarif     # Maven deps - SARIF format
├── jar-artifact.json            # JAR file - JSON format
├── jar-artifact.sarif           # JAR file - SARIF format
├── docker-image.json            # Docker image - JSON format
├── docker-image.sarif           # Docker image - SARIF format
└── dependency-tree.txt          # Maven dependency tree
```

### Report Formats

- **JSON**: Machine-readable format for automation and CI/CD
- **SARIF**: Static Analysis Results Interchange Format (compatible with GitHub Security tab)

### Viewing Reports

```bash
# Pretty-print JSON report
jq '.' backend/reports/maven-dependencies.json

# Count vulnerabilities by severity
jq '[.Results[]?.Vulnerabilities[]? | .Severity] | group_by(.) | map({severity: .[0], count: length})' backend/reports/maven-dependencies.json

# List all CRITICAL vulnerabilities
jq '[.Results[]?.Vulnerabilities[]? | select(.Severity == "CRITICAL")]' backend/reports/maven-dependencies.json
```

**Note:** Reports are excluded from version control (see `.gitignore`).

## Understanding Results

### Console Output

The scan provides color-coded console output:

- ✅ **Green**: No CRITICAL vulnerabilities found
- ⚠️  **Yellow**: Informational messages, skipped scans
- ❌ **Red**: CRITICAL vulnerabilities detected (build fails)

### Exit Codes

- `0`: Success - No CRITICAL vulnerabilities
- `1`: Failure - CRITICAL vulnerabilities detected

## Fixing Vulnerabilities

### Step 1: Review Findings

Check the console output or JSON reports for vulnerability details:

```bash
cat backend/reports/maven-dependencies.json
```

### Step 2: Update Dependencies

Update vulnerable dependencies in `pom.xml`:

```xml
<!-- Example: Update Tomcat embed -->
<dependency>
    <groupId>org.apache.tomcat.embed</groupId>
    <artifactId>tomcat-embed-core</artifactId>
    <version>10.1.35</version>  <!-- Updated to fixed version -->
</dependency>
```

**Note:** For Spring Boot managed dependencies, update the parent version or use `<properties>` to override:

```xml
<properties>
    <tomcat.version>10.1.35</tomcat.version>
</properties>
```

### Step 3: Re-scan

```bash
mvn clean verify
```

### Step 4: Verify Fix

Check that the vulnerability is no longer reported.

## Configuration

### Severity Threshold

The default threshold is **CRITICAL**. To change it, edit `security-scan.sh`:

```bash
SEVERITY_THRESHOLD="CRITICAL,HIGH"  # Also fail on HIGH severity
```

### Skip Security Scan

To skip the security scan during Maven builds:

```bash
mvn verify -Dexec.skip=true
```

**Warning:** Only skip scans for local development. Always run scans before production deployments.

## Dockerfile Integration

The Dockerfile includes a security scanning stage:

```dockerfile
# Stage 3: Security Scanning
FROM aquasec/trivy:latest AS security-scan

COPY --from=backend-build /app/backend/target/*.jar /scan/app.jar

RUN trivy rootfs --severity CRITICAL,HIGH \
    --format json \
    --output /scan/trivy-report.json \
    /scan/ || true
```

**Note:** Currently set to `|| true` (non-blocking). For strict builds, remove `|| true` to fail on vulnerabilities.

## CI/CD Integration

### Local Builds Only (Current Setup)

The current setup is designed for local development builds.

### Future CI/CD Integration

To integrate with CI/CD pipelines:

1. **GitHub Actions**: Use the SARIF reports with GitHub Security tab
2. **GitLab CI**: Parse JSON reports in pipeline jobs
3. **Jenkins**: Use the exit code to fail pipeline builds

Example GitHub Actions snippet:

```yaml
- name: Run Security Scan
  run: cd backend && ./security-scan.sh

- name: Upload Trivy Results
  uses: github/codeql-action/upload-sarif@v2
  with:
    sarif_file: backend/reports/maven-dependencies.sarif
```

## Troubleshooting

### "Trivy is not installed"

Install Trivy:
```bash
brew install trivy
```

### "No JAR file found"

Build the JAR first:
```bash
mvn package
```

### "Docker image not found"

Build the Docker image:
```bash
docker build -t solarman-backend:latest -f Dockerfile ..
```

### "jq: command not found"

Install jq for JSON parsing:
```bash
brew install jq
```

### Scan Takes Too Long

Trivy downloads vulnerability databases on first run. Subsequent scans are faster.

To update the database manually:
```bash
trivy image --download-db-only
```

## Best Practices

1. **Run scans regularly**: Before commits, PRs, and deployments
2. **Update dependencies**: Keep dependencies current with security patches
3. **Review reports**: Don't just fix CRITICAL; review HIGH and MEDIUM too
4. **Monitor CVEs**: Subscribe to security advisories for your dependencies
5. **Test fixes**: Always verify that dependency updates don't break functionality

## Additional Resources

- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [CVE Database](https://cve.mitre.org/)
- [Spring Boot Security Updates](https://spring.io/security)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)

## Support

For issues related to:
- **Trivy scanning**: Check [Trivy GitHub Issues](https://github.com/aquasecurity/trivy/issues)
- **Vulnerability fixes**: Consult the dependency's security advisories
- **Build integration**: Review `pom.xml` and `security-scan.sh`
