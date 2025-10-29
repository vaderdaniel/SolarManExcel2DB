FROM postgres:16-alpine

# Set environment variables
ENV POSTGRES_DB=LOOTS
ENV POSTGRES_USER=danieloots
ENV POSTGRES_PASSWORD=SeweEen0528

# Expose PostgreSQL port
EXPOSE 5432

# The data directory will be mounted from host at /Users/danieloots/LOOTS_PG/
# No need to copy data - it will use the existing database via volume mount
