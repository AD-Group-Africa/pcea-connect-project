# PCEA Connect – System Architecture
**Version 1.0**

## High-Level Architecture
PCEA Connect follows a modular monolith pattern with separate frontend and backend.

- Frontend: Next.js 15 (TypeScript, Tailwind, ShadCN)
- Backend: Spring Boot 3.2 (Kotlin, JWT, Flyway)
- Database: PostgreSQL 15
- Infrastructure: Docker Compose, Nginx

## Technology Stack
| Component | Technology |
|-----------|-----------|
| Backend | Kotlin, Spring Boot 3.2, Spring Security, JPA |
| Frontend | Next.js 15, TypeScript, Tailwind CSS, ShadCN |
| Database | PostgreSQL 15 |
| Payments | Safaricom Daraja API (M-Pesa) |
| Messaging | Twilio (WhatsApp), Africa's Talking (SMS/USSD) |
| Auth | JWT (access + refresh), BCrypt |
| DevOps | Docker, Compose, GitHub Actions, Nginx |

## Module Map
| Module | Package | Key Entities |
|--------|---------|--------------|
| Identity | identity | User, RefreshToken |
| Church | church | Region, Presbytery, Parish, Congregation |
| Membership | membership | MemberProfile |
| Events | events | Event, EventRegistration |
| Giving | giving | Contribution, ContributionStatement |
| Ministries | ministries | Ministry, MinistryMember |
| Attendance | attendance | AttendanceRecord |
| Pastoral Care | pastoralcare | Prayer, Visit, Task |
| Analytics | analytics | aggregated queries |
| Bible | bible | Book, Verse, Bookmark, Plan |
| Media | media | Sermon, Playlist |
| Livestream | livestream | Livestream |
| Notifications | notifications | DeviceToken, Log |
| Feed | feed | Post, Reaction, Comment |
| Locator | locator | ChurchLocation |
| Volunteer | volunteer | Team, Schedule |
| Search | search | cross-module |
| Admin | admin | AuditLog, RoleAssignment |
