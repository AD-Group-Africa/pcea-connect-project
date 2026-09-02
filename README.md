# PCEA Connect — The Digital Church

PCEA Connect is a comprehensive digital platform for PCEA congregations, connecting worship, ministries, giving, education, and church community in one secure application.

A product of **Afrika Digitalis**.

## Architecture

### Backend (Kotlin + Spring Boot 3 + PostgreSQL)

- **Identity**: JWT auth, refresh tokens, email verification, password reset, BCrypt hashing
- **RBAC**: Role-based access control with scoped ministry authorization (role + ministry + scope)
- **Ministries**: Shared `Ministry` / `MinistryMember` / `MinistryEvent` / `MinistryProject` / `MinistryAnnouncement` framework — one person, many ministries
- **Sunday School**: `SundaySchoolClass`, `ChildEnrollment`, `ParentGuardianLink`, `TeacherAssignment`, `SundaySchoolLesson`, `SundaySchoolAttendance`, `SundaySchoolProgress` — with server-side object-level authorization for child privacy
- **Catechism**: `CatechismCourse` → `Module` → `Lesson` → `Enrollment` → `Progress` → `Assessment`
- **Worship**: Service scheduling, digital bulletins, livestream integration
- **Giving**: M-Pesa STK push, callback verification, idempotency, receipts, giving history
- **Notifications**: In-app notification inbox
- **Database**: Flyway migrations (V015–V049), PostgreSQL 16

### Frontend (Next.js 16 + React 19 + TypeScript + Tailwind)

- 44 routes covering all church experiences
- Shared ministry components with per-ministry theming
- Responsive: desktop nav + mobile bottom navigation
- Premium dark UI with PCEA blue/gold branding

## Minstry Experiences

| Ministry | Theme | Personality |
|----------|-------|-------------|
| PCMF | Maroon | Professional / brotherhood |
| YPCMF | Blue | Contemporary professional / networking |
| Woman's Guild | Mauve | Warm / elegant / fellowship |
| Youth | Green | Energetic / event-driven |
| Sunday School | Orange | Warm / friendly / simple |
| Catechism | Blue/Green | Calm / educational |
| Choir | Purple | Worship / music |
| Mission | Teal | Outreach / service |

## Environment Variables

### Required for Production

```
DATABASE_URL=jdbc:postgresql://localhost:5432/pcea
DB_PASSWORD=<your-db-password>
JWT_SECRET=<256-bit-secret>

# M-Pesa (Safaricom Daraja API)
MPESA_CONSUMER_KEY=<key>
MPESA_CONSUMER_SECRET=<secret>
MPESA_PASSKEY=<passkey>
MPESA_SHORTCODE=<shortcode>
MPESA_CALLBACK_SECRET=<random-secret>
MPESA_CALLBACK_URL=https://yourdomain.com/api/giving/mpesa-callback/<callback-secret>

# Email (SMTP)
SMTP_HOST=<smtp-host>
SMTP_PORT=587
SMTP_USERNAME=<username>
SMTP_PASSWORD=<password>

# Google OAuth (optional)
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>
GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/google/callback

# Africa's Talking (SMS, optional)
AT_API_KEY=<key>
AT_USERNAME=<username>

# App
APP_BASE_URL=https://yourdomain.com
```

### Development Defaults

Without SMTP configured, emails are logged to the application log (not sent). This is the explicit dev boundary — not a fake implementation.

Without Google credentials, Google Sign-In is disabled. No fake login is shown.

## Monetization Model

PCEA Connect uses an **institutional SaaS model** — the church/congregation pays, members use for free.

### Tiers (conceptual)

| Tier | Features |
|------|----------|
| **Starter** | Church profile, worship, announcements, basic ministries, events |
| **Growth** | Giving, ministry management, Sunday School, Catechism, notifications, analytics |
| **Institution** | Advanced administration, multi-congregation, reporting, PCEA-level admin, integrations, SLA |

### Additional Revenue

- Implementation & onboarding
- Custom integrations
- SMS/communication usage fees
- Advanced analytics
- Training
- Enterprise/PCEA national deployment

**PCEA Connect does not take a percentage of church offerings/tithes.**

## Demo Flow

1. Visit landing page (`/`)
2. Register (`/register`) or Sign In (`/login`)
3. Dashboard shows today's worship, quick actions, ministries
4. View worship service, preacher, scripture, bulletin (`/worship`)
5. Explore ministries (`/ministries`) — PCMF, YPCMF, Guild, Youth, Choir, Mission
6. Sunday School (`/sunday-school`) — child, parent, teacher views
7. Catechism (`/catechism`) — courses and progress
8. Give (`/giving`) — M-Pesa giving flow
9. News & notifications
10. Profile & privacy settings (`/profile`)

## Running Locally

### Backend

```bash
# Set environment variables (see above)
export DB_PASSWORD=yourpassword
export JWT_SECRET=your-256-bit-secret

# Run with Gradle
gradle bootRun
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:8080`.

## Testing

```bash
# Backend
gradle test

# Frontend
cd frontend && npm run build

# PostgreSQL Testcontainers (requires Docker)
gradle test -Dpostgres.tests=true
```

## Remaining Configuration for Production

1. Set all environment variables (see above)
2. Configure SMTP for email verification and password reset
3. Create Google OAuth credentials for Google Sign-In
4. Set up M-Pesa Daraja API credentials
5. Configure PostgreSQL 16+ database
6. Deploy with Docker (see `Dockerfile` and `docker-compose.prod.yml`)
