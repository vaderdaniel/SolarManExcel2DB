# Stage 1: Build Angular application
FROM node:22-alpine AS build

WORKDIR /app

# Copy package files
COPY solarman-ui/package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY solarman-ui/ ./

# Build for production
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

# Remove default nginx content (prevents default index.html from taking precedence)
RUN rm -rf /usr/share/nginx/html/*

# Copy built Angular app to nginx html directory
# Angular 21 application builder outputs browser files to dist/solarman-ui/browser
COPY --from=build /app/dist/solarman-ui/browser /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
