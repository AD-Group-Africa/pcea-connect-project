# PCEA Connect – Backend Documentation
**Version 1.0**

## Entry Point
ke.pcea.connect.PceaConnectApplication.kt

## Package Structure
- config/ – SecurityConfig, CORS
- shared/ – ApiResponse, ExceptionHandler, JWT
- modules/identity/ – Auth (register, login, refresh, reset)
- modules/church/ – Hierarchy CRUD
- modules/membership/ – Profiles, cards
- modules/events/ – CRUD, publish, RSVP, check-in
- modules/giving/ – Contributions, M-Pesa, statements
- modules/ministries/ – Ministry CRUD, members, projects
- modules/attendance/ – Mark, check-in/out
- modules/pastoralcare/ – Prayer, visits, tasks
- modules/analytics/ – Metrics, trends, CSV
- modules/bible/ – Books, verses, bookmarks, plans
- modules/media/ – Sermons, playlists
- modules/livestream/ – Schedule, go-live, end
- modules/notifications/ – Push, email, SMS
- modules/feed/ – Posts, reactions, comments
- modules/locator/ – Church search
- modules/volunteer/ – Teams, schedules, hours
- modules/search/ – Cross-module search
- modules/admin/ – Roles, audit logs, settings

## Build & Run
./gradlew build -x test
java -jar build/libs/PCEA-Connect-0.0.1-SNAPSHOT.jar --server.port=8087

## Environment Variables
DB_PASSWORD, JWT_SECRET, MPESA_*, TWILIO_*, AT_*
