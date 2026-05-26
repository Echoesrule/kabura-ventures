# USERS

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| full_name | VARCHAR(255) | User's full name |
| email | VARCHAR(255) | Unique email address |
| phone | VARCHAR(20) | Phone number |
| password_hash | VARCHAR(255) | Hashed password |
| role | ENUM | customer \| admin \| agent |
| created_at | TIMESTAMP | Account creation date |

---

# TOURS

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| title | VARCHAR(255) | Tour name |
| description | TEXT | Detailed description |
| location | VARCHAR(255) | Tour destination |
| price | DECIMAL(10, 2) | Tour price |
| duration_days | INT | Number of days |
| max_people | INT | Maximum capacity |
| image_url | VARCHAR(255) | Featured image |
| created_at | TIMESTAMP | Creation date |

---

# HOTELS

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| name | VARCHAR(255) | Hotel name |
| location | VARCHAR(255) | Hotel location |
| description | TEXT | Hotel details |
| price_per_night | DECIMAL(10, 2) | Nightly rate |
| rating | DECIMAL(2, 1) | Star rating (1-5) |
| image_url | VARCHAR(255) | Featured image |
| created_at | TIMESTAMP | Creation date |

---

# FLIGHT REQUESTS (Manual System)

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| user_id | INT | Foreign Key → Users |
| from_location | VARCHAR(255) | Departure location |
| to_location | VARCHAR(255) | Arrival location |
| departure_date | DATE | Travel date |
| return_date | DATE | Return date (nullable) |
| passengers | INT | Number of passengers |
| class | ENUM | economy \| business \| first |
| status | ENUM | pending \| quoted \| confirmed \| cancelled |
| admin_notes | TEXT | Admin comments |
| created_at | TIMESTAMP | Request date |

---

# BOOKINGS (Core System)

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| user_id | INT | Foreign Key → Users |
| booking_type | ENUM | tour \| hotel \| flight \| package |
| tour_id | INT | Foreign Key → Tours (nullable) |
| hotel_id | INT | Foreign Key → Hotels (nullable) |
| travel_date | DATE | Travel date |
| people_count | INT | Number of people |
| status | ENUM | pending \| confirmed \| cancelled \| completed \| no_show |
| payment_status | ENUM | unpaid \| deposit_paid \| fully_paid \| refunded |
| total_amount | DECIMAL(10, 2) | Total booking cost |
| deposit_amount | DECIMAL(10, 2) | Deposit paid (nullable) |
| created_at | TIMESTAMP | Booking date |
| updated_at | TIMESTAMP | Last update |

---

# PAYMENTS

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| booking_id | INT | Foreign Key → Bookings |
| amount | DECIMAL(10, 2) | Payment amount |
| payment_type | ENUM | deposit \| full \| refund |
| method | ENUM | mpesa \| cash \| card \| bank_transfer |
| status | ENUM | pending \| successful \| failed |
| transaction_ref | VARCHAR(255) | Transaction reference |
| created_at | TIMESTAMP | Payment date |

---

# TOUR IMAGES

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| tour_id | INT | Foreign Key → Tours |
| image_url | VARCHAR(255) | Image URL |

---

# HOTEL IMAGES

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| hotel_id | INT | Foreign Key → Hotels |
| image_url | VARCHAR(255) | Image URL |

---

# MESSAGES (Contact)

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| name | VARCHAR(255) | Sender's name |
| email | VARCHAR(255) | Sender's email |
| phone | VARCHAR(20) | Sender's phone |
| message | TEXT | Message content |
| status | ENUM | new \| replied \| closed |
| created_at | TIMESTAMP | Message date |

---

# NOTIFICATIONS

| Column | Type | Details |
|--------|------|---------|
| id | INT | Primary Key |
| user_id | INT | Foreign Key → Users |
| message | TEXT | Notification content |
| type | ENUM | booking \| payment \| system |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMP | Creation date |

---

# RELATIONSHIP MAP

```
Users → Bookings (1:M)
Users → FlightRequests (1:M)
Users → Notifications (1:M)
Tours → Bookings (1:M)
Tours → TourImages (1:M)
Hotels → Bookings (1:M)
Hotels → HotelImages (1:M)
Bookings → Payments (1:M)
```