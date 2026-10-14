FROM node:22-alpine

WORKDIR /app
EXPOSE 3000

# Development image: dependencies are installed at startup (see docker-compose.yml).
# A production image (multi-stage build) comes later.
CMD ["sh", "-c", "npm ci && npm run dev -- --hostname 0.0.0.0"]
