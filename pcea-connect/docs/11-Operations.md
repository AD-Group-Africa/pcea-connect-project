# PCEA Connect – Operations & Support
**Version 1.0**

## Support Tiers
| Severity | Response | Resolution |
|----------|----------|------------|
| Critical | 2 hours | 4 hours |
| High | 4 hours | 1 business day |
| Medium | 1 business day | 3 business days |
| Low | 3 business days | Next release |

## Channels
Email: support@pceaconnect.com, WhatsApp, Phone

## Common Commands
- Restart: docker restart pcea-backend
- Logs: docker logs -f pcea-backend
- Backup: pg_dump -U pcea pcea > backup.sql
- Restore: psql -U pcea pcea < backup.sql

## Disaster Recovery
1. Restore latest backup
2. docker-compose up -d
3. Verify /api/health
4. Notify users
