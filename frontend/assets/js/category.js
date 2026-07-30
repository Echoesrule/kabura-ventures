(function() {
    'use strict';

    var lenis = new Lenis({
        duration: 1.2,
        easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
        smoothWheel: true
    });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);

    var htmlEl = document.documentElement;
    var ACTIVITY_TYPE = htmlEl.getAttribute('data-activity-type');
    var CATEGORY_NAME = htmlEl.getAttribute('data-category-name') || ACTIVITY_TYPE;
    var FALLBACK_IMG = htmlEl.getAttribute('data-fallback-img') || '';
    var currentPage = 1;
    var currentTours = [];

    var filterSearch = document.getElementById('filter-search');
    var filterLocation = document.getElementById('filter-location');
    var filterMinPrice = document.getElementById('filter-min-price');
    var filterMaxPrice = document.getElementById('filter-max-price');

    function getFilters() {
        return {
            search: filterSearch.value.trim(),
            activity_type: ACTIVITY_TYPE,
            location: filterLocation.value.trim(),
            min_price: filterMinPrice.value,
            max_price: filterMaxPrice.value
        };
    }

    function buildQueryParams() {
        var filters = getFilters();
        var params = new URLSearchParams();
        Object.entries(filters).forEach(function(kv) { if (kv[1]) params.set(kv[0], kv[1]); });
        params.set('page', currentPage);
        params.set('per_page', 9);
        return params;
    }

    function updateURL() {
        var params = buildQueryParams();
        var qs = params.toString();
        window.history.replaceState({}, '', window.location.pathname + (qs ? '?' + qs : ''));
    }

    async function loadTours() {
        var container = document.getElementById('tours-list');
        container.innerHTML = '<div class="category-empty"><h3>Loading...</h3></div>';
        updateURL();
        try {
            var params = Object.fromEntries(buildQueryParams());
            var result = await api.getTours(params);
            currentTours = result.tours || [];
            var total = result.total || currentTours.length;
            var totalPages = result.pages || Math.ceil(total / 9);
            document.getElementById('results-count').textContent = 'Showing ' + currentTours.length + ' of ' + total + ' ' + CATEGORY_NAME + ' tours';
            renderTours(currentTours);
            renderPagination(currentPage, totalPages);
        } catch (err) {
            container.innerHTML = '<div class="category-empty"><h3>Could not load tours</h3><p>Please try again later.</p></div>';
        }
    }

    function renderTours(tours) {
        var container = document.getElementById('tours-list');
        if (tours.length === 0) {
            container.innerHTML = '<div class="category-empty"><h3>No ' + CATEGORY_NAME + ' tours found</h3><p>Try adjusting your filters or check back later.</p></div>';
            return;
        }
        container.innerHTML = tours.map(function(tour) {
            var img = (tour.images && tour.images.length) ? (tour.images.find(function(i){return i.is_primary}) || tour.images[0]).image_url : FALLBACK_IMG;
            var rating = tour.avg_rating || 0;
            var fullStars = Math.round(rating);
            var starsHtml = '<i class="fas fa-star"></i>'.repeat(fullStars) + '<i class="far fa-star"></i>'.repeat(5 - fullStars);
            var reviewCount = tour.reviews_count || 0;
            var isOffer = !!(tour.original_price && Number(tour.original_price) > Number(tour.price));
            var discountPct = tour.discount_pct || (isOffer ? Math.round((1 - Number(tour.price) / Number(tour.original_price)) * 100) : 0);
            var priceHtml;
            if (isOffer) {
                priceHtml = '<div class="category-tour-price category-tour-price--offer" style="display:flex;align-items:baseline;gap:0.4rem;flex-wrap:wrap;">'
                    + '<span class="category-tour-price-old" style="font-size:0.82rem;font-weight:500;color:var(--text-placeholder);text-decoration:line-through;">' + formatPrice(tour.original_price) + '</span>'
                    + '<span class="category-tour-price-new price-amount" data-kes="' + tour.price + '" style="font-size:1.15rem;font-weight:700;color:#c0392b;">' + formatPrice(tour.price) + '</span>'
                    + '<span class="tour-card-offer-badge" style="font-size:0.65rem;font-weight:700;background:#c0392b;color:#fff;padding:0.15rem 0.5rem;border-radius:999px;">-' + discountPct + '%</span>'
                    + '</div>';
            } else {
                priceHtml = '<span class="category-tour-price price-amount" data-kes="' + (tour.price || 0) + '">' + formatPrice(tour.price || 0) + '</span>';
            }
            return '<a href="/tours/' + (tour.slug || tour.id) + '" class="category-tour-card">'
                + (isOffer ? '<span class="tour-card-offer-badge" style="position:absolute;top:0.75rem;left:50%;transform:translateX(-50%);padding:0.3rem 0.8rem;border-radius:999px;font-size:0.68rem;font-weight:700;background:#c0392b;color:#fff;text-transform:uppercase;letter-spacing:0.3px;z-index:2;">-' + discountPct + '%</span>' : '')
                + '<img src="' + img + '" alt="' + (tour.title || '') + '" class="category-tour-img" loading="lazy">'
                + '<div class="category-tour-body">'
                + '<div class="category-tour-location"><i class="fas fa-map-marker-alt"></i> ' + (tour.location || 'Kenya') + '</div>'
                + '<h3 class="category-tour-title">' + (tour.title || '') + '</h3>'
                + (rating > 0 ? '<div class="category-tour-stars">' + starsHtml + ' <span>' + rating.toFixed(1) + ' (' + reviewCount + ')</span></div>' : '')
                + '<p class="category-tour-desc">' + (tour.description || '').substring(0, 120) + '...</p>'
                + '<div class="category-tour-footer">'
                + priceHtml
                + '<span class="category-tour-cta">View Details <i class="fas fa-arrow-right"></i></span>'
                + '</div></div></a>';
        }).join('');
        refreshCurrencyPrices();
    }

    function renderPagination(page, totalPages) {
        var container = document.getElementById('pagination');
        if (totalPages <= 1) { container.innerHTML = ''; return; }
        var html = '<button onclick="goToPage(' + (page - 1) + ')"' + (page <= 1 ? ' disabled' : '') + '>Prev</button>';
        for (var i = 1; i <= totalPages; i++) {
            html += '<button onclick="goToPage(' + i + ')" class="' + (i === page ? 'active-page' : '') + '">' + i + '</button>';
        }
        html += '<button onclick="goToPage(' + (page + 1) + ')"' + (page >= totalPages ? ' disabled' : '') + '>Next</button>';
        container.innerHTML = html;
    }

    window.goToPage = function(page) { currentPage = page; loadTours(); };

    function debounce(fn, ms) { var t; return function() { clearTimeout(t); t = setTimeout(fn, ms); }; }
    var debouncedFilter = debounce(function() { currentPage = 1; loadTours(); }, 400);

    filterSearch.addEventListener('input', debouncedFilter);
    filterLocation.addEventListener('input', debouncedFilter);
    filterMinPrice.addEventListener('input', debouncedFilter);
    filterMaxPrice.addEventListener('input', debouncedFilter);
    document.getElementById('clear-filters').addEventListener('click', function() {
        filterSearch.value = ''; filterLocation.value = '';
        filterMinPrice.value = ''; filterMaxPrice.value = '';
        currentPage = 1; loadTours();
    });

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('search')) filterSearch.value = urlParams.get('search');
    if (urlParams.has('location')) filterLocation.value = urlParams.get('location');
    if (urlParams.has('min_price')) filterMinPrice.value = urlParams.get('min_price');
    if (urlParams.has('max_price')) filterMaxPrice.value = urlParams.get('max_price');
    if (urlParams.has('page')) currentPage = parseInt(urlParams.get('page')) || 1;

    loadTours();
})();
