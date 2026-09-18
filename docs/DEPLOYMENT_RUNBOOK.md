# PCEA Connect — Deployment Runbook

Public target: `https://pcea-connect.com` (Hetzner, Docker Compose).

Status legend: `READY` = tested and passing · `BLOCKED BY EXTERNAL ACCESS` = implementation ready, external dependency missing · `NOT CONFIGURED` = needs credentials/data before it can work.

---

## STEP 1 — DNS (currently BLOCKED BY EXTERNAL ACCESS: domain does not resolve)

1. At the registrar, point the domain at the Hetzner server:
   - `A` record: `pcea-connect.com` → `<SERVER_IPV4>`
   - `A` record: `www.pcea-connect.com` → `<SERVER_IPV4>`
   - Optional `AAAA` records if the server has IPv6.
2. Propagation checks (from any machine):

```bash
nslookup pcea-connect.com
dig +short pcea-connect.com A
```

3. Do not proceed to HTTPS until these return the server IP.

---

## STEP 2 — Hetzner server

> Server existence/access is NOT CONFIGURED in this repository — create it and note the IP above.

Requirements: Ubuntu 22.04/24.04, Docker Engine + Compose plugin, ports **80, 443** open (Hetzner Cloud Firewall), SSH on 22.

```bash
# one-time server setup
sudo apt update && sudo apt install -y docker.io docker-compose-v2
git clone <YOUR_REPO_URL> pcea-connect && cd pcea-connect

# secrets — never committed (.env is gitignored)
cat > .env <<'EOF'
DB_PASSWORD=<strong password>
JWT_SECRET=<256-bit random secret>
MPESA_CONSUMER_KEY=...
MPESA_CONSUMER_SECRET=...
MPESA_PASSKEY=...
MPESA_SHORTCODE=...
MPESA_CALLBACK_URL=https://pcea-connect.com/api/giving/mpesa-callback
EOF
chmod 600 .env

# build + start (db, redis, backend, frontend, nginx)
sudo docker compose -f docker-compose.prod.yml up -d --build
```

Database migrations run automatically on backend start (Flyway).

Restart procedure: `sudo docker compose -f docker-compose.prod.yml restart backend frontend`
Logs: `sudo docker compose -f docker-compose.prod.yml logs -f backend`

---

## STEP 3 — HTTPS (Let's Encrypt via certbot)

1. Temporarily stop nginx, issue the cert, restart:

```bash
sudo docker compose -f docker-compose.prod.yml stop nginx
sudo certbot certonly --standalone -d pcea-connect.com -d www.pcea-connect.com
sudo docker compose -f docker-compose.prod.yml start nginx
```

2. Mount the issued certs into nginx (add to the nginx service volumes in `docker-compose.prod.yml`):

```yaml
      - /etc/letsencrypt:/etc/letsencrypt:ro
```

3. Enable an HTTPS server block with `ssl_certificate /etc/letsencrypt/live/pcea-connect.com/fullchain.pem;` and an HTTP→HTTPS redirect; `nginx.conf` currently ships the port-80 block only.
4. Auto-renewal: `sudo systemctl enable --now certbot.timer` (re-run `certbot renew` via cron/systemd timer).
5. Verify:

```bash
curl -I https://pcea-connect.com          # expect HTTP/2 200, valid cert
curl -I http://pcea-connect.com           # expect 301 → https
```

HTTPS remains `BLOCKED BY EXTERNAL ACCESS` until DNS is live and the certificate is actually issued.

---

## STEP 4 — Smoke test after public deployment

```text
Open https://pcea-connect.com
→ Register (new member) → verify success screen
→ Login → Member Home (dashboard greeting, events, bulletin area)
→ Church (locator) → Ministries (explore) → Events → LIVE (+ Past) → WORKS → Profile/Settings
→ Logout → Login again
```

Repeat from the Android APK (`PCEA-Connect-Demo-v0.1.apk` — points at this domain by default).

Then seed demo content if a demo church is wanted (local demo only, clearly synthetic):
`npm run seed` inside `frontend/` with `SEED_API_URL=https://pcea-connect.com` and an admin account. Demo emails are `*@demo.local`.

---

## Local development path (already verified: READY)

```bash
# 1. Backend (H2 in-memory + Flyway, port 8090)
./gradlew bootRun --args="--spring.profiles.active=local --server.port=8090"

# 2. Seed demo data (idempotent — safe to re-run)
cd frontend && npm install && npm run seed

# 3. Frontend (predev guard checks the dev lock; pin the port)
npm run dev -- -p 3000
```

Ports: backend 8090, frontend 3000.
Health: `GET /api/locator` → `{"success":true,...}`; frontend `GET /login` → 200.

Environment: `frontend/.env.local` sets `NEXT_PUBLIC_API_URL=http://localhost:8090` (copy/adapt per machine; never commit).

---

## Android APK

Build: `cd android-shell && gradlew.bat assembleRelease`
Output: `PCEA-Connect-Demo-v0.1.apk` (signed with the local demo keystore, gitignored).
Embedded URL: `https://pcea-connect.com` (override locally with the `PCEA_SHELL_URL` env var — debug/loopback testing only).
APK build is READY; end-to-end against the public domain is BLOCKED BY EXTERNAL ACCESS until Steps 1–3 are done.
