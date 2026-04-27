# Security Scanning - Quick Start

## 🚀 Quick Commands

```bash
# Run full build with security scan
mvn verify

# Run security scan only (after building)
./security-scan.sh

# Skip security scan (not recommended)
mvn verify -Dexec.skip=true
```

## 📊 What Gets Scanned?

1. ✅ **Maven Dependencies** (`pom.xml`)
2. ✅ **JAR Artifact** (`target/*.jar`)
3. ✅ **Docker Image** (`solarman-backend:latest`)

## 🔴 Build Behavior

- Build **FAILS** on **CRITICAL** vulnerabilities
- Build **PASSES** on HIGH, MEDIUM, LOW vulnerabilities (logged only)

## 📁 Reports Location

```
backend/reports/
├── maven-dependencies.json/sarif
├── jar-artifact.json/sarif
└── docker-image.json/sarif
```

## 🛠️ Fix Vulnerabilities

1. Check the console output for CVE details
2. Update `pom.xml` with fixed versions
3. Run `mvn clean verify` to re-scan
4. Verify the vulnerability is gone

## 📖 Full Documentation

See [SECURITY.md](./SECURITY.md) for complete documentation.

## ✅ Current Status

**Security Status:** All CRITICAL vulnerabilities resolved!

- ✅ Tomcat upgraded to version 10.1.54
- ✅ Spring Boot upgraded to 3.5.10
- ✅ All dependencies at latest versions
- ✅ No CRITICAL vulnerabilities detected
