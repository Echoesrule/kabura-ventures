# Kabura Ventures

A full-stack tourist booking and management platform for a Kenyan travel agency. Built with Flask and vanilla HTML/CSS/JS.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6)
- **Backend:** Python Flask, REST API
- **Database:** PostgreSQL (Supabase)
- **Deployment:** Render (backend), Vercel (frontend)

## Features

- Tour & hotel browsing with search and filters
- Booking management with status tracking
- Flight request & admin quoting system
- Payment recording (M-Pesa, cash, card)
- Blog with categories and tags
- Newsletter subscriptions
- Contact form with admin replies
- Wishlist (saved tours/hotels)
- User reviews and ratings
- Currency conversion (KES, USD, EUR)
- Tour availability calendar
- Admin dashboard with analytics
- Hero media management (video/images)
- Rate limiting on auth forms

## Architecture

```
Frontend (Vercel)  →  Backend API (Render)  →  Supabase PostgreSQL
```

## Local Setup

```bash
# Clone
git clone https://github.com/Echoesrule/kabura-ventures.git
cd kabura-ventures

# Backend
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install -r requirements.txt
python run.py

# Open http://localhost:5000
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Flask secret key |
| `JWT_SECRET_KEY` | JWT signing key |
| `DATABASE_URL` | PostgreSQL connection string |
| `FLASK_DEBUG` | Set to `0` in production |
| `STORAGE_PROVIDER` | `local` or `supabase` |
| `BACKEND_URL` | Backend public URL for uploaded local images |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key for storage uploads |
| `SUPABASE_STORAGE_BUCKET` | Supabase storage bucket name (default: `public`) |

## Deployment

- **Backend:** Deployed on Render via `render.yaml` (blueprint)
- **Frontend:** Deployed on Vercel (`frontend/` directory)
- **Database:** Supabase PostgreSQL

## API Docs

See [`API.md`](API.md) for full endpoint reference.
