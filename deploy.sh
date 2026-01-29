#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}➜ Checking Prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}✖ Docker is not installed.${NC}"
    exit 1
fi

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✖ Docker daemon is not running.${NC}"
    exit 1
fi

echo -e "${GREEN}✔ Prerequisites Met.${NC}"

echo -e "${CYAN}➜ Building NetworkWeaver Containers...${NC}"
docker-compose up -d --build --remove-orphans

echo -e "${CYAN}➜ Verifying Deployment...${NC}"
sleep 10

if [ "$(docker ps -q -f name=networkweaver-backend)" ] && [ "$(docker ps -q -f name=networkweaver-frontend)" ]; then
    echo -e "${GREEN}✔ NetworkWeaver is running!${NC}"
    echo ""
    echo -e "📱 Access the Dashboard: http://localhost:5173"
    echo -e "🔌 API Documentation:   http://localhost:8000/docs"
    echo -e "📊 Grafana Monitoring: http://localhost:3000 (admin/admin)"
else
    echo -e "${RED}✖ Deployment failed. Check logs with 'docker-compose logs'${NC}"
fi
