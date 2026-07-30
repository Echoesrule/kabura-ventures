        let tourId = new URLSearchParams(window.location.search).get('id');
        if (!tourId) {
            const path = window.location.pathname.replace(/\/$/, '');
            tourId = path.split('/').pop();
            if (tourId === 'tour-detail' || tourId === '') tourId = null;
        }
        let currentTour = null;
        currentUser = null;
        let lightboxImages = [];
        let lightboxIndex = 0;
        let mapInstance = null;
        let reviewsData = { reviews: [], total: 0, page: 1, pages: 1 };
        let reviewsLoading = false;

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
            renderWildlife();
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
                <a href="/tours">Tours</a> <span>&rsaquo;</span>
                <a href="/tours?location=${encodeURIComponent(tour.location || '')}">${escapeHTML(tour.location || 'Kenya')}</a> <span>&rsaquo;</span>
                <span style="color:#fff;">${escapeHTML(tour.title)}</span>
            `;

            const rating = tour.average_rating || 0;
            const reviewCount = tour.reviews_count || 0;
            if (rating) {
                const fullStars = Math.round(rating);
                const starsHtml = svgIcon('star',{size:14}).repeat(fullStars) + svgIcon('star-outline',{size:14}).repeat(5 - fullStars);
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
                    <div class="tour-info-icon">${svgIcon('clock')}</div>
                    <h4>Duration</h4>
                    <p>${escapeHTML(tour.duration_days || 0)} days</p>
                </div>
                <div class="tour-info-card">
                    <div class="tour-info-icon">${svgIcon('users')}</div>
                    <h4>Max People</h4>
                    <p>${escapeHTML(tour.max_people || 'N/A')}</p>
                </div>
                <div class="tour-info-card">
                    <div class="tour-info-icon">${svgIcon('map-pin')}</div>
                    <h4>Location</h4>
                    <p>${escapeHTML(tour.location || 'Kenya')}</p>
                </div>
                <div class="tour-info-card">
                    <div class="tour-info-icon">${svgIcon('tag')}</div>
                    <h4>Activity Type</h4>
                    <p>${escapeHTML(tour.activity_type || tour.category || 'Safari')}</p>
                </div>
            `;
        }

        function renderWildlife() {
            const tour = currentTour;
            const container = document.getElementById('tour-wildlife-grid');
            if (!tour.wildlife) {
                document.getElementById('tour-wildlife-section').style.display = 'none';
                return;
            }
            const animals = tour.wildlife.split(',').map(a => a.trim()).filter(Boolean);
            if (animals.length === 0) {
                document.getElementById('tour-wildlife-section').style.display = 'none';
                return;
            }
            container.innerHTML = animals.map(animal =>
                `<div class="wildlife-chip">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg>
                    <span>${escapeHTML(animal)}</span>
                </div>`
            ).join('');
        }

        function renderWhyLoved() {
            const container = document.getElementById('why-loved');
            const tags = [
                { icon: 'star', text: 'Amazing sights' },
                { icon: 'city', text: 'City highlights' },
                { icon: 'map-pin', text: 'Points of interest' },
                { icon: 'users', text: 'Great guides' }
            ];
            container.innerHTML = tags.map(t =>
                `<span class="why-loved-tag">${svgIcon(t.icon, {size:14})} ${t.text}</span>`
            ).join('');
        }

        function renderMeetingPoint() {
            const tour = currentTour;
            const container = document.getElementById('meeting-point');
            const hasMeetingPoint = tour.meeting_point_name || tour.meeting_address;
            const meetingPointName = tour.meeting_point_name || tour.location || 'Nairobi, Kenya';
            const meetingAddress = tour.meeting_address || '';
            const destinationName = tour.location_name || tour.location || 'Nairobi, Kenya';
            container.innerHTML = `
                <div class="mp-item">
                    <div class="mp-icon">${svgIcon('map-pin')}</div>
                    <div>
                        <div class="mp-label">Meeting point</div>
                        <div class="mp-value">${escapeHTML(meetingPointName)}</div>
                        ${meetingAddress ? `<div class="mp-value" style="font-size:0.8rem;color:var(--text-secondary);">${escapeHTML(meetingAddress)}</div>` : ''}
                        ${hasMeetingPoint && tour.meeting_latitude ? `<div class="mp-value" style="margin-top:0.4rem;"><a href="https://www.google.com/maps/dir/?api=1&destination=${tour.meeting_latitude},${tour.meeting_longitude}" target="_blank" rel="noopener">${svgIcon('navigation')} Get directions</a></div>` : ''}
                    </div>
                </div>
                <div class="mp-item">
                    <div class="mp-icon">${svgIcon('flag-checkered')}</div>
                    <div>
                        <div class="mp-label">End point</div>
                        <div class="mp-value">${escapeHTML(destinationName)}</div>
                        ${tour.formatted_address ? `<div class="mp-value" style="font-size:0.8rem;color:var(--text-secondary);">${escapeHTML(tour.formatted_address)}</div>` : ''}
                    </div>
                </div>
                <div class="mp-item">
                    <div class="mp-icon">${svgIcon('clock')}</div>
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
                    ${infoItems.map(item => `<li>${svgIcon('check',{size:14,color:'var(--primary)'})} ${item}</li>`).join('')}
                </ul>
            `;
        }

        function renderCancellationPolicy() {
            const container = document.getElementById('cancellation-policy');
            container.innerHTML = `
                <h3>${svgIcon('undo',{color:'var(--accent)'})} Free Cancellation</h3>
                <p>You can cancel up to 24 hours in advance of the experience for a full refund. For a full refund, you must cancel at least 24 hours before the experience's start time. If you cancel less than 24 hours before the experience's start time, the amount you paid will not be refunded. Changes made less than 24 hours before the experience's start time will not be accepted.</p>
            `;
        }

        function renderCompareTable() {
            const tour = currentTour;
            const container = document.getElementById('compare-table');
            const similarTours = [
                { name: tour.title, rating: tour.average_rating || 4.7, reviews: (tour.reviews_count || 3545), duration: tour.duration_days + (tour.duration_days === 1 ? ' day' : ' days'), price: Number(tour.price), badge: 'Current', highlight: true },
                { name: tour.title + ' - Premium', rating: (tour.average_rating || 4.7) + 0.2, reviews: Math.floor((tour.reviews_count || 3545) * 0.5), duration: (tour.duration_days || 1) + 1 + ' days', price: Number(tour.price) * 1.4, badge: 'Likely to Sell Out' },
                { name: tour.title + ' - Express', rating: Math.max((tour.average_rating || 4.7) - 0.1, 0), reviews: Math.floor((tour.reviews_count || 3545) * 0.3), duration: (tour.duration_days || 1) + ' day', price: Number(tour.price) * 0.85 },
                { name: 'Private ' + tour.title, rating: (tour.average_rating || 4.7) + 0.1, reviews: Math.floor((tour.reviews_count || 3545) * 0.15), duration: (tour.duration_days || 1) + 2 + ' days', price: Number(tour.price) * 2, badge: 'Likely to Sell Out' },
                { name: tour.title + ' Small Group', rating: (tour.average_rating || 4.7) + 0.15, reviews: Math.floor((tour.reviews_count || 3545) * 0.25), duration: (tour.duration_days || 1) + 1 + ' days', price: Number(tour.price) * 1.2 }
            ];
            const formatPrice = (p) => window.priceHTML(p);
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
                            <tr class="${t.highlight ? 'cmp-highlight' : ''}${t.badge === 'Likely to Sell Out' ? ' cmp-sellout' : ''}">
                                <td>
                                    <strong>${escapeHTML(t.name)}</strong>
                                    ${t.badge ? `<br><span class="cmp-badge${t.badge === 'Likely to Sell Out' ? ' cmp-badge--sellout' : ''}">${t.badge}</span>` : ''}
                                </td>
                                <td><span class="cmp-rating">${svgIcon('star',{size:14,color:'var(--accent)'})} ${t.rating.toFixed(1)}</span> <span style="color:var(--text-secondary);font-size:0.75rem;">(${t.reviews})</span></td>
                                <td style="color:var(--text-secondary);">${t.duration}</td>
                                <td class="cmp-price">${formatPrice(t.price)}</td>
                                <td><button class="btn btn-primary btn-sm cmp-btn" onclick="window.location.href='/booking?tour=${tour.id}'">View</button></td>
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

            let html = '';
            const dayData = [];

            try {
                const parsed = JSON.parse(tour.itinerary);
                if (Array.isArray(parsed) && parsed.length) {
                    if (parsed[0].activities) {
                        parsed.forEach(function(day, idx) {
                            const dayNum = day.day || idx + 1;
                            const acts = day.activities || [];
                            const firstAct = acts[0] || {};
                            const subtitle = firstAct.description ? firstAct.description.split('.')[0] + '.' : '';
                            dayData.push({ dayNum, acts, hasActivities: true });
                            html += `
                                <div class="itinerary-day">
                                    <div class="itinerary-day-header" onclick="toggleItinerary(this)">
                                        <span class="day-number">${String(dayNum).padStart(2, '0')}</span>
                                        <span class="day-info">
                                            <span class="day-label">Day ${dayNum}${firstAct.title ? ': ' + escapeHTML(firstAct.title) : ''}</span>
                                            ${subtitle ? `<span class="day-subtitle">${escapeHTML(subtitle)}</span>` : ''}
                                        </span>
                                        <span class="day-arrow">${svgIcon('chevron-down')}</span>
                                    </div>
                                    <div class="itinerary-day-content">
                                        ${acts.map(function(act, ai) {
                                            return `
                                                <div class="itinerary-activity-item${ai > 0 ? ' itinerary-activity-item--border' : ''}">
                                                    <div class="ia-header">
                                                        ${act.start_time ? `<span class="ia-time">${escapeHTML(act.start_time)}</span>` : ''}
                                                        ${act.activity ? `<span class="ia-badge">${escapeHTML(act.activity)}</span>` : ''}
                                                    </div>
                                                    ${act.title ? `<div class="ia-title">${escapeHTML(act.title)}</div>` : ''}
                                                    ${act.description ? `<p class="ia-desc">${escapeHTML(act.description)}</p>` : ''}
                                                </div>
                                            `;
                                        }).join('')}
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        parsed.forEach(function(day, idx) {
                            if (!day.description) return;
                            const title = day.title || '';
                            const dayNum = day.day || idx + 1;
                            html += `
                                <div class="itinerary-day">
                                    <div class="itinerary-day-header" onclick="toggleItinerary(this)">
                                        <span class="day-number">${String(dayNum).padStart(2, '0')}</span>
                                        <span class="day-info">
                                            <span class="day-label">Day ${dayNum}${title ? ': ' + escapeHTML(title) : ''}</span>
                                            <span class="day-subtitle">${escapeHTML(day.description.split('.')[0] + '.')}</span>
                                        </span>
                                        <span class="day-arrow">${svgIcon('chevron-down')}</span>
                                    </div>
                                    <div class="itinerary-day-content">
                                        <p>${escapeHTML(day.description)}</p>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    if (html) {
                        container.innerHTML = html;
                        return;
                    }
                }
            } catch (e) {
                // not JSON, fall through to text parsing
            }

            const dayRegex = /Day\s+(\d+)\s*[:.-]?\s*/gi;
            const parts = tour.itinerary.split(dayRegex);

            if (parts.length < 3) {
                container.innerHTML = `<p style="color:var(--text-secondary);">${escapeHTML(tour.itinerary)}</p>`;
                return;
            }

            for (let i = 1; i < parts.length; i += 2) {
                const dayNum = parts[i];
                const dayContent = parts[i + 1] ? parts[i + 1].trim() : '';
                if (!dayContent) continue;

                html += `
                    <div class="itinerary-day">
                        <div class="itinerary-day-header" onclick="toggleItinerary(this)">
                            <span class="day-number">${escapeHTML(dayNum.padStart(2, '0'))}</span>
                            <span class="day-info">
                                <span class="day-label">Day ${escapeHTML(dayNum)}</span>
                            </span>
                            <span class="day-arrow">${svgIcon('chevron-down')}</span>
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
                        <h3 class="included-title">${svgIcon('check',{color:'var(--primary)'})} Included</h3>
                        <ul>
                            ${included.map(item => `<li><span class="icon-check">${svgIcon('check',{color:'var(--primary)'})}</span> ${escapeHTML(item)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }
            if (excluded.length > 0) {
                html += `
                    <div class="inclusions-col">
                        <h3 class="excluded-title">${svgIcon('times',{color:'var(--error)'})} Excluded</h3>
                        <ul>
                            ${excluded.map(item => `<li><span class="icon-cross">${svgIcon('times',{color:'var(--error)'})}</span> ${escapeHTML(item)}</li>`).join('')}
                        </ul>
                    </div>
                `;
            }

            container.innerHTML = html;
        }

        async function renderReviews() {
            const tour = currentTour;
            const layout = document.getElementById('reviews-layout');
            const tourId = tour.id;
            reviewsLoading = true;
            reviewsData = { reviews: [], total: 0, page: 1, pages: 1 };

            await loadReviewsPage(tourId, 1);

            layout.innerHTML = renderReviewsLayout(tour);
            if (reviewsData.total > 0) renderStarDistribution();
            setupReviewSearch();
        }

        async function loadReviewsPage(tourId, page) {
            if (reviewsLoading && page > 1) return;
            reviewsLoading = true;
            try {
                const res = await api.getReviews({ tour_id: tourId, page: page, per_page: 15 });
                if (page === 1) {
                    reviewsData = res;
                } else {
                    reviewsData.reviews = reviewsData.reviews.concat(res.reviews);
                    reviewsData.page = res.page;
                    reviewsData.pages = res.pages;
                }
            } catch (e) {
                reviewsData = { reviews: [], total: 0, page: 1, pages: 1 };
            } finally {
                reviewsLoading = false;
            }
        }

        function renderReviewsLayout(tour) {
            const reviews = reviewsData.reviews;
            const total = reviewsData.total;
            const avgRating = tour.avg_rating || 0;

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
                + '<div class="reviews-right-header">' + total + ' Reviews</div>'
                + '<div class="reviews-search-wrap"><input type="text" class="reviews-search" id="reviews-search-input" placeholder="Search reviews..."></div>'
                + '<div class="reviews-list" id="reviews-list">';

            if (reviews.length > 0) {
                reviews.forEach(function(review) {
                    const name = review.user_name || 'Anonymous';
                    const initials = name.split(' ').map(function(w) { return w[0]; }).join('').substring(0, 2).toUpperCase();
                    const colors = ['#122218', '#2a4a3a', '#8aa899', '#0d1f12', '#333'];
                    const colorIdx = Math.abs(name.charCodeAt(0) || 0) % colors.length;
                    const date = review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
                    const stars = svgIcon('star',{size:14}).repeat(review.rating || 0) + svgIcon('star-outline',{size:14}).repeat(5 - (review.rating || 0));
                    rightHtml += '<div class="review-card" data-comment="' + escapeHTML((review.comment || '').toLowerCase()) + '" data-name="' + escapeHTML(name.toLowerCase()) + '">'
                        + '<div class="review-card-header">'
                            + '<div class="review-card-user">'
                                + '<div class="review-card-avatar" style="background:' + colors[colorIdx] + ';color:white;">' + escapeHTML(initials) + '</div>'
                                + '<div><div class="review-card-name">' + escapeHTML(name) + '</div>'
                                + '<div class="review-card-date">' + escapeHTML(date) + '</div></div>'
                            + '</div>'
                            + '<div class="review-card-stars">' + stars + '</div>'
                        + '</div>'
                        + '<div class="review-card-comment">' + escapeHTML(review.comment || '') + '</div>'
                        + (review.admin_reply ? '<div class="review-admin-reply"><strong>Admin reply:</strong> ' + escapeHTML(review.admin_reply) + '</div>' : '')
                        + '<div class="review-card-actions">'
                            + '<button class="review-like-btn" data-id="' + review.id + '" onclick="handleLike(\'' + review.id + '\')">'
                                + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>'
                                + ' <span id="like-count-' + review.id + '">' + (review.likes || 0) + '</span>'
                            + '</button>'
                            + '<button class="review-dislike-btn" data-id="' + review.id + '" onclick="handleDislike(\'' + review.id + '\')">'
                                + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>'
                                + ' <span id="dislike-count-' + review.id + '">' + (review.dislikes || 0) + '</span>'
                            + '</button>'
                        + '</div>'
                        + '</div>';
                });
            } else {
                rightHtml += '<p style="color:var(--text-secondary);text-align:center;padding:2rem 0;">No reviews yet. Be the first to review this tour!</p>';
            }
            rightHtml += '</div>';

            if (reviewsData.page < reviewsData.pages) {
                rightHtml += '<div style="text-align:center;padding:1rem 0;"><button class="btn btn-outline" id="show-more-reviews" onclick="loadMoreReviews()">Show More (' + (reviewsData.total - reviews.length) + ' more)</button></div>';
            }

            rightHtml += '</div>';

            return leftHtml + rightHtml;
        }

        window.handleLike = async function(reviewId) {
            try {
                const res = await api.likeReview(reviewId);
                document.getElementById('like-count-' + reviewId).textContent = res.likes;
            } catch (e) {
                showToast('Failed to like review', 'error');
            }
        };

        window.handleDislike = async function(reviewId) {
            try {
                const res = await api.dislikeReview(reviewId);
                document.getElementById('dislike-count-' + reviewId).textContent = res.dislikes;
            } catch (e) {
                showToast('Failed to dislike review', 'error');
            }
        };

        window.loadMoreReviews = async function() {
            if (reviewsLoading) return;
            const nextPage = reviewsData.page + 1;
            const tourId = currentTour.id;
            await loadReviewsPage(tourId, nextPage);
            const layout = document.getElementById('reviews-layout');
            layout.innerHTML = renderReviewsLayout(currentTour);
            if (reviewsData.total > 0) renderStarDistribution();
            setupReviewSearch();
        };

        function setupReviewSearch() {
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
            const allReviews = reviewsData.reviews || [];
            const starCounts = {5:0,4:0,3:0,2:0,1:0};
            allReviews.forEach(function(r) { const rt = Math.round(r.rating || 0); if (rt >= 1 && rt <= 5) starCounts[rt]++; });
            const total = allReviews.length || 1;
            var html = '';
            for (var i = 5; i >= 1; i--) {
                var pct = (starCounts[i] / total) * 100;
                html += '<div class="star-row"><span class="star-row-label">' + i + ' ' + svgIcon('star',{size:10,color:'var(--accent)'}) + '</span>'
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
                        + '<input type="radio" name="rating" id="star5" value="5"><label for="star5" title="5 stars">' + svgIcon('star') + '</label>'
                        + '<input type="radio" name="rating" id="star4" value="4"><label for="star4" title="4 stars">' + svgIcon('star') + '</label>'
                        + '<input type="radio" name="rating" id="star3" value="3"><label for="star3" title="3 stars">' + svgIcon('star') + '</label>'
                        + '<input type="radio" name="rating" id="star2" value="2"><label for="star2" title="2 stars">' + svgIcon('star') + '</label>'
                        + '<input type="radio" name="rating" id="star1" value="1"><label for="star1" title="1 star">' + svgIcon('star') + '</label>'
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

                const hasMeeting = tour.meeting_latitude != null && tour.meeting_longitude != null;

                let centerLat = tour.latitude;
                let centerLng = tour.longitude;
                let zoom = 10;

                if (hasMeeting) {
                    centerLat = (parseFloat(tour.latitude) + parseFloat(tour.meeting_latitude)) / 2;
                    centerLng = (parseFloat(tour.longitude) + parseFloat(tour.meeting_longitude)) / 2;
                    const latDiff = Math.abs(tour.latitude - tour.meeting_latitude);
                    const lngDiff = Math.abs(tour.longitude - tour.meeting_longitude);
                    const maxDiff = Math.max(latDiff, lngDiff);
                    if (maxDiff < 0.05) zoom = 14;
                    else if (maxDiff < 0.2) zoom = 12;
                    else zoom = 10;
                }

                mapInstance = L.map('map').setView([centerLat, centerLng], zoom);

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 18
                }).addTo(mapInstance);

                const destPopup = `
                    <div style="font-family:var(--font-body);font-size:0.85rem;">
                        <b style="font-size:0.95rem;">${escapeHTML(tour.title)}</b>
                        ${tour.location_name ? `<br><span style="color:var(--text-secondary);">${escapeHTML(tour.location_name)}</span>` : ''}
                        ${tour.formatted_address ? `<br><span style="color:var(--text-secondary);font-size:0.78rem;">${escapeHTML(tour.formatted_address)}</span>` : ''}
                        ${tour.county || tour.country ? `<br><span style="color:var(--text-placeholder);font-size:0.75rem;">${[tour.county, tour.country].filter(Boolean).join(', ')}</span>` : ''}
                    </div>
                `;

                const destIcon = L.divIcon({
                    html: `<div style="background:#122218;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">${svgIcon('map-pin')}</div>`,
                    className: '',
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                L.marker([tour.latitude, tour.longitude], { icon: destIcon })
                    .addTo(mapInstance)
                    .bindPopup(destPopup)
                    .openPopup();

                if (hasMeeting) {
                    const meetingPopup = `
                        <div style="font-family:var(--font-body);font-size:0.85rem;">
                            <b style="font-size:0.95rem;">${escapeHTML(tour.meeting_point_name || 'Meeting Point')}</b>
                            ${tour.meeting_address ? `<br><span style="color:var(--text-secondary);">${escapeHTML(tour.meeting_address)}</span>` : ''}
                        </div>
                    `;

                    const meetingIcon = L.divIcon({
                        html: `<div style="background:#c0392b;color:#fff;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.3);font-size:14px;">📍</div>`,
                        className: '',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                    });

                    L.marker([tour.meeting_latitude, tour.meeting_longitude], { icon: meetingIcon })
                        .addTo(mapInstance)
                        .bindPopup(meetingPopup);

                    L.polyline([
                        [tour.latitude, tour.longitude],
                        [tour.meeting_latitude, tour.meeting_longitude]
                    ], {
                        color: '#122218',
                        weight: 2,
                        opacity: 0.4,
                        dashArray: '6, 8'
                    }).addTo(mapInstance);
                }

                const locationInfo = document.getElementById('tour-location-info');
                if (!locationInfo) {
                    const mapContainer = document.getElementById('map');
                    const infoDiv = document.createElement('div');
                    infoDiv.id = 'tour-location-info';
                    infoDiv.style.cssText = 'margin-top:0.75rem;padding:1rem;background:rgba(255,255,255,0.7);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.8);border-radius:14px;';
                    const hasCoords = tour.county || tour.country || tour.formatted_address;
                    infoDiv.innerHTML = `
                        <div style="display:flex;align-items:flex-start;gap:0.75rem;">
                            <div style="font-size:1.2rem;line-height:1;">📍</div>
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:600;font-size:0.95rem;color:var(--dark-text);">${escapeHTML(tour.location_name || tour.title)}</div>
                                ${tour.formatted_address ? `<div style="font-size:0.82rem;color:var(--text-secondary);margin-top:0.15rem;">${escapeHTML(tour.formatted_address)}</div>` : ''}
                                ${tour.county || tour.country ? `<div style="font-size:0.78rem;color:var(--text-placeholder);margin-top:0.15rem;">${[tour.county, tour.country].filter(Boolean).join(', ')}</div>` : ''}
                                <div style="display:flex;gap:1rem;margin-top:0.5rem;flex-wrap:wrap;">
                                    ${hasMeeting ? `<a href="https://www.google.com/maps/dir/?api=1&origin=${tour.meeting_latitude},${tour.meeting_longitude}&destination=${tour.latitude},${tour.longitude}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.3rem 0.75rem;border-radius:8px;background:#122218;color:#fff;font-size:0.78rem;font-weight:600;text-decoration:none;transition:opacity 0.2s;" onmouseover="this.style.opacity=0.85" onmouseout="this.style.opacity=1">${svgIcon('navigation',{size:14})} Get Directions</a>` : ''}
                                    <a href="https://www.google.com/maps/search/?api=1&query=${tour.latitude},${tour.longitude}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:0.3rem;padding:0.3rem 0.75rem;border-radius:8px;background:rgba(18,34,36,0.08);color:var(--dark-text);font-size:0.78rem;font-weight:600;text-decoration:none;transition:background 0.2s;" onmouseover="this.style.background='rgba(18,34,36,0.14)'" onmouseout="this.style.background='rgba(18,34,36,0.08)'">${svgIcon('external-link',{size:14})} Open in Google Maps</a>
                                </div>
                            </div>
                        </div>
                    `;
                    if (hasCoords || hasMeeting) {
                        mapContainer.parentNode.insertBefore(infoDiv, mapContainer.nextSibling);
                    }
                }
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
                        <div class="related-card" onclick="window.location.href='/tours/${t.slug || t.id}'">
                            <img src="${imgUrl}" alt="${t.title}" loading="lazy" onerror="this.src='/assets/images/placeholder.svg'">
                            <div class="related-card-body">
                                <h4>${t.title}</h4>
                                <div class="related-location">${svgIcon('map-pin')} ${t.location || 'Kenya'}</div>
                                <div class="related-meta">
                                    <span class="related-price">${window.priceHTML(t.price)}</span>
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
            const hasOffer = tour.original_price && Number(tour.original_price) > price;
            const discountPct = tour.discount_pct || (hasOffer ? Math.round((1 - price / Number(tour.original_price)) * 100) : 0);

            if (hasOffer) {
                document.getElementById('sidebar-price').innerHTML =
                    '<div class="sidebar-offer-price">'
                    + '<span class="price-old" style="font-size:0.85rem;font-weight:500;color:var(--text-placeholder);text-decoration:line-through;display:block;">' + window.formatPrice(tour.original_price) + '</span>'
                    + '<span style="display:flex;align-items:baseline;gap:0.5rem;flex-wrap:wrap;">'
                    + '<span class="price-new price-amount" data-kes="' + price + '" style="font-size:1.8rem;font-weight:700;color:#c0392b;">' + window.formatPrice(price) + '</span>'
                    + '<span class="discount-badge" style="background:#c0392b;color:#fff;padding:0.2rem 0.6rem;border-radius:999px;font-size:0.68rem;font-weight:700;">-' + discountPct + '%</span>'
                    + '</span>'
                    + '</div>';
                document.getElementById('mobile-bar-price').innerHTML =
                    '<span style="display:flex;align-items:baseline;gap:0.4rem;">'
                    + '<span class="price-new" style="font-weight:700;color:#c0392b;">' + window.formatPrice(price) + '</span>'
                    + '<span class="discount-badge" style="background:#c0392b;color:#fff;padding:0.15rem 0.5rem;border-radius:999px;font-size:0.6rem;font-weight:700;">-' + discountPct + '%</span>'
                    + '</span>';
            } else {
                document.getElementById('sidebar-price').innerHTML = window.priceHTML(price);
                document.getElementById('mobile-bar-price').innerHTML = window.priceHTML(price);
            }

            document.getElementById('sidebar-badges').innerHTML = `
                <span class="sidebar-badge sb-hot">${svgIcon('fire')} Likely to Sell Out</span>
                <span class="sidebar-badge sb-best">${svgIcon('trophy')} Best in ${escapeHTML(tour.location || 'Kenya')}</span>
                <span class="sidebar-badge sb-deal">${svgIcon('tag')} Exceptional deal</span>
            `;

            document.getElementById('sidebar-why-book').innerHTML = `
                <h4>Why book with us?</h4>
                <ul>
                    <li>${svgIcon('check-circle',{size:14,color:'var(--primary)'})} Lowest Price Guarantee</li>
                    <li>${svgIcon('check-circle',{size:14,color:'var(--primary)'})} Free cancellation up to 24 hours</li>
                    <li>${svgIcon('check-circle',{size:14,color:'var(--primary)'})} Reserve Now & Pay Later</li>
                    <li>${svgIcon('check-circle',{size:14,color:'var(--primary)'})} Secure payments</li>
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
            document.getElementById('sidebar-total').innerHTML = window.priceHTML(total);
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
            window.location.href = `/booking?tour=${currentTour.id}&date=${date}&people=${people}`;
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

        document.addEventListener('DOMContentLoaded',  () => {
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
                    await api.createReview({
                        tour_id: tourId,
                        rating: parseInt(rating.value),
                        comment: comment
                    });
                    showToast('Review submitted!', 'success');
                    e.target.reset();
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