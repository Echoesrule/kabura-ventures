# Kabura Adventures Travel Management System

## PROJECT TYPE

You are building a FULL STACK WEB APPLICATION for a travel agency called:

"Kabura Adventures"

This is a MANUAL travel agency system:
- NO airline APIs
- NO hotel APIs
- Flights and hotels are handled via INQUIRY + ADMIN QUOTES

---

# TECH STACK (LOCKED)

## Frontend
- HTML5
- CSS3 (TailwindCSS preferred)
- JavaScript (Vanilla ES6)
- No React, no frameworks

## Backend (LOCKED)
- Python Flask ONLY
- REST API architecture

## Database
- PostgreSQL

## Authentication
- JWT (JSON Web Tokens)
- bcrypt for password hashing

---

# PROJECT STRUCTURE (MANDATORY)

backend/
 ├── app.py
 ├── config.py
 ├── models/
 ├── routes/
 ├── services/
 ├── middleware/
 ├── utils/

frontend/
 ├── index.html
 ├── tours.html
 ├── booking.html
 ├── flights.html
 ├── hotels.html
 ├── admin.html
 ├── assets/
 │    ├── css/
 │    ├── js/
 │    ├── images/

database/
 ├── schema.sql

---

# DESIGN SYSTEM

## Color Palette

- Primary Green: #2E7D32
- Earth Brown: #6D4C41
- Soft White: #FAFAFA
- Accent Gold: #C9A227
- Dark Text: #1C1C1C

---

## Typography

- Headings: Poppins
- Body: Roboto

---

## UI STYLE RULES

- Card-based layout
- Rounded corners (12px)
- Shadow-based elevation
- Travel-focused large images
- Mobile-first responsive design
- Smooth hover transitions

---

# SYSTEM OVERVIEW

Kabura Adventures allows users to:
- Browse tours
- Book tours
- Request flights (manual system)
- Request hotels (manual system)
- Make deposit or pay-on-arrival bookings
- Contact admin

Admins manage everything manually.

---

# USER ROLES

## Customer
- View tours
- Book tours
- Submit flight requests
- Request hotel bookings
- View booking status

## Admin
- Full system control
- Manage tours/hotels/bookings
- Respond to flight requests
- Approve/reject bookings
- Manage payments

---

# CORE FEATURES

## 1. TOURS MODULE
- Create, update, delete tours (admin only)
- View tours (public)
- Book tours (customers)
- Upload multiple images per tour

---

## 2. BOOKINGS SYSTEM (CORE ENGINE)

### Booking statuses:
- pending
- confirmed
- cancelled
- completed
- no_show

### Payment statuses:
- unpaid
- deposit_paid
- fully_paid
- refunded

Each booking contains:
- user_id
- tour_id (nullable)
- hotel_id (nullable)
- booking_type (tour | hotel | flight | package)
- travel_date
- people_count

---

## 3. FLIGHT REQUEST SYSTEM (MANUAL)

- No airline API integration
- User submits request form:
  - from_location
  - to_location
  - departure_date
  - return_date
  - passengers
  - class
- Admin manually responds with price quote

---

## 4. HOTEL SYSTEM

- Manual hotel listings
- Users request booking or availability
- Admin confirms manually

---

## 5. PAYMENT SYSTEM

Supports:
- Deposit payments
- Full payments
- Refunds

Payment methods:
- M-Pesa
- Cash
- Card (future)

Payments are linked to bookings.

---

## 6. CONTACT / MESSAGING SYSTEM

- Contact form stored in database
- Admin replies manually

---

# DATABASE TABLES

- users
- tours
- hotels
- bookings
- flight_requests
- payments
- messages
- notifications
- tour_images
- hotel_images

---

# SECURITY REQUIREMENTS

- JWT authentication required
- bcrypt password hashing
- Role-based access control (RBAC)
- Input validation on all endpoints
- Protection against:
  - SQL injection
  - XSS attacks
- Admin routes fully protected
- Rate limiting on forms
- HTTPS required in production

---

# API DESIGN (REST ONLY)

## AUTH
- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/profile

## TOURS
- GET /api/tours
- GET /api/tours/:id
- POST /api/tours (admin)
- PUT /api/tours/:id (admin)
- DELETE /api/tours/:id (admin)

## BOOKINGS
- POST /api/bookings
- GET /api/bookings/user
- GET /api/bookings (admin)
- PUT /api/bookings/:id/status (admin)

## FLIGHTS
- POST /api/flights/request
- GET /api/flights (admin)
- PUT /api/flights/:id (admin response)

## HOTELS
- GET /api/hotels
- POST /api/hotels (admin)

## PAYMENTS
- POST /api/payments
- GET /api/payments

## MESSAGES
- POST /api/messages
- GET /api/messages (admin)

---

# BUSINESS LOGIC (IMPORTANT)

- All bookings start as "pending"
- Admin must confirm all bookings manually
- Flights are ONLY inquiries (no auto booking)
- Hotels are ONLY inquiries (no auto booking)
- Deposits are optional but supported
- Booking lifecycle must be tracked

---

# PERFORMANCE REQUIREMENTS

- Page load under 2.5 seconds
- Mobile responsive design required
- Optimized image loading
- Efficient database queries

---

# OUTPUT REQUIREMENT (VERY IMPORTANT)

Generate a COMPLETE WORKING PROJECT including:

1. Flask backend with routes and models
2. PostgreSQL schema
3. Frontend pages (HTML/CSS/JS)
4. Admin dashboard UI
5. Authentication system (JWT)
6. Booking system fully functional
7. Clean modular code structure
8. Ready-to-run MVP

NO placeholders only — must be functional.

---

# GOAL

Deliver a production-ready MVP for a travel agency system that can be deployed and used by real customers.