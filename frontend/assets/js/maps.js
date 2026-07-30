let mapInstance = null;
let markerCluster = null;
let allMarkers = [];
let allTours = [];

function formatDuration(days) {
    if (!days) return '';
    return days === 1 ? '1 day' : days + ' days';
}

function renderStars(rating) {
    if (!rating) return '';
    var full = Math.round(rating);
    var empty = 5 - full;
    var h = '';
    for (var i = 0; i < full; i++) h += svgIcon('star', { size: 12, color: 'var(--accent)' });
    for (var i = 0; i < empty; i++) h += svgIcon('star', { size: 12, color: 'rgba(18,34,24,0.1)' });
    return h;
}

function createPopupContent(tour) {
    var imgUrl = tour.primary_image_url || '';
    var imgHtml = imgUrl
        ? '<div class="map-popup-img-wrap"><img class="map-popup-img" src="' + escapeHTML(imgUrl) + '" alt="" onerror="this.parentElement.style.display=\'none\'"></div>'
        : '<div class="map-popup-img-wrap map-popup-img-placeholder"><i class="fas fa-map-marked-alt"></i></div>';

    var priceHtml = window.priceHTML
        ? window.priceHTML(tour.price) + ' <small class="map-popup-price-label">/ person</small>'
        : '<span class="price-amount">KSh ' + Number(tour.price).toLocaleString() + '</span> <small class="map-popup-price-label">/ person</small>';

    var durStr = tour.duration_days ? formatDuration(tour.duration_days) : '';

    return '<div class="map-popup">'
        + imgHtml
        + '<div class="map-popup-body">'
        + '<div class="map-popup-location">' + escapeHTML(tour.location_name || tour.location || 'Kenya') + '</div>'
        + '<h3 class="map-popup-title">' + escapeHTML(tour.title) + '</h3>'
        + '<div class="map-popup-stars">' + renderStars(tour.average_rating) + '<span class="map-popup-rating">' + (tour.average_rating ? tour.average_rating.toFixed(1) : '') + '</span></div>'
        + '<div class="map-popup-meta">'
        + (durStr ? '<span class="map-popup-duration"><i class="far fa-clock"></i> ' + durStr + '</span>' : '')
        + '</div>'
        + '<div class="map-popup-footer">'
        + '<div class="map-popup-price">' + priceHtml + '</div>'
        + '<a href="/tours/' + encodeURIComponent(tour.slug || tour.id) + '" class="map-popup-btn">View Tour</a>'
        + '</div>'
        + '</div>'
        + '</div>';
}

function createMarkerIcon() {
    return L.divIcon({
        html: '<div class="map-marker-pin"><i class="fas fa-map-marker-alt"></i></div>',
        className: 'map-marker-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -40]
    });
}

function initMap() {
    mapInstance = L.map('map', {
        center: [0.0236, 37.9062],
        zoom: 7,
        zoomControl: true,
        scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18
    }).addTo(mapInstance);

    markerCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        iconCreateFunction: function (cluster) {
            var count = cluster.getChildCount();
            var size = count < 10 ? 'small' : count < 50 ? 'medium' : 'large';
            return L.divIcon({
                html: '<div class="map-cluster map-cluster-' + size + '"><span>' + count + '</span></div>',
                className: 'map-cluster-wrapper',
                iconSize: [44, 44],
                iconAnchor: [22, 22]
            });
        }
    });

    mapInstance.addLayer(markerCluster);
}

function addToursToMap(tours) {
    if (!markerCluster || !mapInstance) return;

    markerCluster.clearLayers();
    allMarkers = [];

    tours.forEach(function (tour) {
        var lat = parseFloat(tour.latitude);
        var lng = parseFloat(tour.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        var marker = L.marker([lat, lng], { icon: createMarkerIcon() });
        marker.bindPopup(createPopupContent(tour), {
            maxWidth: 320,
            minWidth: 260,
            className: 'map-popup-wrapper'
        });

        marker.tourData = tour;
        allMarkers.push(marker);
        markerCluster.addLayer(marker);
    });

    if (allMarkers.length > 0 && mapInstance) {
        var group = L.featureGroup(allMarkers);
        mapInstance.fitBounds(group.getBounds().pad(0.15));
    }
}

function filterMarkers(query) {
    if (!markerCluster) return;

    var q = query.toLowerCase().trim();

    markerCluster.clearLayers();

    var visibleCount = 0;
    allMarkers.forEach(function (marker) {
        var tour = marker.tourData;
        var match = !q
            || (tour.title && tour.title.toLowerCase().indexOf(q) !== -1)
            || (tour.location_name && tour.location_name.toLowerCase().indexOf(q) !== -1)
            || (tour.location && tour.location.toLowerCase().indexOf(q) !== -1);
        if (match) {
            markerCluster.addLayer(marker);
            visibleCount++;
        }
    });

    var countEl = document.getElementById('results-count');
    if (countEl) {
        countEl.textContent = visibleCount + ' of ' + allMarkers.length + ' tours';
    }
}

function showLoading() {
    document.getElementById('maps-loading').style.display = 'flex';
    document.getElementById('maps-error').style.display = 'none';
    document.getElementById('map').style.display = 'none';
}

function showError(msg) {
    document.getElementById('maps-loading').style.display = 'none';
    document.getElementById('maps-error').style.display = 'flex';
    document.getElementById('map').style.display = 'none';
    document.getElementById('maps-error-msg').textContent = msg || 'Failed to load tour locations.';
}

function showMap() {
    document.getElementById('maps-loading').style.display = 'none';
    document.getElementById('maps-error').style.display = 'none';
    document.getElementById('map').style.display = 'block';
}

document.addEventListener('DOMContentLoaded', function () {
    showLoading();

    initMap();

    api.get('/tours/locations')
        .then(function (result) {
            var tours = result.tours || result;
            if (!Array.isArray(tours)) tours = [];
            allTours = tours;

            var valid = tours.filter(function (t) {
                return t.latitude != null && t.longitude != null;
            });

            if (valid.length === 0) {
                showMap();
                document.getElementById('results-count').textContent = 'No tours with locations found.';
                return;
            }

            addToursToMap(valid);
            showMap();

            var countEl = document.getElementById('results-count');
            if (countEl) {
                countEl.textContent = valid.length + ' tour' + (valid.length !== 1 ? 's' : '');
            }

            var searchInput = document.getElementById('map-search');
            if (searchInput) {
                searchInput.addEventListener('input', function () {
                    filterMarkers(this.value);
                });
            }
        })
        .catch(function (err) {
            showError(err.message || 'Failed to load tour locations. Please try again later.');
        });
});
