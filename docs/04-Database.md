# PCEA Connect – Database Design
**Version 1.0**

## Database Server
- Engine: PostgreSQL 15
- Port: 5433 (dev), 5432 (prod)
- Schema: public
- Migrations: Flyway (19 versions)

## Core Tables
| Table | Purpose |
|-------|---------|
| users | Registered members & leaders |
| regions | Church regions |
| presbyteries | Presbyteries |
| parishes | Parishes |
| congregations | Congregations |
| member_profiles | Extended member info |
| events | Church events |
| contributions | Tithes, offerings, donations |
| ministries | Ministry definitions |
| attendance_records | Service attendance |
| bible_books | Books of the Bible |
| bible_verses | Bible verses |
| sermons | Media/sermons |
| feed_posts | Social feed |
| audit_logs | System audit trail |
| volunteer_teams | Volunteer teams |

## Backup Strategy
- Nightly pg_dump to /backups/
- 7-day retention
- Monthly restore tests
