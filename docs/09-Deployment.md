# PCEA Connect – Deployment Guide
**Version 1.0**

## Docker Compose
1. Copy project to server
2. Create .env file with secrets
3. docker-compose -f docker-compose.prod.yml up -d
4. certbot --nginx -d yourdomain.com

## Manual
Backend: ./gradlew build -x test, set env vars, java -jar build/libs/*.jar
Frontend: cd frontend && npm run build && npm start

## Server Requirements
Ubuntu 22.04, 2 vCPUs, 4 GB RAM, 40 GB SSD
