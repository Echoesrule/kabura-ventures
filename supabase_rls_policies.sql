-- ============================================================
-- Supabase RLS Policies for Kabura Adventures
-- Run this in the Supabase SQL Editor
-- ============================================================

-- ============================================================
-- USERS
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
ON users
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- TOURS
-- ============================================================
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tours"
ON tours
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert tours"
ON tours
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can update tours"
ON tours
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can delete tours"
ON tours
FOR DELETE
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- TOUR IMAGES
-- ============================================================
ALTER TABLE tour_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view tour images"
ON tour_images
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage tour images"
ON tour_images
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- HOTELS
-- ============================================================
ALTER TABLE hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view hotels"
ON hotels
FOR SELECT
USING (true);

CREATE POLICY "Admins can insert hotels"
ON hotels
FOR INSERT
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can update hotels"
ON hotels
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can delete hotels"
ON hotels
FOR DELETE
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- HOTEL IMAGES
-- ============================================================
ALTER TABLE hotel_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view hotel images"
ON hotel_images
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage hotel images"
ON hotel_images
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- BOOKINGS
-- ============================================================
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookings"
ON bookings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
ON bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
ON bookings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings"
ON bookings
FOR SELECT
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can manage bookings"
ON bookings
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- REVIEWS
-- ============================================================
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reviews"
ON reviews
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can post reviews"
ON reviews
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own reviews"
ON reviews
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON reviews
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reviews"
ON reviews
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- FLIGHT REQUESTS
-- ============================================================
ALTER TABLE flight_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flight requests"
ON flight_requests
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create flight requests"
ON flight_requests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage flight requests"
ON flight_requests
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- MESSAGES
-- ============================================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send messages"
ON messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view own messages"
ON messages
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all messages"
ON messages
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
ON notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
ON notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications"
ON notifications
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- PAYMENTS
-- ============================================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
ON payments
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create payments"
ON payments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all payments"
ON payments
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- WISHLIST
-- ============================================================
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wishlist"
ON wishlist
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wishlist"
ON wishlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from wishlist"
ON wishlist
FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wishlist"
ON wishlist
FOR SELECT
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- SUBSCRIBERS
-- ============================================================
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
ON subscribers
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can manage subscribers"
ON subscribers
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- TOUR AVAILABILITY
-- ============================================================
ALTER TABLE tour_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view availability"
ON tour_availability
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage availability"
ON tour_availability
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- EXCHANGE RATES
-- ============================================================
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view exchange rates"
ON exchange_rates
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage exchange rates"
ON exchange_rates
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- BLOGS
-- ============================================================
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published blogs"
ON blogs
FOR SELECT
USING (published = true OR auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

CREATE POLICY "Admins can manage blogs"
ON blogs
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- DESTINATIONS
-- ============================================================
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view destinations"
ON destinations
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage destinations"
ON destinations
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- OFFER SERVICES
-- ============================================================
ALTER TABLE offer_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view offer services"
ON offer_services
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage offer services"
ON offer_services
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- TESTIMONIALS
-- ============================================================
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view testimonials"
ON testimonials
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage testimonials"
ON testimonials
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- PAGE SECTIONS
-- ============================================================
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view page sections"
ON page_sections
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage page sections"
ON page_sections
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- ACTIVITY TYPES
-- ============================================================
ALTER TABLE activity_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view activity types"
ON activity_types
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage activity types"
ON activity_types
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- HERO MEDIA
-- ============================================================
ALTER TABLE hero_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hero media"
ON hero_media
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage hero media"
ON hero_media
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- HERO IMAGES
-- ============================================================
ALTER TABLE hero_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view hero images"
ON hero_images
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage hero images"
ON hero_images
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- ============================================================
-- AUTH SLIDES
-- ============================================================
ALTER TABLE auth_slides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view auth slides"
ON auth_slides
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage auth slides"
ON auth_slides
FOR ALL
USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));
