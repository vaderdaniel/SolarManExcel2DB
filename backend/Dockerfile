# Stage 1: Build Angular frontend
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/solarman-ui/package*.json ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/solarman-ui/ ./

# Build Angular app
RUN npm run build

# Stage 2: Build Spring Boot backend
FROM maven:3.9-eclipse-temurin-17 AS backend-build

WORKDIR /app/backend

# Copy backend pom.xml
COPY backend/pom.xml ./

# Download dependencies (cached layer)
RUN mvn dependency:go-offline -B

# Copy backend source
COPY backend/src ./src

# Copy Angular build output to static resources
COPY --from=frontend-build /app/frontend/dist/solarman-ui ./src/main/resources/static/

# Build Spring Boot application
RUN mvn clean package -DskipTests

# Stage 3: Runtime
FROM amazoncorretto:17-alpine

WORKDIR /app

# Copy the built JAR from backend-build stage
COPY --from=backend-build /app/backend/target/*.jar app.jar

# Expose backend port
EXPOSE 8080

# Set environment variables (will be overridden by Kubernetes)
ENV SPRING_DATASOURCE_URL=jdbc:postgresql://postgres-service:5432/LOOTS
ENV DB_USER=danieloots
ENV DB_PASSWORD=SeweEen0528

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
