#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
cd /home/ec2-user/food-web-server

# Pull latest changes
echo "📥 Pulling latest code..."
git pull origin main

# Stop and remove old containers
echo "🛑 Stopping old containers..."
docker compose down

# Pull latest images (if using Docker Hub)
echo "📦 Pulling latest images..."
docker compose pull || true

# Build and start containers
echo "🔨 Building and starting containers..."
docker compose up -d --build

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Deployment completed successfully!"

# Show running containers
docker ps
