        const tourId = new URLSearchParams(window.location.search).get('id');
        let currentTour = null;
        currentUser = null;
        let lightboxImages = [];
        let lightboxIndex = 0;
        let mapInstance = null;

        async function init() {
            if (!tourId) {
                document.getElementById('tour-loader').style.display = 'none';
                document.getElementById('tour-error').style.display = 'block';
                return;
            }

            try {
                const result = await api.getTour(tourId);
                currentTour = result.tour || result;

                if (api.token) {
                    try {
                        const profile = await api.getProfile();
                        currentUser = profile.user;
                    } catch (e) {
                        // not logged in
                    }
                }

                document.getElementById('tour-loader').style.display = 'none';
                document.getElementById('tour-content').style.display = 'block';

                renderAll();
            } catch (err) {
                document.getElementById('tour-loader').style.display = 'none';
                document.getElementById('tour-error').style.display = 'block';
                document.querySelector('#tour-error p').textContent = err.message || 'Failed to load tour details.';
            }
        }

        function renderAll() {
            renderHero();
            renderGallery();
            renderWhyLoved();
            renderOverview();
            renderInclusions();
            renderMeetingPoint();
            renderItinerary();
            renderAdditionalInfo();
            renderCancellationPolicy();
            renderReviews();
            renderReviewFormSection();
            renderMap();
            renderCompareTable();
            renderRelated();
            renderBooking();
            setupListeners();
        }

        function renderHero() {
            const tour = currentTour;
            const primary = getPrimaryImage();
            const heroEl = document.getElementById('tour-hero');
            if (primary) {
                heroEl.style.backgroundImage = `url(${primary.image_url})`;
            }

            document.getElementById('tour-title').textContent = tour.title;

            document.getElementById('breadcrumb').innerHTML = `
                <a href="/">Home</a> <span>&rsaquo;</span>
                <a href="/tours.html">Tours</a> <span>&rsaquo;</span>
                <a href="/tours.html?location=${encodeURIComponent(tour.location || '')}">${escapeHTML(tour.location || 'Kenya')}</a> <span>&rsaquo;</span>
                <span style="color:#fff;">${escapeHTML(tour.title)}</span>
            `;

            const rating = tour.average_rating || 0;
            const reviewCount = tour.reviews ? tour.reviews.length : 0;
            if (rating) {
                const fullStars = Math.round(rating);
                const starsHtml = '<i class="fas fa-star"></i>'.repeat(fullStars) + '<i class="far fa-star"></i>'.repeat(5 - fullStars);
                document.getElementById('tour-rating-line').innerHTML = `
                    <span class="rating-stars">${starsHtml}</span>
                    <span class="rating-score">${rating.toFixed(1)}</span>
                    <span class="rating-recs"><strong>${reviewCount}</strong> review${reviewCount !== 1 ? 's' : ''} &middot; Recommended by <strong>${Math.min(91 + Math.floor(Math.random() * 8), 99)}%</strong> of travelers</span>
                `;
            } else {
                document.getElementById('tour-rating-line').innerHTML = '';
            }

            const durationStr = tour.duration_days ? tour.duration_days + (tour.duration_days === 1 ? ' day' : ' days') : '';
            document.getElementById('tour-hero-quick-info').innerHTML = `
                ${tour.location ? `<span>${escapeHTML(tour.location)}</span>` : ''}
                ${durationStr ? `<span>${durationStr}</span>` : ''}
            `;

            var badgesHtml = '';
            if (rating >= 4.5) badgesHtml += '<span class="tour-hero-badge accent">Top Rated</span>';
            badgesHtml += '<span class="tour-hero-badge">Available</span>';
            badgesHtml += '<span class="tour-hero-badge">Free Cancellation</span>';
            document.getElementById('tour-hero-badges').innerHTML = badgesHtml;
        }

        function getPrimaryImage() {
            const tour = currentTour;
            if (tour.images && tour.images.length > 0) {
                return tour.images.find(i => i.is_primary) || tour.images[0];
            }
            return null;
        }

        function getAllImages() {
            const tour = currentTour;
            return tour.images && tour.images.length > 0 ? tour.images : [];
        }

        function renderGallery() {
            const images = getAllImages();
            if (images.length === 0) {
                document.getElementById('tour-gallery-section').style.display = 'none';
                return;
            }

            lightboxImages = images;
            const grid = document.getElementById('tour-gallery-grid');

            const primary = images[0];
            const rest = images.slice(1, 5);

            let thumbsHtml = '';
            if (rest.length > 0) {
                thumbsHtml = '<div class="tour-gallery-thumbs">';
                rest.forEach((img, i) => {
                    thumbsHtml += `<div onclick="openLightbox(${i + 1})">
                        <img src="${img.image_url}" alt="" loading="lazy" onerror="this.parentElement.style.display='none'">
                        ${i === rest.length - 1 && images.length > 5 ? `<div class="tour-gallery-more-overlay">+${images.length - 5}</div>` : ''}
                    </div>`;
                });
                thumbsHtml += '</div>';
            }

            grid.innerHTML = `
                <div class="tour-gallery-main" onclick="openLightbox(0)">
                    <img src="${primary.image_url}" alt="" onerror="this.src='/assets/images/placeholder.svg'">
                </div>
                ${thumbsHtml}
            `;
        }

        function renderOverview() {
            const tour = currentTour;
            document.getElementById('tour-description').textContent = tour.description || 'No description available.';

            document.getElementById('tour-info-cards').innerHTML = `
                <div class="tour-info-card">
                    <div class="tour-info-icon"><i class="far fa-clock"></i></div>
                    <h4>Duration</h4>
                    <p>${escapeHTML(tour.duration_days || 0)} days</p>
                </div>
                <div class="tour-info-card">
                    <div class="tour-info-icon"><i class="fas fa-users"></i></div>
                    <h4>Max People</h4>
                    <p>${escapeHTML(tour.max_people || 'N/A')}</p>
                </div>
                <div class="tour-info-card">
                    <div class="tour-info-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <h4>Location</h4>
                    <p>${escapeHTML(tour.location || 'Kenya')}</p>
                </div>
                <div class="tour-info-card">
                    <div class="tour-info-icon"><i class="fas fa-tag"></i></div>
                    <h4>Activity Type</h4>
                    <p>${escapeHTML(tour.activity_type || tour.category || 'Safari')}</p>
                </div>
            `;
        }

        function renderWhyLoved() {
            const container = document.getElementById('why-loved');
            const tags = [
                { icon: 'fa-star', text: 'Amazing sights' },
                { icon: 'fa-city', text: 'City highlights' },
                { icon: 'fa-map-pin', text: 'Points of interest' },
                { icon: 'fa-users', text: 'Great guides' }
            ];
            container.innerHTML = tags.map(t =>
                `<span class="why-loved-tag"><i class="fas ${t.icon}"></i> ${t.text}</span>`
            ).join('');
        }

        function renderMeetingPoint() {
            const tour = currentTour;
            const container = document.getElementById('meeting-point');
            container.innerHTML = `
                <div class="mp-item">
                    <div class="mp-icon"><i class="fas fa-map-marker-alt"></i></div>
                    <div>
                        <div class="mp-label">Meeting point</div>
                        <div class="mp-value">${escapeHTML(tour.location || 'Nairobi, Kenya')}</div>
                    </div>
                </div>
                <div class="mp-item">
                    <div class="mp-icon"><i class="fas fa-flag-checkered"></i></div>
                    <div>
                        <div class="mp-label">End point</div>
                        <div class="mp-value">${escapeHTML(tour.location || 'Nairobi, Kenya')}</div>
                    </div>
                </div>
                <div class="mp-item">
                    <div class="mp-icon"><i class="fas fa-clock"></i></div>
                    <div>
                        <div class="mp-label">Start time</div>
                        <div class="mp-value">8:00 AM (recommended to arrive 10 minutes before)</div>
                    </div>
                </div>
            `;
        }

        function renderAdditionalInfo() {
            const container = document.getElementById('additional-info');
            const infoItems = [
                'Confirmation will be received at time of booking',
                'Wheelchair accessible',
                'Stroller accessible',
                'Service animals allowed',
                'Near public transportation',
                'Most travelers can participate',
                'Normal backpacks and handbags are permitted',
                'Free time inside after the guided tour'
            ];
            container.innerHTML = `
                <h3>What to know before you go</h3>
                <ul>
                    ${infoItems.map(item => `<li><i class="fas fa-check"></i> ${item}</li>`).join('')}
                </ul>
            `;
        }

        function renderCancellationPolicy() {
            const container = document.getElementById('cancellation-policy');
            container.innerHTML = `
                <h3><i class="fas fa-undo-alt" style="color:var(--accent);"></i> Free Cancellation</h3>
                <p>You can cancel up to 24 hours in advance of the experience for a full refund. For a full refund, you must cancel at least 24 hours before the experience's start time. If you cancel less than 24 hours before the experience's start time, the amount you paid will not be refunded. Changes made less than 24 hours before the experience's start time will not be accepted.</p>
            `;
        }

        function renderCompareTable() {
            const tour = currentTour;
            const container = document.getElementById('compare-table');
            const similarTours = [
                { name: tour.title, rating: tour.average_rating || 4.7, reviews: (tour.reviews || []).length || 3545, duration: tour.duration_days + (tour.duration_days === 1 ? ' day' : ' days'), price: Number(tour.price), badge: 'Current', highlight: true },
                { name: tour.title + ' - Premium', rating: (tour.average_rating || 4.7) + 0.2, reviews: Math.floor(((tour.reviews || []).length || 3545) * 0.5), duration: (tour.duration_days || 1) + 1 + ' days', price: Number(tour.price) * 1.4, badge: 'Likely to Sell Out' },
                { name: tour.title + ' - Express', rating: Math.max((tour.average_rating || 4.7) - 0.1, 0), reviews: Math.floor(((tour.reviews || []).length || 3545) * 0.3), duration: (tour.duration_days || 1) + ' day', price: Number(tour.price) * 0.85 },
                { name: 'Private ' + tour.title, rating: (tour.average_rating || 4.7) + 0.1, reviews: Math.floor(((tour.reviews || []).length || 3545) * 0.15), duration: (tour.duration_days || 1) + 2 + ' days', price: Number(tour.price) * 2, badge: 'Likely to Sell Out' },
                { name: tour.title + ' Small Group', rating: (tour.average_rating || 4.7) + 0.15, reviews: Math.floor(((tour.reviews || []).length || 3545) * 0.25), duration: (tour.duration_days || 1) + 1 + ' days', price: Number(tour.price) * 1.2 }
            ];
            const formatPrice = (p) => 'KSh ' + Number(p).toLocaleString();
            container.innerHTML = `
                <table class="compare-table">
                    <thead>
                        <tr>
                            <th>Experience</th>
                            <th>Rating</th>
                            <th>Duration</th>
                            <th>Price</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${similarTours.map(t => `
                            <tr class="${t.highlight ? 'cmp-highlight' : ''}">
                                <td>
                                    <strong>${escapeHTML(t.name)}</strong>
                                    ${t.badge ? `<br><span class="cmp-badge">${t.badge}</span>` : ''}
                                </td>
                                <td><span class="cmp-rating"><i class="fas fa-star" style="color:var(--accent);"></i> ${t.rating.toFixed(1)}</span> <span style="color:var(--text-secondary);font-size:0.75rem;">(${t.reviews})</span></td>
                                <td style="color:var(--text-secondary);">${t.duration}</td>
                                <td class="cmp-price">${formatPrice(t.price)}</td>
                                <td><button class="btn btn-primary btn-sm cmp-btn" onclick="window.location.href='/booking.html?tour=${tour.id}'">View</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        function renderItinerary() {
            const tour = currentTour;
            const container = document.getElementById('itinerary-list');

            if (!tour.itinerary) {
                document.getElementById('tour-itinerary-section').style.display = 'none';
                return;
            }

            const dayRegex = /Day\s+(\d+)\s*[:.-]?\s*/gi;
            const parts = tour.itinerary.split(dayRegex);

            if (parts.length < 3) {
                container.innerHTML = `<p style="color:var(--text-secondary);">${escapeHTML(tour.itinerary)}</p>`;
                return;
            }

            let html = '';
            for (let i = 1; i < parts.length; i += 2) {
                const dayNum = parts[i];
                const dayContent = parts[i + 1] ? parts[i + 1].trim() : '';
                if (!dayContent) continue;

                html += `
                    <div class="itinerary-day">
                        <div class="itinerary-day-header" onclick="toggleItinerary(this)">
                            <span class="day-label">Day ${escapeHTML(dayNum)}</span>
                            <span class="day-arrow"><i class="fas fa-chevron-down"></i></span>
                        </div>
                        <div class="itinerary-day-content">
                            <p>${escapeHTML(dayContent)}</p>
                        </div>
                    </div>
                `;
            }

            if (!html) {
                container.innerHTML = `<p style="color:var(--text-secondary);">${tour.itinerary}</p>`;
                return;
            }

            container.innerHTML = html;
        }

        function toggleItinerary(header) {
            const day = header.parentElement;
            day.classList.toggle('open');
        }

        function renderInclusions() {
            const tour = currentTour;
            const container = document.getElementById('inclusions-grid');

            const included = tour.included ? tour.included.split('\n').filter(s => s.trim()) : [];
            const excluded = tour.excluded ? tour.excluded.split('\n').filter(s => s.trim()) : [];

            if (included.length === 0 && excluded.length === 0) {
                document.getElementById('tour-inclusions-section').style.display = 'none';
                return;
            }

            let html = '';
            if (included.length > 0) {
                html += `
                    <div class="inclusions-col">
                        <h3 class="included-title"><i class="fas fa-check" style="color:var(--primary);"></i> Included</h3>
                        <ul>
                            ${included.map(item => `<li><span class="icon-check"><i class="fas fa-check" style="color:var(--primary);"></i></span> ${escapeHTML(item)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            if (excluded.length > 0) {
                html += `
                    <div class="inclusions-col">
                        <h3 class="excluded-title"><i class="fas fa-times" style="color:var(--error);"></i> Excluded</h3>
                        <ul>
                            ${excluded.map(item => `<li><span class="icon-cross"><i class="fas fa-times" style="color:var(--error);"></i></span> ${escapeHTML(item)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            container.innerHTML = html;
        }

        function renderReviews() {
            const tour = currentTour;
            const reviews = tour.reviews || [];
            const layout = document.getElementById('reviews-layout');

            let avgRating = 0;
            if (reviews.length > 0) {
                avgRating = tour.average_rating || (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length);
            }
            const count = reviews.length;

            const leftHtml = '<div class="reviews-left">'
                + '<div class="reviews-rating-display">'
                    + '<img src="/assets/images/rating-removebg-preview.png" alt="" class="reviews-leaf-img reviews-leaf-left">'
                    + '<div class="reviews-leaf-rating">' + avgRating.toFixed(1) + '</div>'
                    + '<img src="/assets/images/rating-removebg-preview.png" alt="" class="reviews-leaf-img reviews-leaf-right">'
                + '</div>'
                + '<div class="reviews-left-title">Guest Favourite</div>'
                + '<p class="reviews-left-desc">The best of the best. Our guests are raving about this tour experience.</p>'
                + '<div class="star-distribution" id="star-distribution"></div>'
                + '<div class="reviews-qualities">'
                    + '<div class="review-quality"><div class="review-quality-val">' + avgRating.toFixed(1) + '</div><div class="review-quality-label">Cleanliness</div></div>'
                    + '<div class="review-quality"><div class="review-quality-val">' + avgRating.toFixed(1) + '</div><div class="review-quality-label">Accuracy</div></div>'
                + '</div>'
                + '</div>';

            let rightHtml = '<div class="reviews-right">'
                + '<div class="reviews-right-header">' + count + ' Reviews</div>'
                + '<div class="reviews-search-wrap"><input type="text" class="reviews-search" id="reviews-search-input" placeholder="Search reviews..."></div>'
                + '<div class="reviews-list" id="reviews-list">';

            if (reviews.length > 0) {
                reviews.forEach(function(review, idx) {
                    const name = review.user_name || review.user?.name || 'Anonymous';
                    const initials = name.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
                    const colors = ['#122218', '#2a4a3a', '#8aa899', '#0d1f12', '#333'];
                    const colorIdx = Math.abs(name.charCodeAt(0) || 0) % colors.length;
                    const date = review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                    const stars = '<i class="fas fa-star"></i>'.repeat(review.rating || 0) + '<i class="far fa-star"></i>'.repeat(5 - (review.rating || 0));
                    rightHtml += '<div class="review-card" data-comment="' + escapeHTML((review.comment || review.review || '').toLowerCase()) + '" data-name="' + escapeHTML(name.toLowerCase()) + '">'
                        + '<div class="review-card-header">'
                            + '<div class="review-card-user">'
                                + '<div class="review-card-avatar" style="background:' + colors[colorIdx] + ';color:white;">' + escapeHTML(initials) + '</div>'
                                + '<div><div class="review-card-name">' + escapeHTML(name) + '</div>'
                                + '<div class="review-card-date">' + escapeHTML(date) + '</div></div>'
                            + '</div>'
                            + '<div class="review-card-stars">' + stars + '</div>'
                        + '</div>'
                        + '<div class="review-card-comment">' + escapeHTML(review.comment || review.review || '') + '</div>'
                        + '</div>';
                });
            } else {
                rightHtml += '<p style="color:var(--text-secondary);text-align:center;padding:2rem 0;">No reviews yet. Be the first to review this tour!</p>';
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
            const reviews = currentTour.reviews || [];
            const starCounts = {5:0,4:0,3:0,2:0,1:0};
            reviews.forEach(function(r) { const rt = Math.round(r.rating || 0); if (rt >= 1 && rt <= 5) starCounts[rt]++; });
            const total = reviews.length || 1;
            var html = '';
            for (var i = 5; i >= 1; i--) {
                var pct = (starCounts[i] / total) * 100;
                html += '<div class="star-row"><span class="star-row-label">' + i + ' <i class="fas fa-star" style="font-size:0.6rem;color:var(--accent);"></i></span>'
                    + '<div class="star-row-bar"><div class="star-row-fill" style="width:' + pct + '%"></div></div>'
                    + '<span class="star-row-count">' + starCounts[i] + '</span></div>';
            }
            var el = document.getElementById('star-distribution');
            if (el) el.innerHTML = html;
        }

        function renderReviewForm() {
            if (!currentUser) return '';
            return '<div class="review-form-container">'
                + '<h3>Write a Review</h3>'
                + '<form id="review-form">'
                    + '<div class="star-rating" id="star-rating">'
                        + '<input type="radio" name="rating" id="star5" value="5"><label for="star5" title="5 stars"><i class="fas fa-star"></i></label>'
                        + '<input type="radio" name="rating" id="star4" value="4"><label for="star4" title="4 stars"><i class="fas fa-star"></i></label>'
                        + '<input type="radio" name="rating" id="star3" value="3"><label for="star3" title="3 stars"><i class="fas fa-star"></i></label>'
                        + '<input type="radio" name="rating" id="star2" value="2"><label for="star2" title="2 stars"><i class="fas fa-star"></i></label>'
                        + '<input type="radio" name="rating" id="star1" value="1"><label for="star1" title="1 star"><i class="fas fa-star"></i></label>'
                    + '</div>'
                    + '<div class="form-group">'
                        + '<textarea class="form-textarea" id="review-comment" placeholder="Share your experience..." required></textarea>'
                    + '</div>'
                    + '<button type="submit" class="btn btn-primary">Submit Review</button>'
                + '</form>'
                + '</div>';
        }

        function renderReviewFormSection() {
            var el = document.getElementById('review-form-section');
            if (el) el.innerHTML = renderReviewForm();
        }

        function renderMap() {
            const tour = currentTour;

            if (tour.latitude == null || tour.longitude == null) {
                return;
            }

            const mapSection = document.getElementById('tour-map-section');
            mapSection.classList.add('visible');

            setTimeout(() => {
                if (mapInstance) {
                    mapInstance.remove();
                }

                mapInstance = L.map('map').setView([tour.latitude, tour.longitude], 10);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 18
                }).addTo(mapInstance);

                L.marker([tour.latitude, tour.longitude])
                    .addTo(mapInstance)
                    .bindPopup(`<b>${tour.title}</b>`)
                    .openPopup();
            }, 200);
        }

        async function renderRelated() {
            const container = document.getElementById('related-tours');

            try {
                const result = await api.get(`/tours/${tourId}/related`);
                const tours = result.tours || result;

                if (!tours || tours.length === 0) {
                    container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;">No related tours found.</p>';
                    return;
                }

                container.innerHTML = tours.slice(0, 4).map(t => {
                    const img = t.images && t.images.length > 0
                        ? (t.images.find(i => i.is_primary) || t.images[0])
                        : null;
                    const imgUrl = img ? img.image_url : '/assets/images/placeholder.svg';

                    return `
                        <div class="related-card" onclick="window.location.href='/tour-detail.html?id=${t.id}'">
                            <img src="${imgUrl}" alt="${t.title}" loading="lazy" onerror="this.src='/assets/images/placeholder.svg'">
                            <div class="related-card-body">
                                <h4>${t.title}</h4>
                                <div class="related-location"><i class="fas fa-map-marker-alt"></i> ${t.location || 'Kenya'}</div>
                                <div class="related-meta">
                                    <span class="related-price">KSh ${Number(t.price).toLocaleString()}</span>
                                    <span class="related-duration">${t.duration_days || 0} days</span>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            } catch (err) {
                container.innerHTML = '<p style="color:var(--text-secondary);text-align:center;">Could not load related tours.</p>';
            }
        }

        function renderBooking() {
            const tour = currentTour;
            const price = Number(tour.price);

            document.getElementById('sidebar-price').textContent = `KSh ${price.toLocaleString()}`;
            document.getElementById('mobile-bar-price').textContent = `KSh ${price.toLocaleString()}`;

            document.getElementById('sidebar-badges').innerHTML = `
                <span class="sidebar-badge sb-hot"><i class="fas fa-fire"></i> Likely to Sell Out</span>
                <span class="sidebar-badge sb-best"><i class="fas fa-trophy"></i> Best in ${escapeHTML(tour.location || 'Kenya')}</span>
                <span class="sidebar-badge sb-deal"><i class="fas fa-tag"></i> Exceptional deal</span>
            `;

            document.getElementById('sidebar-why-book').innerHTML = `
                <h4>Why book with us?</h4>
                <ul>
                    <li><i class="fas fa-check-circle"></i> Lowest Price Guarantee</li>
                    <li><i class="fas fa-check-circle"></i> Free cancellation up to 24 hours</li>
                    <li><i class="fas fa-check-circle"></i> Reserve Now & Pay Later</li>
                    <li><i class="fas fa-check-circle"></i> Secure payments</li>
                </ul>
            `;

            document.getElementById('sidebar-book-advance').textContent = `Book ahead! On average, this is booked ${Math.floor(Math.random() * 20 + 20)} days in advance.`;

            const availableEl = document.getElementById('sidebar-available');
            if (tour.available === false) {
                availableEl.className = 'badge badge-danger';
                availableEl.textContent = 'Sold Out';
                document.getElementById('sidebar-book-btn').disabled = true;
                document.getElementById('sidebar-book-btn').textContent = 'Sold Out';
                document.getElementById('mobile-book-btn').disabled = true;
                document.getElementById('mobile-book-btn').textContent = 'Sold Out';
            } else {
                availableEl.className = 'badge badge-success';
                availableEl.textContent = 'Available';
            }

            updateTotal();

            document.getElementById('sidebar-people').addEventListener('input', updateTotal);
            document.getElementById('sidebar-date').valueAsDate = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            document.getElementById('sidebar-date').min = tomorrow.toISOString().split('T')[0];
        }

        function updateTotal() {
            const tour = currentTour;
            const people = parseInt(document.getElementById('sidebar-people').value) || 1;
            const total = Number(tour.price) * people;
            document.getElementById('sidebar-total').textContent = `KSh ${total.toLocaleString()}`;
        }

        function setupListeners() {
            document.getElementById('sidebar-book-btn').addEventListener('click', bookNow);
            document.getElementById('mobile-book-btn').addEventListener('click', bookNow);
        }

        function bookNow() {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Please login to book a tour', 'warning');
                openModal('login-modal');
                return;
            }

            const date = document.getElementById('sidebar-date').value;
            const people = document.getElementById('sidebar-people').value;
            window.location.href = `/booking.html?tour=${tourId}&date=${date}&people=${people}`;
        }

        function openLightbox(index) {
            if (lightboxImages.length === 0) return;
            lightboxIndex = index;
            updateLightbox();
            document.getElementById('lightbox').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            document.getElementById('lightbox').classList.remove('active');
            document.body.style.overflow = '';
        }

        function prevLightbox() {
            lightboxIndex = (lightboxIndex - 1 + lightboxImages.length) % lightboxImages.length;
            updateLightbox();
        }

        function nextLightbox() {
            lightboxIndex = (lightboxIndex + 1) % lightboxImages.length;
            updateLightbox();
        }

        function updateLightbox() {
            const img = document.getElementById('lightbox-img');
            img.src = lightboxImages[lightboxIndex].image_url;
            img.onerror = function() { this.src = '/assets/images/placeholder.svg'; };
            document.getElementById('lightbox-counter').textContent = `${lightboxIndex + 1} / ${lightboxImages.length}`;
        }

        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('lightbox-close').addEventListener('click', closeLightbox);
            document.getElementById('lightbox-prev').addEventListener('click', prevLightbox);
            document.getElementById('lightbox-next').addEventListener('click', nextLightbox);

            document.getElementById('lightbox').addEventListener('click', (e) => {
                if (e.target === e.currentTarget) closeLightbox();
            });

            document.addEventListener('keydown', (e) => {
                if (!document.getElementById('lightbox').classList.contains('active')) return;
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') prevLightbox();
                if (e.key === 'ArrowRight') nextLightbox();
            });
        });

        document.addEventListener('submit', async (e) => {
            if (e.target.id === 'review-form') {
                e.preventDefault();
                const rating = document.querySelector('input[name="rating"]:checked');
                const comment = document.getElementById('review-comment').value;

                if (!rating) {
                    showToast('Please select a rating', 'warning');
                    return;
                }

                const btn = e.target.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Submitting...';

                try {
                    await api.post(`/tours/${tourId}/reviews`, {
                        rating: parseInt(rating.value),
                        comment: comment
                    });
                    showToast('Review submitted!', 'success');
                    e.target.reset();
                    const result = await api.getTour(tourId);
                    currentTour = result.tour || result;
                    renderReviews();
                } catch (err) {
                    showToast(err.message || 'Failed to submit review', 'error');
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Submit Review';
                }
            }
        });

        init();