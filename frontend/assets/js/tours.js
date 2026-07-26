
        let currentPage = 1;
        let totalTours = 0;
        let currentTours = [];
        let wishlistMap = {};

        const filterSearch = document.getElementById('filter-search');
        const filterLocation = document.getElementById('filter-location');
        const filterMinPrice = document.getElementById('filter-min-price');
        const filterMaxPrice = document.getElementById('filter-max-price');
        const filterMinDuration = document.getElementById('filter-min-duration');
        const filterMaxDuration = document.getElementById('filter-max-duration');
        const tabsContainer = document.getElementById('destination-tabs');
        const urlParams = new URLSearchParams(window.location.search);
        let currentActivityType = '';

        function getFilters() {
            return {
                search: filterSearch.value.trim(),
                activity_type: currentActivityType,
                location: filterLocation.value.trim(),
                min_price: filterMinPrice.value,
                max_price: filterMaxPrice.value,
                min_duration: filterMinDuration.value,
                max_duration: filterMaxDuration.value
            };
        }

        function setFiltersFromParams() {
            if (urlParams.has('search')) filterSearch.value = urlParams.get('search');
            if (urlParams.has('activity_type')) {
                currentActivityType = urlParams.get('activity_type');
            }
            if (urlParams.has('location')) filterLocation.value = urlParams.get('location');
            if (urlParams.has('min_price')) filterMinPrice.value = urlParams.get('min_price');
            if (urlParams.has('max_price')) filterMaxPrice.value = urlParams.get('max_price');
            if (urlParams.has('min_duration')) filterMinDuration.value = urlParams.get('min_duration');
            if (urlParams.has('max_duration')) filterMaxDuration.value = urlParams.get('max_duration');
            if (urlParams.has('page')) currentPage = parseInt(urlParams.get('page')) || 1;
        }

        function buildQueryParams() {
            const filters = getFilters();
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
            params.set('page', currentPage);
            params.set('per_page', 12);
            return params;
        }

        function updateURL() {
            const params = buildQueryParams();
            const qs = params.toString();
            const newUrl = window.location.pathname + (qs ? '?' + qs : '');
            window.history.replaceState({}, '', newUrl);
        }

        async function loadActivityTypes() {
            try {
                const result = await api.get('/tours/activity-types');
                const types = Array.isArray(result) ? result : (result.types || []);
                types.forEach(type => {
                    const btn = document.createElement('button');
                    btn.className = 'tours-tab';
                    btn.dataset.type = type;
                    btn.textContent = type;
                    btn.addEventListener('click', function () {
                        document.querySelectorAll('#destination-tabs .tours-tab').forEach(t => t.classList.remove('active'));
                        btn.classList.add('active');
                        currentActivityType = btn.dataset.type === '' ? '' : btn.dataset.type;
                        currentPage = 1;
                        loadTours();
                    });
                    tabsContainer.appendChild(btn);
                });
                if (currentActivityType) {
                    document.querySelectorAll('#destination-tabs .tours-tab').forEach(t => {
                        if (t.dataset.type === currentActivityType) {
                            t.classList.add('active');
                        } else {
                            t.classList.remove('active');
                        }
                    });
                }
            } catch (err) {
                console.error('Failed to load activity types:', err);
            }
        }

        async function loadWishlist() {
            if (!api.token) return;
            try {
                const result = await api.get('/wishlist');
                const items = Array.isArray(result) ? result : (result.wishlist || []);
                wishlistMap = {};
                items.forEach(item => {
                    if (item.tour_id) wishlistMap[item.tour_id] = item.id;
                });
                renderTours(currentTours);
            } catch (err) {
                console.error('Failed to load wishlist:', err);
            }
        }

        async function toggleWishlist(tourId) {
            if (!api.token) {
                showToast('Please login to save tours', 'warning');
                openModal('login-modal');
                return;
            }
            try {
                if (wishlistMap[tourId]) {
                    await api.delete('/wishlist/' + wishlistMap[tourId]);
                    delete wishlistMap[tourId];
                } else {
                    const res = await api.post('/wishlist', { tour_id: tourId });
                    if (res.wishlist) wishlistMap[tourId] = res.wishlist.id;
                }
                renderTours(currentTours);
            } catch (err) {
                showToast(err.message, 'error');
            }
        }

        async function loadTours() {
            const container = document.getElementById('tours-list');
            container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;"><div class="spinner"></div></div>';
            document.getElementById('filter-badges').innerHTML = '';
            document.getElementById('results-count').textContent = '';

            const params = buildQueryParams();
            updateURL();

            try {
                const result = await api.getTours(Object.fromEntries(params));
                currentTours = result.tours || [];
                totalTours = result.total || currentTours.length;
                const totalPages = result.pages || Math.ceil(totalTours / 12);
                renderFilterBadges();
                renderResultsCount(currentTours.length, totalTours);
                renderTours(currentTours);
                renderPagination(currentPage, totalPages);
            } catch (err) {
                container.innerHTML = '<div class="tours-empty"><h3>Could not load tours</h3><p>Please try again later.</p></div>';
            }
        }

        function renderStars(rating, count) {
            const r = Math.round(rating || 0);
            const stars = '<i class="fas fa-star" style="color:var(--accent);"></i>'.repeat(r) + '<i class="far fa-star" style="color:var(--accent);"></i>'.repeat(5 - r);
            return count !== undefined ? stars + ' (' + count + ')' : stars;
        }

        function formatTourDate(dateStr) {
            if (!dateStr) return '';
            var d = new Date(dateStr);
            var months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
            return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
        }

        function renderTours(tours) {
            const container = document.getElementById('tours-list');

            if (tours.length === 0) {
                container.innerHTML = '<div class="tours-empty"><h3>No tours match your filters</h3><p>Try adjusting your search criteria.</p><button class="btn btn-primary" onclick="resetFilters()" style="margin-top:1rem;">Reset Filters</button></div>';
                return;
            }

            container.innerHTML = tours.map(function(tour) {
                var img = tour.images && tour.images.length > 0
                    ? tour.images.find(function(i) { return i.is_primary; }) || tour.images[0]
                    : null;
                var imgUrl = img ? img.image_url : '/assets/images/placeholder.svg';
                var isSaved = !!wishlistMap[tour.id];
                var rating = tour.avg_rating || 0;
                var reviewCount = tour.reviews_count || 0;
                var fullStars = Math.round(rating);
                var starsHtml = '<i class="fas fa-star"></i>'.repeat(fullStars) + '<i class="far fa-star"></i>'.repeat(5 - fullStars);
                var desc = tour.description ? escapeHTML(tour.description) : '';
                var category = tour.activity_type ? escapeHTML(tour.activity_type) : '';
                var dateStr = formatTourDate(tour.created_at);
                var durationStr = tour.duration_days ? tour.duration_days + (tour.duration_days === 1 ? ' day' : ' days') : '';

                var sellOutHash = 0;
                for (var ci = 0; ci < (tour.id || '').length; ci++) { sellOutHash = ((sellOutHash << 5) - sellOutHash) + (tour.id || '').charCodeAt(ci); sellOutHash |= 0; }
                var isLikelyToSellOut = Math.abs(sellOutHash) % 5 < 2;
                var isOffer = Math.abs(sellOutHash) % 7 < 2;

                var cardClasses = 'tour-card';
                if (isLikelyToSellOut) cardClasses += ' tour-card--sell-out';

                var offerBadgeHtml = '';
                if (isOffer) {
                    offerBadgeHtml = '<span class="tour-card-offer-badge">Limited Offer</span>';
                }
                var sellOutBadgeHtml = '';
                if (isLikelyToSellOut) {
                    sellOutBadgeHtml = '<span class="tour-card-sellout-badge">Likely to Sell Out</span>';
                }

                return '<a href="/tour-detail.html?id=' + tour.id + '" class="' + cardClasses + '">'
                    + '<div class="tour-card-img-wrap">'
                        + '<img src="' + imgUrl + '" alt="' + escapeHTML(tour.title) + '" class="tour-card-img" loading="lazy" onerror="this.src=\'/assets/images/placeholder.svg\'">'
                        + (category ? '<span class="tour-card-badge">' + category + '</span>' : '')
                        + offerBadgeHtml
                        + (api.token
                            ? '<button onclick="event.preventDefault();event.stopPropagation();toggleWishlist(\'' + tour.id + '\')" class="tour-card-wishlist" title="' + (isSaved ? 'Remove from wishlist' : 'Add to wishlist') + '">'
                                + (isSaved ? '<i class="fas fa-heart" style="color:#122218;"></i>' : '<i class="far fa-heart" style="color:#666;"></i>')
                            + '</button>'
                            : '')
                    + '</div>'
                    + '<div class="tour-card-body">'
                        + (sellOutBadgeHtml ? '<div class="tour-card-sellout-row">' + sellOutBadgeHtml + '</div>' : '')
                        + '<div class="tour-card-location">' + escapeHTML(tour.location || 'Kenya') + '</div>'
                        + (tour.wildlife ? '<div class="tour-card-wildlife"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/></svg><span>' + escapeHTML(tour.wildlife) + '</span></div>' : '')
                        + '<div class="tour-card-title">' + escapeHTML(tour.title) + '</div>'
                        + (desc ? '<div class="tour-card-desc">' + desc + '</div>' : '')
                        + '<div class="tour-card-meta">'
                            + (durationStr ? '<span>' + durationStr + '</span>' : '')
                            + (rating > 0 ? '<div class="tour-card-stars">' + starsHtml + ' <span>' + rating.toFixed(1) + ' (' + reviewCount + ')</span></div>' : '')
                        + '</div>'
                        + '<div class="tour-card-footer">'
                            + '<div class="tour-card-price">' + window.formatPrice(tour.price) + ' <small>/ person</small></div>'
                            + '<div class="tour-card-btn-row">'
                                + '<span class="tour-card-btn">Details</span>'
                                + '<span class="tour-card-btn-arrow"><img src="/assets/images/right-arrow.png" alt="" class="tour-card-btn-arrow-img"></span>'
                            + '</div>'
                        + '</div>'
                    + '</div>'
                + '</a>';
            }).join('');

            if (window.AOS) { AOS.refresh(); }
        }

        function renderFilterBadges() {
            const container = document.getElementById('filter-badges');
            const filters = getFilters();
            const badges = [];

            if (filters.search) badges.push({ key: 'search', label: '"' + filters.search + '"' });
            if (filters.activity_type) badges.push({ key: 'activity', label: filters.activity_type });
            if (filters.location) badges.push({ key: 'location', label: filters.location });
            if (filters.min_price) badges.push({ key: 'min-price', label: 'Min KSh ' + Number(filters.min_price).toLocaleString() });
            if (filters.max_price) badges.push({ key: 'max-price', label: 'Max KSh ' + Number(filters.max_price).toLocaleString() });
            if (filters.min_duration) badges.push({ key: 'min-duration', label: 'Min ' + filters.min_duration + ' days' });
            if (filters.max_duration) badges.push({ key: 'max-duration', label: 'Max ' + filters.max_duration + ' days' });

            if (badges.length === 0) {
                container.innerHTML = '';
                return;
            }

            container.innerHTML = badges.map(function(b) {
                return '<span class="filter-badge" onclick="removeFilter(\'' + b.key + '\')">'
                + b.label + '<span class="filter-badge-x">&times;</span>'
                + '</span>';
            }).join('')
            + '<button class="filter-badge" style="background:none;border:none;color:#122218;font-weight:600;cursor:pointer;" onclick="resetFilters()">Clear all</button>';
        }

        function removeFilter(key) {
            if (key === 'activity') {
                currentActivityType = '';
                document.querySelectorAll('#destination-tabs .tours-tab').forEach(t => t.classList.remove('active'));
                document.querySelector('#destination-tabs .tours-tab:first-child').classList.add('active');
            } else {
                const map = {
                    'search': filterSearch,
                    'location': filterLocation,
                    'min-price': filterMinPrice,
                    'max-price': filterMaxPrice,
                    'min-duration': filterMinDuration,
                    'max-duration': filterMaxDuration
                };
                const el = map[key];
                if (el) el.value = '';
            }
            currentPage = 1;
            loadTours();
        }

        function resetFilters() {
            filterSearch.value = '';
            currentActivityType = '';
            document.querySelectorAll('#destination-tabs .tours-tab').forEach(t => t.classList.remove('active'));
            document.querySelector('#destination-tabs .tours-tab:first-child').classList.add('active');
            filterLocation.value = '';
            filterMinPrice.value = '';
            filterMaxPrice.value = '';
            filterMinDuration.value = '';
            filterMaxDuration.value = '';
            currentPage = 1;
            loadTours();
        }

        function renderResultsCount(showing, total) {
            document.getElementById('results-count').textContent = 'Showing ' + showing + ' of ' + total + ' tours';
        }

        function renderPagination(page, totalPages) {
            const container = document.getElementById('pagination');
            if (totalPages <= 1) {
                container.innerHTML = '';
                return;
            }

            let html = '';
            html += '<button onclick="goToPage(' + (page - 1) + ')"' + (page <= 1 ? ' disabled' : '') + '>&laquo; Prev</button>';

            for (let i = 1; i <= totalPages; i++) {
                if (i === page) {
                    html += '<button class="active" style="cursor:default;">' + i + '</button>';
                } else {
                    html += '<button onclick="goToPage(' + i + ')">' + i + '</button>';
                }
            }

            html += '<button onclick="goToPage(' + (page + 1) + ')"' + (page >= totalPages ? ' disabled' : '') + '>Next &raquo;</button>';
            container.innerHTML = html;
        }

        function goToPage(page) {
            currentPage = page;
            loadTours();
        }

        function onFilterChange() {
            currentPage = 1;
            loadTours();
        }

        function debounce(fn, ms) {
            let timer;
            return function () {
                clearTimeout(timer);
                timer = setTimeout(fn, ms);
            };
        }

        const debouncedFilter = debounce(onFilterChange, 400);

        document.querySelector('#destination-tabs .tours-tab:first-child').addEventListener('click', function () {
            document.querySelectorAll('#destination-tabs .tours-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentActivityType = '';
            currentPage = 1;
            loadTours();
        });

        filterSearch.addEventListener('input', debouncedFilter);
        filterLocation.addEventListener('input', debouncedFilter);
        filterMinPrice.addEventListener('input', debouncedFilter);
        filterMaxPrice.addEventListener('input', debouncedFilter);
        filterMinDuration.addEventListener('input', debouncedFilter);
        filterMaxDuration.addEventListener('input', debouncedFilter);
        document.getElementById('clear-filters').addEventListener('click', resetFilters);

        function showTourDetails(tourId) {
            window.location.href = '/tour-detail.html?id=' + tourId;
        }

        function bookTour(tourId) {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Please login to book a tour', 'warning');
                openModal('login-modal');
                return;
            }
            window.location.href = '/booking.html?tour=' + tourId;
        }

        setFiltersFromParams();
        loadActivityTypes().then(function () {
            setFiltersFromParams();
            return loadTours();
        }).then(function () {
            var idParam = urlParams.get('id');
            if (idParam) {
                var check = setInterval(function () {
                    if (currentTours.find(function (t) { return t.id === idParam; })) {
                        clearInterval(check);
                        setTimeout(function () { showTourDetails(idParam); }, 300);
                    }
                }, 200);
                setTimeout(function () { clearInterval(check); }, 10000);
            }
        });
        if (api.token) loadWishlist();
