# SYSTEM ARCHITECTURE

```
Frontend (Website / Admin Dashboard)
    ↓
REST API (Backend Server)
    ↓
Business Logic Layer
    ↓
Database (SQL)
```

---

# API ENDPOINTS

## 1. AUTHENTICATION API

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Register user | POST | `/api/auth/register` | Create new account |
| Login | POST | `/api/auth/login` | Return JWT token |
| Get profile | GET | `/api/auth/profile` | Requires Bearer token |

### Register Request
```json
{
  "full_name": "John Doe",
  "email": "john@email.com",
  "phone": "0700000000",
  "password": "123456"
}
```

### Login Response
```json
{
  "token": "JWT_TOKEN",
  "user": {
    "id": 1,
    "role": "customer"
  }
}
```

---

## 2. TOURS API

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Get all tours | GET | `/api/tours` | Public |
| Get single tour | GET | `/api/tours/{id}` | Public |
| Create tour | POST | `/api/tours` | Admin only |
| Update tour | PUT | `/api/tours/{id}` | Admin only |
| Delete tour | DELETE | `/api/tours/{id}` | Admin only |

---

## 3. HOTELS API

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Get all hotels | GET | `/api/hotels` | Public |
| Add hotel | POST | `/api/hotels` | Admin only |
| Update hotel | PUT | `/api/hotels/{id}` | Admin only |
| Delete hotel | DELETE | `/api/hotels/{id}` | Admin only |

---

## 4. FLIGHT REQUEST API (Manual System)

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Submit flight request | POST | `/api/flights/request` | Customer |
| Get all flight requests | GET | `/api/flights/requests` | Admin only |
| Update flight request | PUT | `/api/flights/requests/{id}` | Admin - provide quote |

### Flight Request
```json
{
  "from_location": "Johannesburg",
  "to_location": "Nairobi",
  "departure_date": "2026-06-10",
  "return_date": "2026-06-20",
  "passengers": 2,
  "class": "economy"
}
```

### Admin Quote Response
```json
{
  "status": "quoted",
  "admin_notes": "Flight is KSh 45,000 via Kenya Airways"
}
```

---

## 5. BOOKINGS API (Core System)

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Create booking | POST | `/api/bookings` | Customer |
| Get user bookings | GET | `/api/bookings/user` | User's own bookings |
| Get all bookings | GET | `/api/bookings` | Admin only |
| Update booking status | PUT | `/api/bookings/{id}/status` | Admin only |
| Cancel booking | POST | `/api/bookings/{id}/cancel` | User or Admin |

### Create Booking Request
```json
{
  "tour_id": 1,
  "booking_type": "tour",
  "travel_date": "2026-07-01",
  "people_count": 3
}
```

### Update Status Request
```json
{
  "status": "confirmed"
}
```

---

## 6. PAYMENTS API

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Record payment | POST | `/api/payments` | Deposit or full payment |
| Get all payments | GET | `/api/payments` | Admin only |
| Get booking payments | GET | `/api/bookings/{id}/payments` | Payment history |

### Record Payment Request
```json
{
  "booking_id": 1,
  "amount": 2000,
  "payment_type": "deposit",
  "method": "mpesa",
  "transaction_ref": "TX12345"
}
```

---

## 7. MESSAGES/CONTACT API

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Send message | POST | `/api/messages` | Public contact form |
| Get messages | GET | `/api/messages` | Admin only |

---

## 8. NOTIFICATIONS API

| Action | Method | Endpoint | Notes |
|--------|--------|----------|-------|
| Get notifications | GET | `/api/notifications` | User's notifications |
| Mark as read | PUT | `/api/notifications/{id}/read` | Mark notification read |

---

# AUTHENTICATION & SECURITY

## JWT Flow

| Step | Action |
|------|--------|
| 1 | User logs in with email + password |
| 2 | Server validates and returns JWT token |
| 3 | Frontend stores token (localStorage/session) |
| 4 | Every request includes `Authorization: Bearer <token>` header |

## Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Customer** | View tours/hotels, make bookings, submit flight requests, manage own bookings |
| **Admin** | Full control - manage users, tours, hotels, bookings, payments, view all data |
| **Agent** | Limited booking management - view/update bookings assigned to them |
