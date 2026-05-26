# Kabura Ventures — Requirements Checklist

Tick the box if the requirement is met. Leave blank if it's missing or broken.

---

## 1. Homepage (`index.html`)

- [ ] Hero section loads with background video/image and text overlay
- [ ] Hero text rotates between "Welcome to Kabura Ventures", "Discover the Magic of Kenya", "Experience Unforgettable Safaris"
- [ ] Hero review carousel rotates through 4 testimonials with dot indicators
- [ ] "Why Kabura Ventures?" section appears between Hero and Featured Tours with stats + 4 reason cards
- [ ] Stats show: 5,000+ Happy Travelers, 120+ Tours Completed, 4.9 Average Rating
- [ ] Social media icons (Facebook, Instagram, X, YouTube, TikTok) link to the right profiles
- [ ] Featured Tours section loads real tour cards from the API
- [ ] Featured Tours uses a **4-column grid**
- [ ] Featured Tours has **Prev / Next pagination buttons** that show/hide based on page position
- [ ] Clicking Next shows the next 4 tours; clicking Prev shows the previous 4
- [ ] Tour cards show: image, title, location, price, duration, star rating, "View Details" button
- [ ] Tour cards have a **fade-up entrance animation** when they appear (not invisible)
- [ ] Featured Hotels section loads real hotel cards from the API
- [ ] Featured Hotels uses a **4-column grid**
- [ ] Featured Hotels has **Prev / Next pagination buttons** that show/hide based on page position
- [ ] Hotel cards show: image, name, location, price/night, star rating, amenities tags
- [ ] Hotel cards have a **fade-up entrance animation** when they appear
- [ ] Traveler Moments gallery loads images with like buttons, lightbox, and prev/next navigation
- [ ] "Share Your Memory" form allows image upload (drag & drop + file picker)
- [ ] "Get In Touch" contact form submits correctly
- [ ] Newsletter subscription form works
- [ ] Footer shows all links: destinations, quick links, contact info, social icons, payment methods

## 2. Tours Page (`tours.html`)

- [ ] All tours load from API with proper card layout
- [ ] Search/filter bar works
- [ ] Each tour card links to `tour-detail.html?id=...`

## 3. Hotels Page (`hotels.html`)

- [ ] All hotels load from API with proper card layout
- [ ] Search/filter bar works
- [ ] Each hotel card links to hotel detail or booking

## 4. Tour Detail Page (`tour-detail.html`)

- [ ] Page loads tour details based on `?id=` query parameter
- [ ] Shows: images, title, description, price, duration, location, itinerary
- [ ] "Book Now" / inquiry button works

## 5. Flights Page (`flights.html`)

- [ ] Flight request form is functional

## 6. Blog (`blog.html` + `blog-detail.html`)

- [ ] Blog listing loads articles
- [ ] Blog detail page loads full article

## 7. Booking Page (`booking.html`)

- [ ] User can view their bookings
- [ ] Login/Sign-up modals work

## 8. Admin (`admin.html`)

- [ ] Admin dashboard loads for admin users
- [ ] CRUD operations for tours, hotels, bookings, memories

## 9. Global Features

- [ ] Navigation bar has active state on the current page
- [ ] Hamburger menu works on mobile
- [ ] Currency switcher converts prices (KES/USD/EUR)
- [ ] Login / Sign Up modals open and submit correctly
- [ ] Logout works
- [ ] Toast notifications appear for actions
- [ ] AOS (Animate on Scroll) animations work on static content (about, features, trust badges)
- [ ] Scroll animations do NOT cause invisible elements (everything is visible)

## 10. Responsive Design

- [ ] Looks good on desktop (1200px+)
- [ ] Looks good on tablet (768px–1199px)
- [ ] Looks good on mobile (<768px)
- [ ] 4-column grids collapse to 2 columns on tablet, 1 column on mobile
- [ ] No horizontal scrollbars or broken layouts

## 11. Performance & Accessibility

- [ ] Images use `loading="lazy"`
- [ ] Alt text provided on images
- [ ] ARIA labels on interactive elements
- [ ] No console errors on page load
- [ ] Page loads without a "white screen" (content visible within 3 seconds)

---

## Notes / Issues

Use this space to describe anything that doesn't work or is missing:

_______________________________________________________________________

_______________________________________________________________________

_______________________________________________________________________
