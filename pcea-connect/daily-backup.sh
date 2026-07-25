#!/bin/bash
# daily-backup.sh – run as a cron job on the host
DATE=$(date +%Y%m%d_%H%M%S)
docker exec pcea-connect-db-1 pg_dump -U pcea pcea > /backups/pcea_$DATE.sql
find /backups -name "*.sql" -mtime +7 -delete
