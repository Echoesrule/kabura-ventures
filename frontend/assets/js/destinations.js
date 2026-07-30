/* destinations.js - Load and render destination cards + map */
(function () {
    const grid = document.getElementById('destinations-grid');
    if (!grid) return;

    const DEST_DATA = {
        'Maasai Mara': {
            desc: 'Witness the Great Migration and encounter the Big Five in Africa\'s most iconic wildlife reserve.',
            expect: 'Game drives, balloon safaris, Maasai cultural visits',
            image: '/assets/images/maasai mara.jpg'
        },
        'Amboseli': {
            desc: 'Elephant herds roam beneath the towering backdrop of Mount Kilimanjaro in this legendary park.',
            expect: 'Wildlife photography, scenic views, conservancy walks',
            image: '/assets/images/mt- kenya.jpg'
        },
        'Mombasa': {
            desc: 'Swahili culture, historic forts, and warm Indian Ocean waters await in Kenya\'s coastal gem.',
            expect: 'Beach relaxation, snorkeling, Old Town tours',
            image: '/assets/images/0b077ea0-8715-4255-af38-255ad10c5549.jpg'
        },
        'Diani Beach': {
            desc: 'Pristine white sand, turquoise waters, and world-class diving on Kenya\'s south coast.',
            expect: 'Water sports, coral reef diving, dhow sailing',
            image: '/assets/images/0b077ea0-8715-4255-af38-255ad10c5549.jpg'
        },
        'Lake Nakuru': {
            desc: 'A shimmering alkaline lake famous for flamingos, rhinos, and stunning birdlife.',
            expect: 'Bird watching, rhino tracking, scenic lakeside drives',
            image: '/assets/images/mt kenya.jpg'
        },
        'Mount Kenya': {
            desc: 'Africa\'s second-highest peak offers world-class trekking through alpine meadows and glaciers.',
            expect: 'Mountain trekking, camping, glacier hiking',
            image: '/assets/images/mt- kenya.jpg'
        },
        'Tsavo': {
            desc: 'One of Kenya\'s largest wilderness areas, known for red-dust elephants and rugged landscapes.',
            expect: 'Off-road safaris, lava flows, remote bush camping',
            image: '/assets/images/savannah.jpg'
        },
        'Nairobi': {
            desc: 'Kenya\'s vibrant capital — where urban energy meets wildlife, culture, and incredible dining.',
            expect: 'National Park, giraffe centre, cultural markets',
            image: '/assets/images/girrafe.jpg'
        },
        'Samburu': {
            desc: 'Kenya\'s rugged northern frontier home to rare Grevy\'s zebras and reticulated giraffes.',
            expect: 'Exclusive game drives, cultural immersion, stargazing',
            image: '/assets/images/savannah.jpg'
        }
    };

    const FALLBACK = {
        desc: 'Discover the beauty and adventure that awaits in this incredible Kenyan destination.',
        expect: 'Guided tours, cultural experiences, wildlife encounters',
        image: '/assets/images/savannah.jpg'
    };

    var destMap = null;

    function renderMap(destinations) {
        var mapEl = document.getElementById('dest-map');
        if (!mapEl || typeof L === 'undefined') return;

        var coords = destinations.filter(function (d) { return d.latitude != null && d.longitude != null; });
        if (!coords.length) {
            mapEl.style.display = 'none';
            return;
        }
        mapEl.style.display = 'block';

        if (destMap) destMap.remove();

        var bounds = [];
        coords.forEach(function (d) {
            bounds.push([d.latitude, d.longitude]);
        });

        destMap = L.map(mapEl);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18, attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        }).addTo(destMap);

        coords.forEach(function (d) {
            var name = d.name || 'Destination';
            var locText = d.location_text || '';
            var popup = '<strong>' + name + '</strong>' + (locText ? '<br>' + locText : '');
            var marker = L.marker([d.latitude, d.longitude]).addTo(destMap);
            marker.bindPopup(popup);
        });

        if (bounds.length === 1) {
            destMap.setView(bounds[0], 10);
        } else {
            destMap.fitBounds(bounds, { padding: [40, 40] });
        }

        setTimeout(function () { destMap.invalidateSize(); }, 300);
    }

    async function loadDestinations() {
        let destinations = [];

        grid.innerHTML = '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>' +
            '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>' +
            '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>' +
            '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>' +
            '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>' +
            '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>' +
            '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>' +
            '<div class="dest-skeleton-card"><div class="dest-skeleton-img"></div></div>';

        try {
            const result = await api.getDestinations();
            destinations = result.destinations || result || [];
        } catch (e) {
            console.warn('API unavailable, using fallback destinations');
        }

        if (!destinations.length) {
            destinations = Object.keys(DEST_DATA).map(name => ({ name }));
        }

        destinations.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

        renderGrid(destinations);
        renderMap(destinations);
    }

    function renderGrid(destinations) {
        grid.innerHTML = '';

        destinations.forEach(dest => {
            const name = dest.name;
            const data = DEST_DATA[name] || { ...FALLBACK, desc: FALLBACK.desc };
            const img = dest.image_url || data.image || FALLBACK.image;
            const tourUrl = `/tours?search=${encodeURIComponent(name)}`;

            const card = document.createElement('div');
            card.className = 'dest-card';
            card.innerHTML = `
                <div class="dest-img-wrap">
                    <img src="${img}" alt="${name}" loading="lazy">
                </div>
                <div class="dest-desc">
                    <p>${data.desc}</p>
                </div>
                <div class="dest-label">
                    <div class="dest-label-left">
                        <span class="dest-label-name">${name}</span>
                        <span class="dest-label-location">
                            <i class="fas fa-map-marker-alt"></i> Kenya
                        </span>
                    </div>
                    <a href="${tourUrl}" class="dest-explore-btn" onclick="event.stopPropagation()">
                        Explore Tours <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            `;

            card.addEventListener('click', () => {
                window.location.href = tourUrl;
            });

            grid.appendChild(card);
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadDestinations);
    } else {
        loadDestinations();
    }
})();