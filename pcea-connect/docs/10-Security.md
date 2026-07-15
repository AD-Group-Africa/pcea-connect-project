# PCEA Connect – Security
**Version 1.0**

- JWT (HS256), BCrypt passwords
- Public endpoints only /auth/**, /locator/**, /health
- RBAC roles: MEMBER, ELDER, ADMIN, SUPER_ADMIN, TREASURER, CLERK
- Secrets in environment variables only
- HTTPS via Nginx + Let's Encrypt
- Audit logs for all sensitive actions
- M-Pesa callback signature verification & idempotency
- Daily PostgreSQL backups, monthly restore tests
- Kenya Data Protection Act compliant
