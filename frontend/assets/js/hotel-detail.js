        var hotelId = new URLSearchParams(window.location.search).get('id');
        var currentHotel = null;
        var lightboxImages = [];
        var lightboxIndex = 0;
        var mapInstance = null;

        async function init() {
            if (!hotelId) {
                document.getElementById('hotel-loader').style.display = 'none';
                document.getElementById('hotel-error').style.display = 'block';
                return;
            }
            try {
                var result = await api.getHotel(hotelId);
                currentHotel = result.hotel || result;
                document.getElementById('hotel-loader').style.display = 'none';
                document.getElementById('hotel-content').style.display = 'block';
            renderAll();
        } catch (err) {
            document.getElementById('hotel-loader').style.display = 'none';
            document.getElementById('hotel-error').style.display = 'block';
            document.querySelector('#hotel-error p').textContent = err.message || 'Failed to load hotel details.';
        }
    }

    function getPrimaryImage() {
        if (!currentHotel.images || !currentHotel.images.length) return '/assets/images/placeholder.svg';
        var img = currentHotel.images.find(function(i) { return i.is_primary; }) || currentHotel.images[0];
        return img ? img.image_url : '/assets/images/placeholder.svg';
    }

    function renderAll() {
        renderHero();
        renderGallery();
        renderOverview();
        renderAmenities();
        renderRooms();
        renderReviews();
        renderSidebar();
        renderRelated();
        renderMobileBar();
        renderReviewFormSection();
        setupBooking();
    }

        function renderHero() {
            var h = currentHotel;
            var hero = document.getElementById('hotel-hero');
            hero.style.backgroundImage = 'url(' + getPrimaryImage() + ')';

            document.getElementById('breadcrumb').innerHTML = '<a href="/">Home</a> <span>&#8250;</span> <a href="/hotels.html">Hotels</a> <span>&#8250;</span> ' + escapeHTML(h.name);

            document.getElementById('hotel-title').textContent = h.name;

            var rating = h.avg_rating || h.rating || 0;
            var reviewCount = h.reviews_count || 0;
            if (rating > 0) {
                var full = Math.round(rating);
                var stars = svgIcon('star',{size:14}).repeat(full) + svgIcon('star-outline',{size:14}).repeat(5 - full);
                document.getElementById('hotel-rating-line').innerHTML = '<span class="rating-stars">' + stars + '</span> <span class="rating-score">' + rating.toFixed(1) + '</span> <span class="rating-recs">(' + reviewCount + ' reviews)</span>';
            }

            document.getElementById('hotel-hero-meta').innerHTML = '<span>' + escapeHTML(h.location || 'Kenya') + '</span>';

            var badgesHtml = '';
            if (rating >= 4.5) badgesHtml += '<span class="hotel-hero-badge accent">Top Rated</span>';
            if (h.available !== false) badgesHtml += '<span class="hotel-hero-badge">Available</span>';
            badgesHtml += '<span class="hotel-hero-badge">Free Cancellation</span>';
            document.getElementById('hotel-hero-badges').innerHTML = badgesHtml;
        }

        function renderGallery() {
            var images = currentHotel.images || [];
            var container = document.getElementById('hotel-gallery-grid');
            if (!images.length) {
                container.innerHTML = '<img src="/assets/images/placeholder.svg" alt="' + escapeHTML(currentHotel.name) + '" style="width:100%;height:380px;object-fit:cover;border-radius:var(--radius-md);">';
                return;
            }
            lightboxImages = images;
            var main = images[0];
            var rest = images.slice(1, 4);

            var html = '<div class="hotel-gallery-main" onclick="openLightbox(0)">'
                + '<img src="' + main.image_url + '" alt="' + escapeHTML(currentHotel.name) + '">'
                + '</div>'
                + '<div class="hotel-gallery-thumbs">';
            rest.forEach(function(img, i) {
                html += '<div onclick="openLightbox(' + (i + 1) + ')">'
                    + '<img src="' + img.image_url + '" alt="' + escapeHTML(currentHotel.name) + '">';
                if (i === rest.length - 1 && images.length > 4) {
                    html += '<div class="hotel-gallery-more-overlay">+' + (images.length - 4) + '</div>';
                }
                html += '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
        }

        function renderOverview() {
            var h = currentHotel;
            document.getElementById('hotel-description').textContent = h.description || 'No description available.';

            var infoHtml = '';
            infoHtml += '<div class="hotel-info-card">' + svgIcon('bed') + '<h4>Price/night</h4><p><span class="price-amount" data-kes="' + h.price_per_night + '">' + window.formatPrice(h.price_per_night) + '</span></p></div>';
            infoHtml += '<div class="hotel-info-card">' + svgIcon('star') + '<h4>Rating</h4><p>' + (h.avg_rating || h.rating || 0).toFixed(1) + '</p></div>';
            infoHtml += '<div class="hotel-info-card">' + svgIcon('comment') + '<h4>Reviews</h4><p>' + (h.reviews_count || 0) + '</p></div>';
            if (h.location) infoHtml += '<div class="hotel-info-card">' + svgIcon('map-pin') + '<h4>Location</h4><p>' + escapeHTML(h.location) + '</p></div>';
            document.getElementById('hotel-info-cards').innerHTML = infoHtml;
        }

        function renderAmenities() {
            var amenities = Array.isArray(currentHotel.amenities) ? currentHotel.amenities : [];
            var container = document.getElementById('amenities-grid');
            if (!amenities.length) {
                container.innerHTML = '<p style="color:var(--text-secondary);">No amenities listed.</p>';
                return;
            }
            var icons = {
                'wifi': 'wifi', 'free wifi': 'wifi', 'parking': 'parking', 'free parking': 'parking',
                'breakfast': 'coffee', 'free breakfast': 'coffee', 'pool': 'swimmer', 'swimming pool': 'swimmer',
                'gym': 'dumbbell', 'fitness': 'dumbbell', 'restaurant': 'utensils', 'bar': 'glass-cheers',
                'ac': 'snowflake', 'air conditioning': 'snowflake', 'heating': 'temp-high',
                'tv': 'tv', 'kitchen': 'utensils', 'washer': 'soap', 'pets': 'paw', 'pet friendly': 'paw',
                'beach': 'umbrella', 'spa': 'spa', 'business': 'briefcase', 'laundry': 'soap',
                'shuttle': 'shuttle-van', 'airport': 'plane', 'airport shuttle': 'plane',
                'room service': 'bell', 'concierge': 'bell', 'front desk': 'user',
                'check in': 'clock', 'check out': 'clock', 'smoking': 'smoking', 'non smoking': 'no-smoking',
                'accessible': 'wheelchair', 'wheelchair': 'wheelchair',
                'garden': 'seedling', 'terrace': 'tree', 'view': 'mountain', 'ocean view': 'water',
                'lake view': 'water', 'mountain view': 'mountain',
                'balcony': 'door-open', 'patio': 'door-open', 'desk': 'laptop', 'workspace': 'laptop'
            };
            var grid = document.getElementById('amenities-grid');
            grid.innerHTML = amenities.map(function(a) {
                var key = a.trim().toLowerCase();
                var icon = 'check-circle';
                for (var k in icons) {
                    if (key.indexOf(k) !== -1 || k.indexOf(key) !== -1) { icon = icons[k]; break; }
                }
                return '<div class="amenity-item">' + svgIcon(icon, {size:16}) + '<span>' + escapeHTML(a.trim()) + '</span></div>';
            }).join('');
        }

        function renderRooms() {
            var container = document.getElementById('rooms-list');
            var h = currentHotel;
            var roomTypes = [
                { name: 'Standard Room', desc: 'Comfortable room with essential amenities for a pleasant stay.', guests: 2, beds: '1 Queen', icon: 'bed' },
                { name: 'Deluxe Room', desc: 'Spacious room with upgraded furnishings and premium amenities.', guests: 2, beds: '1 King', icon: 'bed' },
                { name: 'Suite', desc: 'Luxurious suite with separate living area and stunning views.', guests: 3, beds: '1 King + Sofa', icon: 'couch' }
            ];
            container.innerHTML = roomTypes.map(function(r, i) {
                var price = h.price_per_night * (i === 0 ? 1 : i === 1 ? 1.45 : 2.1);
                return '<div class="room-card">'
                    + '<div class="room-card-img"><img src="' + getPrimaryImage() + '" alt="' + r.name + '"></div>'
                    + '<div class="room-card-body">'
                        + '<h4>' + r.name + '</h4>'
                        + '<p class="room-desc">' + r.desc + '</p>'
                        + '<div class="room-features">'
                            + '<span>' + svgIcon('user') + ' Up to ' + r.guests + ' guests</span>'
                            + '<span>' + svgIcon('bed') + ' ' + r.beds + '</span>'
                            + '<span>' + svgIcon('ruler') + ' 28-35 m²</span>'
                            + '<span>' + svgIcon('wifi') + ' Free WiFi</span>'
                        + '</div>'
                        + '<div class="room-card-footer" style="margin-top:0.75rem;">'
                            + '<div class="room-price"><span class="price-amount" data-kes="' + price + '">' + window.formatPrice(price) + '</span> <small>/night</small></div>'
                            + '<div class="hotel-btn-row">'
                                + '<button class="hotel-book-btn" onclick="document.getElementById(\'sidebar-book-btn\').click()"><span>Book Now</span></button>'
                                + '<button class="hotel-book-btn-arrow" onclick="document.getElementById(\'sidebar-book-btn\').click()" aria-label="Book Now">'
                                    + '<img src="/assets/images/right-arrow.png" alt="" class="hotel-book-btn-arrow-img">'
                                + '</button>'
                            + '</div>'
                        + '</div>'
                    + '</div>'
                + '</div>';
            }).join('');
        }

        function renderReviews() {
            var h = currentHotel;
            var reviews = h.reviews || [];
            var rating = h.avg_rating || h.rating || 0;
            var count = h.reviews_count || reviews.length;
            var layout = document.getElementById('reviews-layout');

            var leftHtml = '<div class="reviews-left">'
                + '<div class="reviews-rating-display">'
                    + '<img src="/assets/images/rating-removebg-preview.png" alt="" class="reviews-leaf-img reviews-leaf-left">'
                    + '<div class="reviews-leaf-rating">' + rating.toFixed(1) + '</div>'
                    + '<img src="/assets/images/rating-removebg-preview.png" alt="" class="reviews-leaf-img reviews-leaf-right">'
                + '</div>'
                + '<div class="reviews-left-title">Guest Favourite</div>'
                + '<p class="reviews-left-desc">The best of the best. Our guests are raving about their stay at this property.</p>'
                + '<div class="star-distribution" id="star-distribution"></div>'
                + '<div class="reviews-qualities">'
                    + '<div class="review-quality"><div class="review-quality-val">' + rating.toFixed(1) + '</div><div class="review-quality-label">Cleanliness</div></div>'
                    + '<div class="review-quality"><div class="review-quality-val">' + rating.toFixed(1) + '</div><div class="review-quality-label">Accuracy</div></div>'
                + '</div>'
                + '</div>';

            var rightHtml = '<div class="reviews-right">'
                + '<div class="reviews-right-header">' + count + ' Reviews</div>'
                + '<div class="reviews-search-wrap"><input type="text" class="reviews-search" id="reviews-search-input" placeholder="Search reviews..."></div>'
                + '<div class="reviews-list" id="reviews-list">';

            if (reviews.length > 0) {
                reviews.forEach(function(r) {
                    var name = r.user_name || r.user?.name || 'Anonymous';
                    var initial = name.charAt(0).toUpperCase();
                    var colors = ['#122218', '#2a4a3a', '#8aa899', '#0d1f12', '#333'];
                    var colorIdx = Math.abs(name.charCodeAt(0) || 0) % colors.length;
                    var date = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                    var userRating = r.rating || 0;
                    var stars = svgIcon('star',{size:14}).repeat(Math.round(userRating)) + svgIcon('star-outline',{size:14}).repeat(5 - Math.round(userRating));
                    rightHtml += '<div class="review-card" data-comment="' + escapeHTML((r.comment || r.review || '').toLowerCase()) + '" data-name="' + escapeHTML(name.toLowerCase()) + '">'
                        + '<div class="review-card-header">'
                            + '<div class="review-card-user">'
                                + '<div class="review-card-avatar" style="background:' + colors[colorIdx] + ';color:white;">' + initial + '</div>'
                                + '<div><div class="review-card-name">' + escapeHTML(name) + '</div>'
                                + '<div class="review-card-date">' + date + '</div></div>'
                            + '</div>'
                            + '<div class="review-card-stars">' + stars + '</div>'
                        + '</div>'
                        + '<p class="review-card-comment">' + escapeHTML(r.comment || r.review || '') + '</p>'
                        + '</div>';
                });
            } else {
                rightHtml += '<p style="color:var(--text-secondary);text-align:center;padding:2rem 0;">No reviews yet. Be the first to review this hotel!</p>';
            }
            rightHtml += '</div></div>';

            layout.innerHTML = leftHtml + rightHtml;

            if (count > 0) renderStarDistribution();

            var searchInput = document.getElementById('reviews-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', function() {
                    var q = this.value.toLowerCase().trim();
                    var cards = document.querySelectorAll('#reviews-list .review-card');
                    cards.forEach(function(card) {
                        var match = !q || card.dataset.comment.indexOf(q) !== -1 || card.dataset.name.indexOf(q) !== -1;
                        card.style.display = match ? '' : 'none';
                    });
                });
            }
        }

        function renderStarDistribution() {
            var reviews = currentHotel.reviews || [];
            var dist = {5:0,4:0,3:0,2:0,1:0};
            reviews.forEach(function(r) {
                var s = Math.round(r.rating || 0);
                if (s >= 1 && s <= 5) dist[s]++;
            });
            var total = reviews.length || 1;
            var html = '';
            for (var i = 5; i >= 1; i--) {
                var pct = (dist[i] / total) * 100;
                html += '<div class="star-row"><span class="star-row-label">' + i + ' ' + svgIcon('star',{size:10,color:'#122218'}) + '</span>'
                    + '<div class="star-row-bar"><div class="star-row-fill" style="width:' + pct + '%"></div></div>'
                    + '<span class="star-row-count">' + dist[i] + '</span></div>';
            }
            var el = document.getElementById('star-distribution');
            if (el) el.innerHTML = html;
        }

        function renderReviewForm() {
            return '<div class="review-form-container">'
                + '<h3>Write a Review</h3>'
                + '<div class="star-rating" id="review-stars">'
                    + '<input type="radio" name="rating" id="star5" value="5"><label for="star5">' + svgIcon('star') + '</label>'
                    + '<input type="radio" name="rating" id="star4" value="4"><label for="star4">' + svgIcon('star') + '</label>'
                    + '<input type="radio" name="rating" id="star3" value="3"><label for="star3">' + svgIcon('star') + '</label>'
                    + '<input type="radio" name="rating" id="star2" value="2"><label for="star2">' + svgIcon('star') + '</label>'
                    + '<input type="radio" name="rating" id="star1" value="1"><label for="star1">' + svgIcon('star') + '</label>'
                + '</div>'
                + '<textarea class="form-input" id="review-comment" placeholder="Share your experience..." rows="4" style="width:100%;margin-bottom:0.75rem;"></textarea>'
                + '<button class="btn btn-primary" onclick="submitReview()">Submit Review</button>'
                + '</div>';
        }

        function renderReviewFormSection() {
            var el = document.getElementById('review-form-section');
            if (el) el.innerHTML = renderReviewForm();
        }

        window.submitReview = async function() {
            if (!api.token) {
                showToast('Please login to write a review', 'warning');
                openModal('login-modal');
                return;
            }
            var ratingEl = document.querySelector('#review-stars input:checked');
            if (!ratingEl) { showToast('Please select a rating', 'warning'); return; }
            var comment = document.getElementById('review-comment').value.trim();
            if (!comment) { showToast('Please write a review', 'warning'); return; }
            try {
                await api.createReview({ hotel_id: hotelId, rating: parseInt(ratingEl.value), comment: comment });
                showToast('Review submitted!', 'success');
                document.getElementById('review-comment').value = '';
                document.querySelectorAll('#review-stars input').forEach(function(i) { i.checked = false; });
                var result = await api.getHotel(hotelId);
                currentHotel = result.hotel || result;
                renderReviews();
                renderReviewFormSection();
            } catch (err) {
                showToast(err.message, 'error');
            }
        };

        function renderSidebar() {
            var h = currentHotel;
            document.getElementById('sidebar-price').innerHTML = '<span class="price-amount" data-kes="' + h.price_per_night + '">' + window.formatPrice(h.price_per_night) + '</span>';

            var badgesHtml = '';
            if ((h.avg_rating || h.rating || 0) >= 4.5) badgesHtml += '<span class="sidebar-badge sb-hot">Top Rated</span>';
            badgesHtml += '<span class="sidebar-badge sb-free">Free Cancel</span>';
            document.getElementById('sidebar-badges').innerHTML = badgesHtml;

            var available = document.getElementById('sidebar-available');
            if (h.available !== false) {
                available.textContent = 'Available';
                available.className = 'badge badge-success';
            } else {
                available.textContent = 'Unavailable';
                available.className = 'badge badge-error';
            }

            var today = new Date();
            var tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            var dayAfter = new Date(today);
            dayAfter.setDate(dayAfter.getDate() + 2);
            document.getElementById('sidebar-checkin').value = tomorrow.toISOString().split('T')[0];
            document.getElementById('sidebar-checkin').min = today.toISOString().split('T')[0];
            document.getElementById('sidebar-checkout').value = dayAfter.toISOString().split('T')[0];
            document.getElementById('sidebar-checkout').min = tomorrow.toISOString().split('T')[0];

            updateTotal();

            document.getElementById('sidebar-why-book').innerHTML = '<h4>Why book with us?</h4>'
                + '<ul>'
                + '<li>' + svgIcon('check',{size:14,color:'var(--primary)'}) + ' Best price guarantee</li>'
                + '<li>' + svgIcon('check',{size:14,color:'var(--primary)'}) + ' Free cancellation</li>'
                + '<li>' + svgIcon('check',{size:14,color:'var(--primary)'}) + ' Secure payments</li>'
                + '<li>' + svgIcon('check',{size:14,color:'var(--primary)'}) + ' 24/7 customer support</li>'
                + '</ul>';
        }

        function updateTotal() {
            var checkin = document.getElementById('sidebar-checkin')?.value;
            var checkout = document.getElementById('sidebar-checkout')?.value;
            if (checkin && checkout) {
                var diff = Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / (1000*60*60*24)));
                var total = currentHotel.price_per_night * diff;
                var totalEl = document.getElementById('sidebar-total');
                if (totalEl) totalEl.innerHTML = '<span class="price-amount" data-kes="' + total + '">' + window.formatPrice(total) + '</span>';
            }
        }

        function setupBooking() {
            document.getElementById('sidebar-checkin').addEventListener('change', updateTotal);
            document.getElementById('sidebar-checkout').addEventListener('change', updateTotal);

            document.getElementById('sidebar-book-btn').addEventListener('click', function() {
                if (!api.token) {
                    showToast('Please login to book', 'warning');
                    openModal('login-modal');
                    return;
                }
                var checkin = document.getElementById('sidebar-checkin').value;
                var checkout = document.getElementById('sidebar-checkout').value;
                var guests = document.getElementById('sidebar-guests').value;
                if (!checkin || !checkout) {
                    showToast('Please select check-in and check-out dates', 'warning');
                    return;
                }
                window.location.href = '/booking.html?hotel=' + hotelId + '&checkin=' + checkin + '&checkout=' + checkout + '&guests=' + guests;
            });
            document.getElementById('mobile-book-btn').addEventListener('click', function() {
                document.getElementById('sidebar-book-btn').click();
            });
        }

        function renderMobileBar() {
            var h = currentHotel;
            document.getElementById('mobile-bar-price').innerHTML = '<span class="price-amount" data-kes="' + h.price_per_night + '">' + window.formatPrice(h.price_per_night) + '</span>';
        }

        function renderRelated() {
            var container = document.getElementById('related-hotels');
            api.getHotels({ per_page: 5 }).then(function(result) {
                var hotels = (result.hotels || []).filter(function(h) { return h.id !== hotelId; }).slice(0, 4);
                if (!hotels.length) { container.innerHTML = ''; return; }
                container.innerHTML = hotels.map(function(h) {
                    var img = h.images && h.images.length > 0 ? (h.images.find(function(i) { return i.is_primary; }) || h.images[0]).image_url : '/assets/images/placeholder.svg';
                    var rating = h.avg_rating || h.rating || 0;
                    return '<a href="/hotel-detail.html?id=' + h.id + '" class="related-card" style="text-decoration:none;color:inherit;">'
                        + '<img src="' + img + '" alt="' + escapeHTML(h.name) + '" loading="lazy" onerror="this.src=\'/assets/images/placeholder.svg\'">'
                        + '<div class="related-card-body">'
                            + '<h4>' + escapeHTML(h.name) + '</h4>'
                            + '<div class="related-location">' + svgIcon('map-pin',{size:14}) + ' ' + escapeHTML(h.location || 'Kenya') + '</div>'
                            + '<div class="related-meta">'
                                + '<span class="related-price"><span class="price-amount" data-kes="' + h.price_per_night + '">' + window.formatPrice(h.price_per_night) + '</span> <small style="font-weight:400;font-size:0.7rem;color:var(--text-secondary);">/night</small></span>'
                                + (rating > 0 ? '<span class="related-rating">' + svgIcon('star',{size:14,color:'var(--accent)'}) + ' ' + rating.toFixed(1) + '</span>' : '')
                            + '</div>'
                        + '</div>'
                    + '</a>';
                }).join('');
            }).catch(function() { container.innerHTML = ''; });
        }

        function openLightbox(index) {
            if (!lightboxImages.length) return;
            lightboxIndex = index;
            document.getElementById('lightbox-img').src = lightboxImages[index].image_url;
            document.getElementById('lightbox-counter').textContent = (index + 1) + ' / ' + lightboxImages.length;
            document.getElementById('lightbox').classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        function closeLightbox() {
            document.getElementById('lightbox').classList.remove('active');
            document.body.style.overflow = '';
        }
        function prevLightbox() {
            lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
            openLightbox(lightboxIndex);
        }
        function nextLightbox() {
            lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
            openLightbox(lightboxIndex);
        }
        document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
        document.getElementById('lightbox-prev').addEventListener('click', prevLightbox);
        document.getElementById('lightbox-next').addEventListener('click', nextLightbox);
        document.getElementById('lightbox').addEventListener('click', function(e) { if (e.target === this) closeLightbox(); });
        document.addEventListener('keydown', function(e) {
            if (!document.getElementById('lightbox').classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') prevLightbox();
            if (e.key === 'ArrowRight') nextLightbox();
        });

        function escapeHTML(value) {
            if (value === null || value === undefined) return '';
            return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/\//g, '&#x2F;');
        }

        init();