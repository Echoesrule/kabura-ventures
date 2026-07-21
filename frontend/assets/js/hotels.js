
        let allHotels = [];
        let currentLocation = '';

        function getFilteredHotels() {
            const search = document.getElementById('search-location').value.toLowerCase();
            return allHotels.filter(h =>
                (currentLocation === '' || (h.location && h.location.toLowerCase() === currentLocation.toLowerCase())) &&
                ((h.location && h.location.toLowerCase().includes(search)) ||
                h.name.toLowerCase().includes(search))
            );
        }

        function buildLocationTabs() {
            const tabsContainer = document.getElementById('destination-tabs');
            const locations = [...new Set(allHotels.map(h => h.location).filter(Boolean))].sort();
            locations.forEach(loc => {
                const btn = document.createElement('button');
                btn.className = 'tab';
                btn.dataset.location = loc;
                btn.textContent = loc;
                btn.addEventListener('click', function () {
                    document.querySelectorAll('#destination-tabs .tab').forEach(t => t.classList.remove('active'));
                    btn.classList.add('active');
                    currentLocation = btn.dataset.location;
                    renderHotels(getFilteredHotels());
                });
                tabsContainer.appendChild(btn);
            });
        }

        async function loadHotels() {
            const container = document.getElementById('hotels-list');
            container.innerHTML = '<div class="spinner"></div>';

            try {
                const result = await api.getHotels({ per_page: 50 });
                allHotels = result.hotels;
                buildLocationTabs();
                renderHotels(allHotels);
            } catch (err) {
                container.innerHTML = '<div class="empty-state"><h3>Could not load hotels</h3><p>Please try again later.</p></div>';
            }
        }

        function renderHotels(hotels) {
            const container = document.getElementById('hotels-list');
            if (hotels.length === 0) {
                container.innerHTML = '<div class="empty-state"><h3>No hotels found</h3></div>';
                return;
            }

            container.innerHTML = hotels.map((hotel, index) => {
                const img = hotel.images && hotel.images.length > 0
                    ? hotel.images.find(i => i.is_primary) || hotel.images[0]
                    : null;
                const imgUrl = img ? img.image_url : '/assets/images/placeholder.svg';
                const rating = hotel.avg_rating || hotel.rating || 0;
                const amenities = Array.isArray(hotel.amenities) ? hotel.amenities.slice(0, 3) : [];
                const desc = hotel.description ? escapeHTML(hotel.description) : '';

                return `
                    <article class="hotel-stay-card" data-aos="fade-up" data-aos-delay="${(index % 3) * 65}">
                        <a href="/hotel-detail.html?id=${hotel.id}" class="hotel-stay-image" aria-label="View ${escapeHTML(hotel.name)}">
                            <img src="${imgUrl}" alt="${escapeHTML(hotel.name)}" loading="lazy" onerror="this.src='/assets/images/placeholder.svg'">
                            ${rating > 0 ? '<span class="hotel-rating">' + rating.toFixed(1) + '</span>' : ''}
                        </a>
                        <div class="hotel-stay-info">
                            <div class="hotel-stay-location">${escapeHTML(hotel.location || 'Kenya')}</div>
                            <h3>${escapeHTML(hotel.name)}</h3>
                            ${desc ? '<p>' + desc + '</p>' : '<p>A thoughtfully selected stay for a memorable Kenyan escape.</p>'}
                            ${amenities.length ? '<div class="hotel-amenities">' + amenities.map(function(a) { return '<span>' + escapeHTML(a.trim()) + '</span>'; }).join('') + '</div>' : ''}
                        </div>
                        <div class="hotel-stay-bottom">
                            <div class="hotel-stay-price"><small>From</small><strong>KSh ${Number(hotel.price_per_night || 0).toLocaleString()}</strong><span>/night</span></div>
                            <div class="hotel-stay-action">
                                <div class="hotel-btn-row">
                                    <a class="hotel-book-btn" href="/hotel-detail.html?id=${hotel.id}"><span>View stay</span></a>
                                    <a class="hotel-book-btn-arrow" href="/hotel-detail.html?id=${hotel.id}" aria-label="View stay">
                                        <img src="/assets/images/right-arrow.png" alt="" class="hotel-book-btn-arrow-img">
                                    </a>
                                </div>
                            </div>
                        </div>
                    </article>
                `;
            }).join('');

            if (window.AOS) {
                AOS.refresh();
            } else {
                setupScrollReveal();
            }
        }

        function showHotelDetails(hotelId) {
            window.location.href = '/hotel-detail.html?id=' + hotelId;
        }

        function inquireHotel(hotelId) {
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Please login to inquire about hotels', 'warning');
                openModal('login-modal');
                return;
            }
            window.location.href = `/booking.html?hotel=${hotelId}`;
        }

        document.querySelector('#destination-tabs .tab:first-child').addEventListener('click', function () {
            document.querySelectorAll('#destination-tabs .tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentLocation = '';
            renderHotels(getFilteredHotels());
        });

        document.getElementById('search-location').addEventListener('input', () => {
            renderHotels(getFilteredHotels());
        });

        loadHotels();
