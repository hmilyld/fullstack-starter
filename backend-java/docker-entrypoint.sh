#!/bin/sh
set -e

# Start nginx in background
nginx -g 'daemon on;'

# Start Spring Boot in foreground
exec java -jar app.jar \
    --spring.datasource.url=jdbc:sqlite:/app/data/app.db \
    --server.port=8000
