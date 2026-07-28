// Admin dashboard
(async function () {
    var token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login.html'; return; }

    try {
        var me = await api.getProfile();
        if (!me.user || me.user.role !== 'admin') {
            document.querySelector('.admin-content').innerHTML =
                '<div class="admin-empty-state" style="padding:4rem;">' +
                '<h3>Access Denied</h3>' +
                '<p>You need admin privileges to view this page.</p>' +
                '<a href="/" class="admin-hero-btn" style="margin-top:1.25rem;">Go Home</a>' +
                '</div>';
            return;
        }
        var adminName = me.user.name || 'Admin';
        document.getElementById('admin-user-name').textContent = adminName;
        var initials = adminName.split(/\s+/).map(function (p) { return p[0]; }).join('').slice(0, 2).toUpperCase();
        document.getElementById('admin-user-initials').textContent = initials || 'A';
    } catch (e) {
        window.location.href = '/login.html';
        return;
    }

    var sidebarLinks = document.querySelectorAll('.admin-sidebar-link[data-section]');
    var sections = document.querySelectorAll('.admin-section');
    var sectionTitle = document.getElementById('section-title');
    var heroTitle = document.getElementById('hero-title');
    var heroDesc = document.getElementById('hero-desc');
    var sidebar = document.getElementById('admin-sidebar');
    var toggle = document.getElementById('sidebar-toggle');
    var overlay = document.getElementById('sidebar-overlay');

    function setSidebarOpen(open) {
        sidebar.classList.toggle('open', open);
        if (overlay) overlay.classList.toggle('is-open', open);
    }

    sidebarLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var target = this.getAttribute('data-section');
            var title = this.getAttribute('data-title') || this.querySelector('span').textContent;
            var desc = this.getAttribute('data-desc') || '';

            sidebarLinks.forEach(function (l) { l.classList.remove('active'); });
            this.classList.add('active');

            sections.forEach(function (s) { s.classList.remove('active'); });
            var section = document.getElementById('section-' + target);
            if (section) section.classList.add('active');

            sectionTitle.textContent = title;
            if (heroTitle) heroTitle.textContent = title;
            if (heroDesc && desc) heroDesc.textContent = desc;

            setSidebarOpen(false);
        });
    });

    toggle.addEventListener('click', function () {
        setSidebarOpen(!sidebar.classList.contains('open'));
    });

    if (overlay) {
        overlay.addEventListener('click', function () {
            setSidebarOpen(false);
        });
    }

    document.addEventListener('click', function (e) {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle && !toggle.contains(e.target)) {
            setSidebarOpen(false);
        }
    });

    function escHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str == null ? '' : String(str)));
        return div.innerHTML;
    }

    function makeTable(headers, rows) {
        var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
        headers.forEach(function (h) { html += '<th>' + h + '</th>'; });
        html += '</tr></thead><tbody>';
        if (rows.length === 0) {
            html += '<tr><td colspan="' + headers.length + '" style="text-align:center;color:var(--text-secondary);padding:2rem;">No data yet.</td></tr>';
        } else {
            rows.forEach(function (row) {
                html += '<tr>';
                row.forEach(function (cell) { html += '<td>' + cell + '</td>'; });
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        return html;
    }

    function statusBadge(status) {
        var cls = 'admin-badge--pending';
        if (status === 'confirmed') cls = 'admin-badge--confirmed';
        if (status === 'completed') cls = 'admin-badge--completed';
        return '<span class="admin-badge ' + cls + '">' + escHtml(status || 'pending') + '</span>';
    }

    // ── Bookings ────────────────────────────────────────────
    var allBookings = [];
    function bookingCustomer(b) {
        return b.guest_name || b.user_name || '—';
    }
    function bookingEmail(b) {
        return b.guest_email || b.user_email || '—';
    }
    function bookingItemName(b) {
        if (b.booking_type === 'hotel') return b.hotel_name || '—';
        if (b.booking_type === 'flight') return 'Flight';
        return b.tour_name || '—';
    }
    function bookingTypeBadge(type) {
        var cls = 'admin-badge--pending';
        if (type === 'tour') cls = 'admin-badge--completed';
        if (type === 'hotel') cls = 'admin-badge--confirmed';
        return '<span class="admin-badge ' + cls + '">' + escHtml(type || '—') + '</span>';
    }
    function renderBookingRows(bookings, limit) {
        var items = limit ? bookings.slice(0, limit) : bookings;
        var rows = items.map(function (b, idx) {
            return [
                (idx < 3 ? '<span style="background:rgba(192,57,43,0.08);display:block;padding:2px 6px;border-radius:6px;">' : '') + escHtml(bookingCustomer(b)) + (idx < 3 ? '</span>' : ''),
                bookingTypeBadge(b.booking_type),
                escHtml(bookingItemName(b)),
                escHtml(b.travel_date || '—'),
                statusBadge(b.status)
            ];
        });
        return rows;
    }
    function renderBookingsTable(container, bookings) {
        container.innerHTML = makeTable(['Customer', 'Type', 'Item', 'Date', 'Status'], renderBookingRows(bookings));
    }
    async function loadBookings(filter) {
        try {
            var endpoint = '/bookings' + (filter ? '?booking_type=' + filter : '');
            var bookings = await api.get(endpoint);
            allBookings = bookings.bookings || bookings || [];
            renderBookingsTable(document.getElementById('bookings-list'), allBookings);
        } catch (e) {
            document.getElementById('bookings-list').innerHTML = '<p class="admin-empty-state">Failed to load bookings.</p>';
        }
    }

    try {
        var bookingsResult = await api.get('/bookings');
        allBookings = bookingsResult.bookings || bookingsResult || [];
        document.getElementById('stat-bookings').textContent = allBookings.length;
        renderBookingsTable(document.getElementById('dashboard-bookings-list'), allBookings.slice(0, 10));
        renderBookingsTable(document.getElementById('bookings-list'), allBookings);

        document.querySelectorAll('.booking-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.booking-tab').forEach(function (t) { t.classList.remove('active'); t.classList.remove('admin-btn--primary'); t.classList.add('admin-btn--secondary'); });
                this.classList.add('active');
                this.classList.add('admin-btn--primary');
                this.classList.remove('admin-btn--secondary');
                loadBookings(this.getAttribute('data-type'));
            });
        });
    } catch (e) {
        document.getElementById('dashboard-bookings-list').innerHTML = '<p class="admin-empty-state">Failed to load bookings.</p>';
        document.getElementById('bookings-list').innerHTML = '<p class="admin-empty-state">Failed to load bookings.</p>';
    }

    // ── Messages ────────────────────────────────────────────
    try {
        var msgs = await api.get('/messages');
        var allMsgs = msgs.messages || msgs || [];
        var unread = allMsgs.filter(function (m) { return !m.is_read && !m.admin_reply; });
        document.getElementById('stat-messages').textContent = unread.length;

        var msgHeaders = ['From', 'Subject', 'Date', 'Status'];
        var msgRows = allMsgs.slice(0, 10).map(function (m) {
            var badge = m.admin_reply ? 'admin-badge--completed' : (m.read ? 'admin-badge--confirmed' : 'admin-badge--pending');
            var statusText = m.admin_reply ? 'Replied' : (m.read ? 'Read' : 'New');
            return [
                escHtml(m.name || m.user_name || '—'),
                escHtml(m.subject || '—'),
                escHtml(m.date || m.created_at || '—'),
                '<span class="admin-badge ' + badge + '">' + statusText + '</span>'
            ];
        });

        document.getElementById('dashboard-messages-list').innerHTML = makeTable(msgHeaders, msgRows);

        var allMsgRows = allMsgs.map(function (m) {
            var badge = m.admin_reply ? 'admin-badge--completed' : (m.read ? 'admin-badge--confirmed' : 'admin-badge--pending');
            var statusText = m.admin_reply ? 'Replied' : (m.read ? 'Read' : 'New');
            return [
                escHtml(m.name || m.user_name || '—'),
                escHtml(m.email || '—'),
                escHtml(m.subject || '—'),
                escHtml(m.date || m.created_at || '—'),
                '<span class="admin-badge ' + badge + '">' + statusText + '</span>'
            ];
        });
        document.getElementById('messages-list').innerHTML = makeTable(['From', 'Email', 'Subject', 'Date', 'Status'], allMsgRows);
    } catch (e) {
        document.getElementById('dashboard-messages-list').innerHTML = '<p class="admin-empty-state">Failed to load messages.</p>';
        document.getElementById('messages-list').innerHTML = '<p class="admin-empty-state">Failed to load messages.</p>';
    }

    // ── Tours ───────────────────────────────────────────────
    async function loadTours() {
        var container = document.getElementById('tours-list');
        try {
            var tours = await api.getTours({ per_page: 100 });
            var allTours = tours.tours || tours || [];
            document.getElementById('stat-tours').textContent = allTours.length;

            if (allTours.length === 0) {
                container.innerHTML = '<p class="admin-empty-state">No tours yet. Add one above.</p>';
                return;
            }
            var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
            html += '<th>Title</th><th>Location</th><th>Price</th><th>Duration</th><th>Featured</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            allTours.forEach(function (t) {
                html += '<tr>';
                html += '<td>' + escHtml(t.title || '—') + '</td>';
                html += '<td>' + escHtml(t.location || '—') + '</td>';
                html += '<td>KSh ' + escHtml(String(Number(t.price || 0).toLocaleString())) + '</td>';
                html += '<td>' + escHtml(String(t.duration_days || '—')) + ' days</td>';
                html += '<td><span class="admin-badge ' + (t.featured ? 'admin-badge--completed' : 'admin-badge--pending') + '">' + (t.featured ? 'Featured' : 'Normal') + '</span></td>';
                html += '<td style="white-space:nowrap;">';
                html += '<button class="admin-btn admin-btn--primary" style="padding:4px 10px;font-size:11px;margin-right:4px;" onclick="editTour(\'' + t.id + '\')">Edit</button>';
                html += '<button class="admin-btn admin-btn--danger" style="padding:4px 10px;font-size:11px;" onclick="deleteTour(\'' + t.id + '\')">Delete</button>';
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="admin-empty-state">Failed to load tours.</p>';
        }
    }

    window.deleteTour = async function (id) {
        if (!confirm('Delete this tour?')) return;
        try {
            await api.deleteTour(id);
            loadTours();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    };

    window.editTour = async function (id) {
        try {
            var result = await api.getTours({ per_page: 100 });
            var items = result.tours || [];
            var t = items.find(function (x) { return x.id === id; });
            if (!t) return alert('Tour not found');
            document.getElementById('tour-title').value = t.title || '';
            document.getElementById('tour-location').value = t.location || '';
            document.getElementById('tour-price').value = t.price || '';
            document.getElementById('tour-original-price').value = t.original_price || '';
            document.getElementById('tour-discount-pct').value = t.discount_pct || '';
            document.getElementById('tour-duration').value = t.duration_days || '';
            document.getElementById('tour-max-people').value = t.max_people || 20;
            document.getElementById('tour-activity').value = t.activity_type || '';
            document.getElementById('tour-wildlife').value = t.wildlife || '';
            document.getElementById('tour-description').value = t.description || '';
            document.getElementById('tour-featured').value = String(t.featured || false);
            document.getElementById('tour-edit-id').value = t.id;
            document.getElementById('tour-submit-btn').textContent = 'Update Tour';
            document.getElementById('tour-cancel-btn').style.display = '';
            document.getElementById('tour-title').focus();
        } catch (e) {
            alert('Failed to load tour: ' + e.message);
        }
    };

    var tourForm = document.getElementById('tour-form');
    if (tourForm) {
        tourForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var editId = document.getElementById('tour-edit-id').value;
            var formData = new FormData();
            formData.append('title', document.getElementById('tour-title').value);
            formData.append('location', document.getElementById('tour-location').value);
            formData.append('price', document.getElementById('tour-price').value);
            formData.append('original_price', document.getElementById('tour-original-price').value);
            formData.append('discount_pct', document.getElementById('tour-discount-pct').value);
            formData.append('duration_days', document.getElementById('tour-duration').value);
            formData.append('max_people', document.getElementById('tour-max-people').value || '20');
            formData.append('activity_type', document.getElementById('tour-activity').value);
            formData.append('wildlife', document.getElementById('tour-wildlife').value);
            formData.append('description', document.getElementById('tour-description').value);
            formData.append('featured', document.getElementById('tour-featured').value);
            var files = document.getElementById('tour-images').files;
            for (var i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }
            try {
                if (editId) {
                    await api.updateTour(editId, formData);
                    document.getElementById('tour-edit-id').value = '';
                    document.getElementById('tour-submit-btn').textContent = 'Add Tour';
                    document.getElementById('tour-cancel-btn').style.display = 'none';
                } else {
                    await api.createTour(formData);
                }
                tourForm.reset();
                loadTours();
            } catch (err) {
                alert('Failed: ' + err.message);
            }
        });
    }
    loadTours();

    // ── Hotels ──────────────────────────────────────────────
    async function loadHotels() {
        var container = document.getElementById('hotels-list');
        try {
            var hotelsResult = await api.getHotels({ per_page: 100 });
            var allHotels = hotelsResult.hotels || [];

            if (allHotels.length === 0) {
                container.innerHTML = '<p class="admin-empty-state">No hotels yet. Add one above.</p>';
                return;
            }
            var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
            html += '<th>Name</th><th>Location</th><th>Price/Night</th><th>Rating</th><th>Status</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            allHotels.forEach(function (h) {
                html += '<tr>';
                html += '<td>' + escHtml(h.name || '—') + '</td>';
                html += '<td>' + escHtml(h.location || '—') + '</td>';
                html += '<td>KSh ' + escHtml(String(Number(h.price_per_night || 0).toLocaleString())) + '</td>';
                html += '<td>' + escHtml(String(h.rating || '0')) + ' / 5</td>';
                html += '<td><span class="admin-badge ' + (h.available ? 'admin-badge--completed' : 'admin-badge--pending') + '">' + (h.available ? 'Active' : 'Inactive') + '</span></td>';
                html += '<td style="white-space:nowrap;">';
                html += '<button class="admin-btn admin-btn--primary" style="padding:4px 10px;font-size:11px;margin-right:4px;" onclick="editHotel(\'' + h.id + '\')">Edit</button>';
                html += '<button class="admin-btn admin-btn--danger" style="padding:4px 10px;font-size:11px;" onclick="deleteHotel(\'' + h.id + '\')">Delete</button>';
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="admin-empty-state">Failed to load hotels.</p>';
        }
    }

    window.deleteHotel = async function (id) {
        if (!confirm('Delete this hotel?')) return;
        try {
            await api.deleteHotel(id);
            loadHotels();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    };

    window.editHotel = async function (id) {
        try {
            var result = await api.getHotels({ per_page: 100 });
            var items = result.hotels || [];
            var h = items.find(function (x) { return x.id === id; });
            if (!h) return alert('Hotel not found');
            document.getElementById('hotel-name').value = h.name || '';
            document.getElementById('hotel-location').value = h.location || '';
            document.getElementById('hotel-price').value = h.price_per_night || '';
            document.getElementById('hotel-rating').value = h.rating || 0;
            document.getElementById('hotel-amenities').value = h.amenities || '';
            document.getElementById('hotel-description').value = h.description || '';
            document.getElementById('hotel-edit-id').value = h.id;
            document.getElementById('hotel-submit-btn').textContent = 'Update Hotel';
            document.getElementById('hotel-cancel-btn').style.display = '';
            document.getElementById('hotel-name').focus();
        } catch (e) {
            alert('Failed to load hotel: ' + e.message);
        }
    };

    var hotelForm = document.getElementById('hotel-form');
    if (hotelForm) {
        hotelForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var editId = document.getElementById('hotel-edit-id').value;
            var formData = new FormData();
            formData.append('name', document.getElementById('hotel-name').value);
            formData.append('location', document.getElementById('hotel-location').value);
            formData.append('price_per_night', document.getElementById('hotel-price').value);
            formData.append('rating', document.getElementById('hotel-rating').value || '0');
            formData.append('amenities', document.getElementById('hotel-amenities').value);
            formData.append('description', document.getElementById('hotel-description').value);
            var files = document.getElementById('hotel-images').files;
            for (var i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }
            try {
                if (editId) {
                    await api.updateHotel(editId, formData);
                    document.getElementById('hotel-edit-id').value = '';
                    document.getElementById('hotel-submit-btn').textContent = 'Add Hotel';
                    document.getElementById('hotel-cancel-btn').style.display = 'none';
                } else {
                    await api.createHotel(formData);
                }
                hotelForm.reset();
                loadHotels();
            } catch (err) {
                alert('Failed: ' + err.message);
            }
        });
    }
    loadHotels();

    // ── Users ───────────────────────────────────────────────
    try {
        var users = await api.get('/users');
        var allUsers = users.users || users || [];
        document.getElementById('stat-users').textContent = allUsers.length;

        var userRows = allUsers.map(function (u) {
            return [
                escHtml(u.name || '—'),
                escHtml(u.email || '—'),
                '<span class="admin-badge admin-badge--confirmed">' + escHtml(u.role || 'user') + '</span>'
            ];
        });
        document.getElementById('users-list').innerHTML = makeTable(['Name', 'Email', 'Role'], userRows);
    } catch (e) {
        document.getElementById('users-list').innerHTML = '<p class="admin-empty-state">Failed to load users.</p>';
    }

    // ── Auth Slides ──────────────────────────────────────────
    async function loadAuthSlides() {
        var container = document.getElementById('auth-slides-list');
        try {
            var result = await api.getAuthSlides();
            var slides = result.slides || [];
            if (slides.length === 0) {
                container.innerHTML = '<p class="admin-empty-state">No slides yet. Upload an image above.</p>';
                return;
            }
            var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
            html += '<th>Image</th><th>Location</th><th>Description</th><th>Order</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            slides.forEach(function (s) {
                html += '<tr>';
                html += '<td><img src="' + escHtml(s.file_url) + '" style="width:80px;height:50px;object-fit:cover;border-radius:6px;"></td>';
                html += '<td>' + escHtml(s.location) + '</td>';
                html += '<td>' + escHtml(s.description || '—') + '</td>';
                html += '<td>' + escHtml(String(s.sort_order)) + '</td>';
                html += '<td><button class="admin-btn admin-btn--danger" style="padding:4px 10px;font-size:11px;" onclick="deleteAuthSlide(\'' + s.id + '\')">Delete</button></td>';
                html += '</tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="admin-empty-state">Failed to load slides.</p>';
        }
    }

    window.deleteAuthSlide = async function (id) {
        if (!confirm('Delete this slide?')) return;
        try {
            await api.deleteAuthSlide(id);
            loadAuthSlides();
        } catch (e) {
            alert('Failed to delete slide: ' + e.message);
        }
    };

    var authSlideForm = document.getElementById('auth-slide-form');
    if (authSlideForm) {
        authSlideForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var formData = new FormData(authSlideForm);
            try {
                await api.createAuthSlide(formData);
                authSlideForm.reset();
                loadAuthSlides();
            } catch (err) {
                alert('Upload failed: ' + err.message);
            }
        });
    }

    loadAuthSlides();

    // ── Locations (Thrilling Locations) ───────────────────────────
    async function loadLocations() {
        var container = document.getElementById('locations-list');
        try {
            var result = await api.getAllDestinationsAdmin();
            var items = result.destinations || [];
            if (items.length === 0) {
                container.innerHTML = '<p class="admin-empty-state">No locations yet. Add one above.</p>';
                return;
            }
            var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
            html += '<th>Image</th><th>Name</th><th>Location</th><th>Description</th><th>Order</th><th>Status</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            items.forEach(function (d) {
                html += '<tr>';
                html += '<td><img src="' + escHtml(d.image_url) + '" style="width:80px;height:50px;object-fit:cover;border-radius:6px;"></td>';
                html += '<td>' + escHtml(d.name) + '</td>';
                html += '<td>' + escHtml(d.location_text || '—') + '</td>';
                html += '<td>' + escHtml((d.description || '—').substring(0, 80)) + '</td>';
                html += '<td>' + escHtml(String(d.sort_order)) + '</td>';
                html += '<td><span class="admin-badge ' + (d.is_active ? 'admin-badge--completed' : 'admin-badge--pending') + '">' + (d.is_active ? 'Active' : 'Hidden') + '</span></td>';
                html += '<td style="white-space:nowrap;">';
                html += '<button class="admin-btn admin-btn--primary" style="padding:4px 10px;font-size:11px;margin-right:4px;" onclick="editLocation(\'' + d.id + '\')">Edit</button>';
                html += '<button class="admin-btn admin-btn--danger" style="padding:4px 10px;font-size:11px;" onclick="deleteLocation(\'' + d.id + '\')">Delete</button>';
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="admin-empty-state">Failed to load locations.</p>';
        }
    }

    window.deleteLocation = async function (id) {
        if (!confirm('Delete this location?')) return;
        try {
            await api.deleteDestination(id);
            loadLocations();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    };

    window.editLocation = async function (id) {
        try {
            var result = await api.getAllDestinationsAdmin();
            var items = result.destinations || [];
            var item = items.find(function (d) { return d.id === id; });
            if (!item) return alert('Location not found');
            document.getElementById('loc-name').value = item.name || '';
            document.getElementById('loc-location-text').value = item.location_text || '';
            document.getElementById('loc-desc').value = item.description || '';
            document.getElementById('loc-link').value = item.link_url || '';
            document.getElementById('loc-sort').value = item.sort_order || 0;
            document.getElementById('loc-edit-id').value = item.id;
            document.getElementById('loc-submit-btn').textContent = 'Update Location';
            document.getElementById('loc-name').focus();
        } catch (e) {
            alert('Failed to load location: ' + e.message);
        }
    };

    var locationForm = document.getElementById('location-form');
    if (locationForm) {
        locationForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var editId = document.getElementById('loc-edit-id').value;
            var formData = new FormData(locationForm);
            try {
                if (editId) {
                    await api.updateDestination(editId, formData);
                    document.getElementById('loc-edit-id').value = '';
                    document.getElementById('loc-submit-btn').textContent = 'Add Location';
                } else {
                    await api.createDestination(formData);
                }
                locationForm.reset();
                loadLocations();
            } catch (err) {
                alert('Failed: ' + err.message);
            }
        });
    }
    loadLocations();

    // ── Offers (What We Offer) ───────────────────────────────────
    async function loadOffers() {
        var container = document.getElementById('offers-list');
        try {
            var result = await api.getAllOffersAdmin();
            var items = result.offers || [];
            if (items.length === 0) {
                container.innerHTML = '<p class="admin-empty-state">No offers yet. Add one above.</p>';
                return;
            }
            var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
            html += '<th>Image</th><th>Title</th><th>Description</th><th>Link</th><th>Order</th><th>Status</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            items.forEach(function (o) {
                html += '<tr>';
                html += '<td>' + (o.image_url ? '<img src="' + escHtml(o.image_url) + '" style="width:80px;height:50px;object-fit:cover;border-radius:6px;">' : '—') + '</td>';
                html += '<td>' + escHtml(o.title) + '</td>';
                html += '<td>' + escHtml((o.description || '—').substring(0, 80)) + '</td>';
                html += '<td>' + escHtml(o.link_url || '—') + '</td>';
                html += '<td>' + escHtml(String(o.sort_order)) + '</td>';
                html += '<td><span class="admin-badge ' + (o.is_active ? 'admin-badge--completed' : 'admin-badge--pending') + '">' + (o.is_active ? 'Active' : 'Hidden') + '</span></td>';
                html += '<td style="white-space:nowrap;">';
                html += '<button class="admin-btn admin-btn--primary" style="padding:4px 10px;font-size:11px;margin-right:4px;" onclick="editOffer(\'' + o.id + '\')">Edit</button>';
                html += '<button class="admin-btn admin-btn--danger" style="padding:4px 10px;font-size:11px;" onclick="deleteOffer(\'' + o.id + '\')">Delete</button>';
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="admin-empty-state">Failed to load offers.</p>';
        }
    }

    window.deleteOffer = async function (id) {
        if (!confirm('Delete this offer?')) return;
        try {
            await api.deleteOffer(id);
            loadOffers();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    };

    window.editOffer = async function (id) {
        try {
            var result = await api.getAllOffersAdmin();
            var items = result.offers || [];
            var item = items.find(function (o) { return o.id === id; });
            if (!item) return alert('Offer not found');
            document.getElementById('off-title').value = item.title || '';
            document.getElementById('off-desc').value = item.description || '';
            document.getElementById('off-link').value = item.link_url || '';
            document.getElementById('off-sort').value = item.sort_order || 0;
            document.getElementById('off-edit-id').value = item.id;
            document.getElementById('off-submit-btn').textContent = 'Update Offer';
            document.getElementById('off-title').focus();
        } catch (e) {
            alert('Failed to load offer: ' + e.message);
        }
    };

    var offerForm = document.getElementById('offer-form');
    if (offerForm) {
        offerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var editId = document.getElementById('off-edit-id').value;
            var formData = new FormData(offerForm);
            try {
                if (editId) {
                    await api.updateOffer(editId, formData);
                    document.getElementById('off-edit-id').value = '';
                    document.getElementById('off-submit-btn').textContent = 'Add Offer';
                } else {
                    await api.createOffer(formData);
                }
                offerForm.reset();
                loadOffers();
            } catch (err) {
                alert('Failed: ' + err.message);
            }
        });
    }
    loadOffers();

    // ── Testimonials ─────────────────────────────────────────────
    async function loadTestimonialsAdmin() {
        var container = document.getElementById('testimonials-list');
        try {
            var result = await api.getAllTestimonialsAdmin();
            var items = result.testimonials || [];
            if (items.length === 0) {
                container.innerHTML = '<p class="admin-empty-state">No testimonials yet. Add one above.</p>';
                return;
            }
            var html = '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>';
            html += '<th>Initials</th><th>Name</th><th>Location</th><th>Text</th><th>Rating</th><th>Order</th><th>Status</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            items.forEach(function (t) {
                var stars = '';
                for (var i = 0; i < (t.rating || 5); i++) stars += '★';
                html += '<tr>';
                html += '<td><span class="admin-topbar-avatar" style="width:32px;height:32px;font-size:12px;">' + escHtml(t.initials) + '</span></td>';
                html += '<td>' + escHtml(t.name) + '</td>';
                html += '<td>' + escHtml(t.location || '—') + '</td>';
                html += '<td>' + escHtml((t.text || '').substring(0, 80)) + '...</td>';
                html += '<td style="color:#f5a623;">' + stars + '</td>';
                html += '<td>' + escHtml(String(t.sort_order)) + '</td>';
                html += '<td><span class="admin-badge ' + (t.is_active ? 'admin-badge--completed' : 'admin-badge--pending') + '">' + (t.is_active ? 'Active' : 'Hidden') + '</span></td>';
                html += '<td style="white-space:nowrap;">';
                html += '<button class="admin-btn admin-btn--primary" style="padding:4px 10px;font-size:11px;margin-right:4px;" onclick="editTestimonial(\'' + t.id + '\')">Edit</button>';
                html += '<button class="admin-btn admin-btn--danger" style="padding:4px 10px;font-size:11px;" onclick="deleteTestimonial(\'' + t.id + '\')">Delete</button>';
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="admin-empty-state">Failed to load testimonials.</p>';
        }
    }

    window.deleteTestimonial = async function (id) {
        if (!confirm('Delete this testimonial?')) return;
        try {
            await api.deleteTestimonial(id);
            loadTestimonialsAdmin();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    };

    window.editTestimonial = async function (id) {
        try {
            var result = await api.getAllTestimonialsAdmin();
            var items = result.testimonials || [];
            var item = items.find(function (t) { return t.id === id; });
            if (!item) return alert('Testimonial not found');
            document.getElementById('test-name').value = item.name || '';
            document.getElementById('test-location').value = item.location || '';
            document.getElementById('test-text').value = item.text || '';
            document.getElementById('test-rating').value = item.rating || 5;
            document.getElementById('test-sort').value = item.sort_order || 0;
            document.getElementById('test-edit-id').value = item.id;
            document.getElementById('test-submit-btn').textContent = 'Update Testimonial';
            document.getElementById('test-name').focus();
        } catch (e) {
            alert('Failed to load testimonial: ' + e.message);
        }
    };

    var testimonialForm = document.getElementById('testimonial-form');
    if (testimonialForm) {
        testimonialForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var editId = document.getElementById('test-edit-id').value;
            var data = {
                name: document.getElementById('test-name').value,
                location: document.getElementById('test-location').value,
                text: document.getElementById('test-text').value,
                rating: parseInt(document.getElementById('test-rating').value),
                sort_order: parseInt(document.getElementById('test-sort').value) || 0
            };
            try {
                if (editId) {
                    await api.updateTestimonial(editId, data);
                    document.getElementById('test-edit-id').value = '';
                    document.getElementById('test-submit-btn').textContent = 'Add Testimonial';
                } else {
                    await api.createTestimonial(data);
                }
                testimonialForm.reset();
                loadTestimonialsAdmin();
            } catch (err) {
                alert('Failed: ' + err.message);
            }
        });
    }
    loadTestimonialsAdmin();

    // ── Page Content (Homepage Sections) ──────────────────────────
    var PAGE_SECTIONS = [
        { key: 'hero', label: 'Hero Section', fields: ['title', 'subtitle', 'heading', 'description', 'cta_text', 'cta_url'] },
        { key: 'featured_locations', label: 'Thrilling Locations Header', fields: ['title'] },
        { key: 'what_we_offer', label: 'What We Offer Header', fields: ['title', 'subtitle'] },
        { key: 'kabura_venture', label: 'In Your Kabura Adventure', fields: ['grey_heading', 'heading', 'description', 'cta_text', 'cta_url'] },
        { key: 'enjoy_safari', label: 'Enjoy Every Safari', fields: ['grey_heading', 'heading', 'description', 'cta_text', 'cta_url'] },
        { key: 'about_us', label: 'About Us', fields: ['heading', 'description', 'stat1_number', 'stat1_label', 'stat2_number', 'stat2_label', 'stat3_number', 'stat3_label'] },
        { key: 'fly_with_us', label: 'Fly With Us', fields: ['grey_heading', 'heading', 'description', 'cta_text', 'cta_url'] },
        { key: 'testimonials', label: 'Testimonials Section Header', fields: ['title', 'subtitle', 'cta_text', 'cta_url'] },
    ];

    function renderPageContentForms(sections) {
        var container = document.getElementById('page-content-forms');
        var html = '';
        PAGE_SECTIONS.forEach(function (sec) {
            var data = sections[sec.key] || {};
            html += '<div class="admin-page-section-card">';
            html += '<h3 class="admin-page-section-title">' + sec.label + '</h3>';
            html += '<form class="page-section-form" data-key="' + sec.key + '" style="display:flex;flex-wrap:wrap;gap:0.75rem;align-items:flex-end;">';
            sec.fields.forEach(function (f) {
                var val = data[f] || '';
                var isNum = f.indexOf('number') !== -1;
                var isLong = f === 'description';
                var label = f.replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
                if (isNum) {
                    html += '<div style="flex:0;min-width:120px;">';
                    html += '<label class="admin-label">' + label + '</label>';
                    html += '<input type="number" name="' + f + '" value="' + escHtml(String(val)) + '" class="admin-input" style="width:120px;">';
                    html += '</div>';
                } else if (isLong) {
                    html += '<div style="flex:3;min-width:300px;">';
                    html += '<label class="admin-label">' + label + '</label>';
                    html += '<textarea name="' + f + '" class="admin-input admin-textarea" rows="3">' + escHtml(val) + '</textarea>';
                    html += '</div>';
                } else {
                    html += '<div style="flex:1;min-width:180px;">';
                    html += '<label class="admin-label">' + label + '</label>';
                    html += '<input type="text" name="' + f + '" value="' + escHtml(val) + '" class="admin-input">';
                    html += '</div>';
                }
            });
            html += '<div><button type="submit" class="admin-btn admin-btn--primary">Save</button></div>';
            html += '</form></div>';
        });
        container.innerHTML = html;

        document.querySelectorAll('.page-section-form').forEach(function (form) {
            form.addEventListener('submit', async function (e) {
                e.preventDefault();
                var key = this.getAttribute('data-key');
                var data = { section_key: key };
                var inputs = this.querySelectorAll('input, textarea, select');
                inputs.forEach(function (input) {
                    var name = input.getAttribute('name');
                    if (!name) return;
                    if (input.type === 'number') {
                        data[name] = input.value !== '' ? parseInt(input.value) : null;
                    } else {
                        data[name] = input.value;
                    }
                });
                try {
                    await api.saveSection(data);
                    var btn = form.querySelector('button[type="submit"]');
                    btn.textContent = 'Saved!';
                    setTimeout(function () { btn.textContent = 'Save'; }, 1500);
                } catch (err) {
                    alert('Failed to save: ' + err.message);
                }
            });
        });
    }

    async function loadPageContent() {
        try {
            var result = await api.getPageContent();
            renderPageContentForms(result.sections || {});
        } catch (e) {
            document.getElementById('page-content-forms').innerHTML = '<p class="admin-empty-state">Failed to load page content.</p>';
        }
    }
    loadPageContent();
})();
