# Kabura Ventures

A full-stack tourist booking and management platform for a Kenyan travel agency. Visitors can browse tours, hotels, and destinations, plan flights, book holidays, and get in touch — while admins manage the entire catalogue, bookings, payments, media, and analytics from a single dashboard.

Built with **Flask** (REST API + server-rendered pages) on the backend and **vanilla HTML/CSS/JS** on the frontend, backed by **Supabase PostgreSQL**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Authentication](#authentication)
- [Storage](#storage)
- [API](#api)
- [Admin Dashboard](#admin-dashboard)
- [Deployment](#deployment)
- [Security](#security)
- [Documentation](#documentation)
- [License](#license)

---

## Features

**Customer-facing**

- Tour & hotel catalogue with rich detail pages (`/tours/<slug>`, `/hotels/<slug>`)
- Search across tours, hotels, blogs, and destinations (`/api/search`)
- Tour & hotel filtering, pricing with discounts and currency conversion (KES, USD, EUR)
- Destination pages and activity categories (safari, beach, cultural, trekking, honeymoon, group)
- Online bookings with guest info, nationality, coupons, and payment type (deposit / full)
- Flight request & quoting workflow (manual, admin-provided quotes)
- Wishlist (saved tours & hotels)
- Blog with categories, tags, and related posts
- Reviews & ratings with like/dislike and admin replies
- Contact form + help center, newsletter subscription
- Tour availability calendar and booking status tracking
- Auth with email OTP verification and password reset (SMTP or Supabase)

**Admin (`/admin`)**

- Full CRUD for tours, hotels, destinations, offers, testimonials, blogs, activity types
- Booking & flight request management with status tracking
- Payment recording (M-Pesa, cash, card, bank transfer, PayPal) and refunds
- Hero media management (video/images) with ordering + auth slide carousel
- Review moderation, message inbox with replies, newsletter subscriber list
- User management (roles: customer / admin / agent)
- Page content editor for homepage sections and company info
- Analytics dashboard

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, Flask 3, Flask-SQLAlchemy, Flask-Bcrypt, Flask-CORS |
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6) |
| Database | PostgreSQL via Supabase |
| Auth | JWT (PyJWT) + Supabase Auth + email OTP |
| Storage | Local filesystem or Supabase Storage |
| Deployment | Render (backend), Vercel (frontend), Supabase (DB/storage) |
| Server | Gunicorn |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│  Frontend  (Vercel / static files served by Flask)           │
│  index.html, tours.html, hotels.html, admin.html, ...        │
└───────────────────────────────┬──────────────────────────────┘
                                │ REST API (JSON, Bearer JWT)
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  Backend  Flask app (Render)                                  │
│  Blueprints → Services → Models                               │
└───────────────────────────────┬──────────────────────────────┘
                                │ SQLAlchemy
                                ▼
┌──────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL  (+ Supabase Storage for uploads)        │
└──────────────────────────────────────────────────────────────┘
```

The backend serves the frontend statically (`static_folder='../frontend'`) and also exposes the JSON API under `/api/*`. In production the frontend can be deployed separately on Vercel (see [`frontend/vercel.json`](frontend/vercel.json)).

---

## Project Structure

```
kabura-ventures/
├── backend/
│   ├── app.py                  # App factory, blueprints, page routes, migrations
│   ├── config.py               # Configuration + env loading
│   ├── models/                 # SQLAlchemy models (users, tours, hotels, ...)
│   ├── routes/                 # Blueprints (public + /admin/* endpoints)
│   ├── services/               # Business logic (bookings, media, storage, seed...)
│   ├── middleware/             # JWT auth + rate limiting
│   ├── utils/                  # Helpers
│   └── templates/              # admin.html
├── frontend/
│   ├── *.html                  # Pages (index, tours, hotels, booking, admin, ...)
│   ├── assets/
│   │   ├── css/                # Per-page stylesheets
│   │   ├── js/                 # api.js client, page scripts, components.js
│   │   └── images/             # Static images (logos, favicons, hero assets)
│   └── vercel.json             # Vercel rewrites for SPA-style routing
├── database/
│   └── schema.sql              # SQL schema reference
├── run.py                      # Local entry point
├── Procfile                    # Gunicorn start command (Render)
├── render.yaml                 # Render blueprint
├── requirements.txt
├── API.md                      # API endpoint reference
├── database.md                 # Data model reference
└── SUPABASE_AUTH_SETUP.md      # Supabase auth configuration guide
```

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js (only needed for optional frontend tooling; the frontend is plain static files)
- A Supabase project (Postgres + optional Storage/Auth)

### 1. Clone & set up the backend

```bash
git clone git@github.com:echoesrule/kabura-ventures.git
cd kabura-ventures

python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env               # then fill in your values (see below)
```

### 2. Configure the environment

Copy `.env.example` to `.env` and set at minimum:

- `SECRET_KEY` and `JWT_SECRET_KEY`
- `DATABASE_URL` pointing at your Supabase Postgres instance
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`

### 3. Run locally

```bash
python run.py
```

The app is served at `http://localhost:5000`.

Tables are created and migrated automatically on startup (`db.create_all()` plus idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations), and the database is seeded with demo tours, hotels, blogs, destinations, and more via `services/seed.py`.

### 4. Run the frontend standalone (optional)

The frontend is plain static HTML and can be opened directly or served from any static host. When run from a different origin than the backend, set `TRUSTED_ORIGINS` on the backend and point `frontend/assets/js/api.js`'s `API_BASE` at your backend URL.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | Flask secret key (session/CSRF) |
| `JWT_SECRET_KEY` | Yes | Key used to sign JWT tokens |
| `DATABASE_URL` | Yes | PostgreSQL connection string (Supabase URI, `sslmode=require` is auto-added) |
| `SUPABASE_URL` | Yes* | Supabase project URL (needed for auth/storage) |
| `SUPABASE_ANON_KEY` | Yes* | Supabase public anon key |
| `SUPABASE_SERVICE_KEY` | Yes* | Supabase service-role key (storage uploads) |
| `SUPABASE_STORAGE_BUCKET` | No | Storage bucket name (default: `kabura`) |
| `STORAGE_PROVIDER` | No | `local` or `supabase` (default: `local`) |
| `BACKEND_URL` | No | Public backend URL used to build absolute URLs for local uploads |
| `FLASK_DEBUG` | No | Set to `0` in production |
| `DATABASE_SSL_MODE` | No | SSL mode for the DB connection (default: `require`) |
| `TRUSTED_ORIGINS` | No | Comma-separated CORS origins; defaults to `*` when unset |
| `SMTP_SERVER` / `SMTP_PORT` | No | SMTP host/port for sending OTP emails directly |
| `SMTP_USERNAME` / `SMTP_PASSWORD` | No | SMTP credentials |
| `SMTP_FROM` | No | Sender address for OTP/email notifications |
| `SMTP_USE_TLS` | No | Enable TLS for SMTP (`true`/`false`) |

\* Required when using Supabase Auth or Supabase Storage.

See [`.env.example`](.env.example) for the full commented template.

---

## Database

The data model lives in [`backend/models/`](backend/models/) (SQLAlchemy) and is described in [`database.md`](database.md). Core entities:

- **Users** (customer / admin / agent) and **Wishlists**
- **Tours** (+ images, availability calendar, activity types) and **Hotels** (+ images)
- **Bookings** (tour/hotel/flight/package) with status & payment status tracking
- **Payments** (M-Pesa, cash, card, bank transfer, PayPal)
- **FlightRequests** (manual quote workflow)
- **Blogs**, **Messages** (contact/inbox), **Subscribers**
- **Destinations**, **OfferServices**, **Testimonials**, **PageSections**
- **HeroMedia / HeroImages / AuthSlides** (marketing media)
- **Reviews** (with likes/dislikes and admin replies), **Currencies** (exchange rates)

A raw SQL reference schema is also available at [`database/schema.sql`](database/schema.sql).

---

## Authentication

- **Sign-up / login** use email + password with bcrypt hashing and return a JWT (24h expiry).
- **Email verification** uses a 6-digit OTP. If SMTP is configured, OTPs are emailed directly; otherwise the backend falls back to Supabase's email service.
- **Password reset** uses Supabase Auth directly when available, falling back to SMTP.
- The frontend sends the token as `Authorization: Bearer <token>`; the API enforces role-based access (customer / admin / agent).
- See [`SUPABASE_AUTH_SETUP.md`](SUPABASE_AUTH_SETUP.md) for the full Supabase configuration guide.

---

## Storage

Image uploads (tour/hotel images, hero media, auth slides, logos) are handled by [`backend/services/storage.py`](backend/services/storage.py):

- **Local storage** (default): files are written to `frontend/assets/images/` and served at `/assets/images/<filename>`.
- **Supabase storage**: files are uploaded to the configured bucket (`SUPABASE_STORAGE_BUCKET`, default `kabura`).

Uploads are limited to 5MB with allowed types `png`, `jpg`, `jpeg`, `gif`, `webp`.

---

## API

The REST API is exposed under `/api/*`. Highlights:

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `/login`, `/send-otp`, `/verify-email`, profile |
| Tours | `GET/POST/PUT/DELETE /api/tours`, `/api/tours/<id>` |
| Hotels | `GET/POST/PUT/DELETE /api/hotels`, `/api/hotels/<id>` |
| Bookings | `POST /api/bookings`, user bookings, admin status updates, cancel |
| Flights | `POST /api/flights/request`, admin quotes at `/api/admin/flights` |
| Payments | `POST /api/payments`, payment history |
| Reviews | `GET/POST/DELETE /api/reviews`, like/dislike |
| Search | `GET /api/search?q=` |
| Blog | `GET/POST/PUT/DELETE /api/blogs` (+ admin) |
| Media | `/api/media/hero`, `/api/media/auth-slides` |
| Currencies | `GET /api/currencies` |
| Wishlist / Availability / Subscribers / Messages | dedicated endpoints |
| Admin | `/api/admin/*` for every resource + `/api/admin/analytics` |

See [`API.md`](API.md) for the full endpoint reference with request/response examples, and [`frontend/assets/js/api.js`](frontend/assets/js/api.js) for the client wrapper.

---

## Admin Dashboard

The admin panel is served at `/admin` (auth-protected, admin role only). It provides:

- Tour / hotel / destination / offer / testimonial / blog CRUD with image uploads
- Booking and flight-request management with status changes
- Payment recording and history
- Hero media manager (video & images, ordering) and auth-slide carousel
- Review replies and moderation
- Message inbox with admin replies, subscriber list, user management
- Page-content editing and analytics

The admin UI source is in [`backend/templates/admin.html`](backend/templates/admin.html) and [`frontend/assets/js/admin.js`](frontend/assets/js/admin.js).

---

## Deployment

### Backend — Render

`render.yaml` is a blueprint that deploys the API with Gunicorn:

```
gunicorn run:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120
```

Required env vars are `SECRET_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`. The Procfile is equivalent for manual Render service setup.

### Frontend — Vercel

Deploy the `frontend/` directory. `vercel.json` rewrites `/admin` to the Render backend and falls back to `index.html` for clean URLs.

### Database — Supabase

Provision a Postgres project, create the tables via the app's auto-migration (or `database/schema.sql`), and apply the row-level security policies in [`supabase_rls_policies.sql`](supabase_rls_policies.sql) if using Supabase Auth.

---

## Security

- JWT-based auth with role-based access control (customer / admin / agent)
- Password hashing with bcrypt
- Email verification via one-time OTP
- Rate limiting on auth, contact, newsletter, review, booking, and flight endpoints
- Security headers (`X-Content-Type-Options`, `X-Frame-Options`, HSTS, Referrer-Policy, Permissions-Policy)
- Upload validation (extension allow-list, 5MB size cap, 413 handler)
- Graceful 404/500 JSON handlers for `/api/*`

---

## Documentation

- [`API.md`](API.md) — REST API endpoint reference
- [`database.md`](database.md) — data model overview
- [`database/schema.sql`](database/schema.sql) — raw SQL schema
- [`SUPABASE_AUTH_SETUP.md`](SUPABASE_AUTH_SETUP.md) — Supabase Auth configuration
- [`supabase_rls_policies.sql`](supabase_rls_policies.sql) — row-level security policies
- [`Wireframe.md`](Wireframe.md) — site structure and wireframes

---

## License

This is a private project. No license is specified — contact the project owners before reuse.
