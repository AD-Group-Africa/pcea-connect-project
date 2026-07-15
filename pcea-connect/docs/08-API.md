# PCEA Connect – API Reference
**Base URL:** http://<host>:8087/api

## Authentication
All endpoints except public ones require: Authorization: Bearer <token>

## Public Endpoints
POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/forgot-password, POST /auth/reset-password, GET /health, GET /locator/**

## Core Modules
Church, Membership, Events, Giving, Ministries, Attendance, Pastoral Care, Bible, Media, Livestream, Notifications, Feed, Volunteer, Search, Admin, Communication, Analytics, M-Pesa

## Response Format
{"success": true, "message": "...", "data": {...}}
