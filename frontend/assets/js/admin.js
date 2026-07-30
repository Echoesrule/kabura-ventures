// Admin dashboard
(async function () {
    var token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login'; return; }

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
        window.location.href = '/login';
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

    function searchAbort() {
        var c = new AbortController();
        setTimeout(function () { c.abort(); }, 5000);
        return c;
    }

    async function searchLocation(q) {
        q = (q || '').trim();
        if (q.length < 3) return [];
        try {
            var c = searchAbort();
            var r = await fetch('https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=jsonv2&limit=6&addressdetails=1', { signal: c.signal });
            if (!r.ok) return [];
            var data = await r.json();
            if (!Array.isArray(data)) return [];
            return data.map(function (item) {
                var addr = item.address || {};
                return {
                    display_name: item.display_name || '',
                    lat: parseFloat(item.lat),
                    lon: parseFloat(item.lon),
                    place_id: item.place_id,
                    osm_type: item.osm_type,
                    osm_id: item.osm_id,
                    type: item.type,
                    category: item.category,
                    county: addr.county || addr.state_district || '',
                    state: addr.state || '',
                    country: addr.country || '',
                    country_code: addr.country_code || '',
                    city: addr.city || addr.town || addr.village || ''
                };
            });
        } catch (e) {
            return [];
        }
    }

    async function reverseGeocode(lat, lon) {
        try {
            var c = searchAbort();
            var r = await fetch('https://nominatim.openstreetmap.org/reverse?lat=' + lat + '&lon=' + lon + '&format=jsonv2&addressdetails=1', { signal: c.signal });
            if (!r.ok) return null;
            var data = await r.json();
            if (!data || data.error) return null;
            var addr = data.address || {};
            return {
                display_name: data.display_name || '',
                lat: parseFloat(data.lat),
                lon: parseFloat(data.lon),
                place_id: data.place_id,
                osm_type: data.osm_type,
                county: addr.county || addr.state_district || '',
                state: addr.state || '',
                country: addr.country || '',
                country_code: addr.country_code || '',
                city: addr.city || addr.town || addr.village || ''
            };
        } catch (e) {
            return null;
        }
    }

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
    var allMsgs = [];
    function msgStatusBadge(m) {
        var cls = m.admin_reply ? 'admin-badge--completed' : (m.is_read ? 'admin-badge--confirmed' : 'admin-badge--pending');
        var text = m.admin_reply ? 'Replied' : (m.is_read ? 'Read' : 'New');
        return '<span class="admin-badge ' + cls + '">' + text + '</span>';
    }
    function renderMsgRows(msgs, limit) {
        var items = limit ? msgs.slice(0, limit) : msgs;
        return items.map(function (m) {
            return [
                escHtml(m.name || '—'),
                escHtml(m.subject || '—'),
                escHtml(m.date || m.created_at || '—'),
                msgStatusBadge(m),
                '<button class="admin-btn admin-btn--primary" style="padding:4px 10px;font-size:11px;" onclick="openReplyModal(\'' + m.id + '\',\'' + escHtml(m.name || '') + '\',\'' + escHtml((m.message || '').replace(/'/g, "\\'").substring(0, 200)) + '\')">Reply</button>'
            ];
        });
    }
    function renderMsgTable(container, msgs) {
        container.innerHTML = makeTable(['From', 'Subject', 'Date', 'Status', 'Actions'], renderMsgRows(msgs));
    }
    async function loadMessages() {
        try {
            var msgs = await api.get('/messages');
            allMsgs = msgs.messages || msgs || [];
            var unread = allMsgs.filter(function (m) { return !m.is_read && !m.admin_reply; });
            document.getElementById('stat-messages').textContent = unread.length;
            renderMsgTable(document.getElementById('dashboard-messages-list'), allMsgs.slice(0, 10));
            renderMsgTable(document.getElementById('messages-list'), allMsgs);
        } catch (e) {
            document.getElementById('dashboard-messages-list').innerHTML = '<p class="admin-empty-state">Failed to load messages.</p>';
            document.getElementById('messages-list').innerHTML = '<p class="admin-empty-state">Failed to load messages.</p>';
        }
    }

    window.openReplyModal = function (id, name, msgPreview) {
        document.getElementById('reply-msg-id').value = id;
        document.getElementById('reply-to-name').textContent = name || 'User';
        document.getElementById('reply-original-msg').textContent = msgPreview || '';
        document.getElementById('reply-text').value = '';
        document.getElementById('reply-modal').style.display = '';
        document.getElementById('reply-text').focus();
    };

    window.sendAdminReply = async function () {
        var id = document.getElementById('reply-msg-id').value;
        var text = document.getElementById('reply-text').value.trim();
        if (!text) { alert('Please type a reply.'); return; }
        var btn = document.getElementById('reply-send-btn');
        btn.disabled = true;
        btn.textContent = 'Sending...';
        try {
            await api.replyToMessage(id, { admin_reply: text });
            document.getElementById('reply-modal').style.display = 'none';
            loadMessages();
        } catch (e) {
            alert('Failed to send reply: ' + e.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Send Reply';
        }
    };

    loadMessages();

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

    function calcDiscount() {
        var price = parseFloat(document.getElementById('tour-price').value) || 0;
        var orig = parseFloat(document.getElementById('tour-original-price').value) || 0;
        if (orig > 0 && price > 0 && orig > price) {
            var pct = Math.round((1 - price / orig) * 100);
            document.getElementById('tour-discount-pct').value = Math.min(pct, 90);
        } else {
            document.getElementById('tour-discount-pct').value = '';
        }
    }
    document.getElementById('tour-price').addEventListener('input', calcDiscount);
    document.getElementById('tour-original-price').addEventListener('input', calcDiscount);

    var itineraryCounter = {};

    function makeActivityHTML(day, idx, data) {
        data = data || {};
        var title = (data.title || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        var startTime = (data.start_time || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        var activity = (data.activity || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        var desc = (data.description || '').replace(/</g, '&lt;');
        return '<div class="itinerary-activity" id="act-' + day + '-' + idx + '" style="background:rgba(255,255,255,0.7);border:1px solid var(--border-light);border-radius:10px;padding:0.85rem;margin-bottom:0.6rem;">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5rem;">'
            + '<span style="font-size:0.72rem;font-weight:700;color:var(--text-placeholder);text-transform:uppercase;letter-spacing:0.05em;">Activity ' + (idx + 1) + '</span>'
            + (idx > 0 ? '<button type="button" onclick="removeActivity(' + day + ',' + idx + ')" style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.78rem;padding:0;line-height:1;">Remove</button>' : '')
            + '</div>'
            + '<label class="admin-label" style="font-size:0.72rem;margin-bottom:0.2rem;">Title</label>'
            + '<input id="act-' + day + '-' + idx + '-title" class="admin-input" style="font-size:0.82rem;margin-bottom:0.4rem;" placeholder="e.g. History & Culture" value="' + title + '">'
            + '<div style="display:flex;gap:0.5rem;margin-bottom:0.4rem;">'
            + '<div style="flex:1;"><label class="admin-label" style="font-size:0.72rem;margin-bottom:0.2rem;">Start Time</label><input id="act-' + day + '-' + idx + '-time" class="admin-input" style="font-size:0.82rem;" type="time" value="' + startTime + '"></div>'
            + '<div style="flex:1;"><label class="admin-label" style="font-size:0.72rem;margin-bottom:0.2rem;">Activity</label><input id="act-' + day + '-' + idx + '-activity" class="admin-input" style="font-size:0.82rem;" placeholder="e.g. Hotel Pickup" value="' + activity + '"></div>'
            + '</div>'
            + '<label class="admin-label" style="font-size:0.72rem;margin-bottom:0.2rem;">Description</label>'
            + '<textarea id="act-' + day + '-' + idx + '-desc" class="admin-input admin-textarea" rows="2" style="font-size:0.82rem;">' + desc + '</textarea>'
            + '</div>';
    }

    function addActivity(day) {
        if (!itineraryCounter[day]) itineraryCounter[day] = 0;
        itineraryCounter[day]++;
        var idx = itineraryCounter[day];
        var container = document.getElementById('day-activities-' + day);
        var div = document.createElement('div');
        div.innerHTML = makeActivityHTML(day, idx, {});
        container.insertBefore(div.firstElementChild, container.lastElementChild);
    }

    window.removeActivity = function (day, idx) {
        var el = document.getElementById('act-' + day + '-' + idx);
        if (el) el.remove();
    };

    function buildTourItinerary() {
        var days = parseInt(document.getElementById('tour-duration').value) || 0;
        var container = document.getElementById('tour-itinerary-days');
        var section = document.getElementById('tour-itinerary-section');
        if (days < 1) { section.style.display = 'none'; return; }
        section.style.display = 'block';
        itineraryCounter = {};
        var savedData = {};
        container.querySelectorAll('input, textarea').forEach(function(el) {
            var match = el.id && el.id.match(/^act-(\d+)-(\d+)-(title|time|activity|desc)$/);
            if (match) {
                if (!savedData[match[1]]) savedData[match[1]] = {};
                if (!savedData[match[1]][match[2]]) savedData[match[1]][match[2]] = {};
                savedData[match[1]][match[2]][match[3]] = el.value;
            }
        });
        var html = '';
        for (var d = 1; d <= days; d++) {
            var dayActs = savedData[d] || { 0: {} };
            var maxIdx = Object.keys(dayActs).reduce(function(a, b) { return Math.max(a, parseInt(b)); }, 0);
            itineraryCounter[d] = maxIdx;
            html += '<div class="itinerary-day-card" style="margin-bottom:1rem;padding:1.25rem;background:var(--soft-white);border-radius:12px;border:1px solid var(--border-light);">'
                + '<label style="font-weight:700;font-size:0.8rem;color:var(--dark-text);display:block;margin-bottom:0.75rem;text-transform:uppercase;letter-spacing:0.08em;">DAY ' + d + '</label>'
                + '<div id="day-activities-' + d + '">';
            Object.keys(dayActs).forEach(function(idx) {
                html += makeActivityHTML(d, parseInt(idx), dayActs[idx]);
            });
            html += '</div>'
                + '<button type="button" onclick="addActivity(' + d + ')" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.45rem 1rem;border-radius:8px;background:rgba(18,34,24,0.06);border:1px dashed rgba(18,34,24,0.15);color:var(--dark-text);font-size:0.8rem;font-weight:600;cursor:pointer;transition:background 0.2s;margin-top:0.25rem;" onmouseover="this.style.background=\'rgba(18,34,24,0.1)\'" onmouseout="this.style.background=\'rgba(18,34,24,0.06)\'">+ Add Activity</button>'
                + '</div>';
        }
        container.innerHTML = html;
    }

    function hideTourItinerary() {
        document.getElementById('tour-itinerary-section').style.display = 'none';
        document.getElementById('tour-itinerary-days').innerHTML = '';
    }
    document.getElementById('tour-duration').addEventListener('change', buildTourItinerary);

    function showTourFormMsg(msg, isError) {
        var el = document.getElementById('tour-form-msg');
        if (!msg) { el.style.display = 'none'; return; }
        el.style.display = 'block';
        el.style.padding = '0.75rem 1rem';
        el.style.borderRadius = '8px';
        el.style.background = isError ? '#fef2f2' : '#ecfdf5';
        el.style.color = isError ? '#b91c1c' : '#065f46';
        el.style.fontSize = '0.9rem';
        el.style.fontWeight = '500';
        el.textContent = msg;
    }

    // ── Tour Location Picker ─────────────────────────────────
    var tourLocMap = null;
    var tourLocMarker = null;
    var tourGeocache = {};
    var tourSearchTimeout = null;
    var tourMeetingTimeout = null;

    function showTourPreview(result) {
        var shortName = (result.display_name || '').split(',')[0] || result.display_name || '';
        document.getElementById('tour-location-name').value = shortName;
        document.getElementById('tour-formatted-address').value = result.display_name || '';
        document.getElementById('tour-county').value = result.county || '';
        document.getElementById('tour-country').value = result.country || '';
        document.getElementById('tour-place-id').value = result.place_id || '';
        document.getElementById('tour-location').value = shortName;
        document.getElementById('tour-lat').value = result.lat;
        document.getElementById('tour-lng').value = result.lon;

        document.getElementById('tour-preview-name').textContent = shortName;
        document.getElementById('tour-preview-address').textContent = result.display_name || '';
        document.getElementById('tour-preview-county').textContent = result.county ? 'County: ' + result.county : '';
        document.getElementById('tour-preview-country').textContent = result.country ? 'Country: ' + result.country : '';
        document.getElementById('tour-preview-lat').textContent = result.lat;
        document.getElementById('tour-preview-lng').textContent = result.lon;

        var preview = document.getElementById('tour-location-preview');
        preview.style.display = 'block';

        var mapContainer = document.getElementById('tour-loc-map');
        if (tourLocMap) tourLocMap.remove();
        tourLocMap = L.map(mapContainer, { zoomControl: true }).setView([result.lat, result.lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18, attribution: '&copy; OpenStreetMap'
        }).addTo(tourLocMap);
        tourLocMarker = L.marker([result.lat, result.lon], { draggable: true }).addTo(tourLocMap);
        tourLocMarker.bindPopup('<b>' + escHtml(document.getElementById('tour-title').value || 'Tour') + '</b>');
        tourLocMarker.on('dragend', async function () {
            var pos = tourLocMarker.getLatLng();
            document.getElementById('tour-lat').value = pos.lat;
            document.getElementById('tour-lng').value = pos.lng;
            document.getElementById('tour-preview-lat').textContent = pos.lat.toFixed(6);
            document.getElementById('tour-preview-lng').textContent = pos.lng.toFixed(6);
            try {
                var rev = await reverseGeocode(pos.lat, pos.lng);
                if (rev && rev.display_name) {
                    var short = (rev.display_name || '').split(',')[0] || rev.display_name || '';
                    document.getElementById('tour-location-name').value = short;
                    document.getElementById('tour-formatted-address').value = rev.display_name || '';
                    document.getElementById('tour-county').value = rev.county || '';
                    document.getElementById('tour-country').value = rev.country || '';
                    document.getElementById('tour-place-id').value = rev.place_id || '';
                    document.getElementById('tour-location').value = short;
                    document.getElementById('tour-preview-name').textContent = short;
                    document.getElementById('tour-preview-address').textContent = rev.display_name || '';
                    document.getElementById('tour-preview-county').textContent = rev.county ? 'County: ' + rev.county : '';
                    document.getElementById('tour-preview-country').textContent = rev.country ? 'Country: ' + rev.country : '';
                }
            } catch (e) {}
        });
        setTimeout(function () { tourLocMap.invalidateSize(); }, 300);
    }

    function clearTourLocation() {
        document.getElementById('tour-location-search').value = '';
        document.getElementById('tour-location').value = '';
        document.getElementById('tour-location-name').value = '';
        document.getElementById('tour-formatted-address').value = '';
        document.getElementById('tour-county').value = '';
        document.getElementById('tour-country').value = '';
        document.getElementById('tour-place-id').value = '';
        document.getElementById('tour-lat').value = '';
        document.getElementById('tour-lng').value = '';
        document.getElementById('tour-location-preview').style.display = 'none';
        if (tourLocMap) { tourLocMap.remove(); tourLocMap = null; tourLocMarker = null; }
    }

    document.getElementById('tour-location-clear')?.addEventListener('click', clearTourLocation);

    var tourSearchInput = document.getElementById('tour-location-search');
    var tourSuggestions = document.getElementById('tour-location-suggestions');

    tourSearchInput?.addEventListener('input', function () {
        var q = this.value.trim();
        if (q.length < 3) { tourSuggestions.style.display = 'none'; return; }
        clearTimeout(tourSearchTimeout);
        if (tourGeocache[q]) {
            showTourSuggestions(tourGeocache[q]);
            return;
        }
        tourSearchTimeout = setTimeout(async function () {
            tourSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--text-secondary);font-size:0.82rem;">Searching...</div>';
            tourSuggestions.style.display = 'block';
            try {
                var results = await searchLocation(q);
                tourGeocache[q] = results;
                showTourSuggestions(results);
            } catch (e) {
                tourSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--error);font-size:0.82rem;">Search failed.</div>';
            }
        }, 300);
    });

    function showTourSuggestions(results) {
        if (results.length === 0) {
            tourSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--text-secondary);font-size:0.82rem;">No results found.</div>';
            return;
        }
        tourSuggestions.innerHTML = results.map(function (r) {
            var icon = '📍';
            if (r.type === 'city' || r.type === 'town') icon = '🏙️';
            else if (r.type === 'country') icon = '🌍';
            else if (r.category === 'natural') icon = '🏔️';
            return '<div class="location-suggestion" data-result=\'' + JSON.stringify(r).replace(/'/g, '&#39;') + '\' style="padding:0.6rem 0.75rem;cursor:pointer;display:flex;align-items:flex-start;gap:0.5rem;border-bottom:1px solid #f0f0f0;transition:background 0.15s;" onmouseover="this.style.background=\'#f5f7f5\'" onmouseout="this.style.background=\'\'">'
                + '<span style="font-size:1rem;line-height:1.3;">' + icon + '</span>'
                + '<div style="flex:1;min-width:0;">'
                + '<div style="font-size:0.85rem;font-weight:600;color:var(--dark-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(r.display_name?.split(',')[0] || '') + '</div>'
                + '<div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(r.display_name || '') + '</div>'
                + (r.county || r.country ? '<div style="font-size:0.7rem;color:var(--text-placeholder);margin-top:0.15rem;">' + [r.county, r.country].filter(Boolean).join(', ') + '</div>' : '')
                + '</div>'
                + '</div>';
        }).join('');
        tourSuggestions.querySelectorAll('.location-suggestion').forEach(function (el) {
            el.addEventListener('click', function () {
                var result = JSON.parse(this.getAttribute('data-result'));
                tourSuggestions.style.display = 'none';
                tourSearchInput.value = result.display_name?.split(',')[0] || result.display_name || '';
                showTourPreview(result);
            });
        });
    }

    document.addEventListener('click', function (e) {
        if (tourSuggestions && !e.target.closest('#tour-location-search') && !e.target.closest('#tour-location-suggestions')) {
            tourSuggestions.style.display = 'none';
        }
    });

    // ── Meeting Point Picker ─────────────────────────────────
    function showMeetingPreview(result) {
        var shortName = (result.display_name || '').split(',')[0] || result.display_name || '';
        document.getElementById('tour-meeting-point-name').value = shortName;
        document.getElementById('tour-meeting-address').value = result.display_name || '';
        document.getElementById('tour-meeting-lat').value = result.lat;
        document.getElementById('tour-meeting-lng').value = result.lon;
        document.getElementById('tour-meeting-place-id').value = result.place_id || '';

        document.getElementById('tour-meeting-preview-name').textContent = shortName;
        document.getElementById('tour-meeting-preview-address').textContent = result.display_name || '';
        document.getElementById('tour-meeting-preview').style.display = 'block';
    }

    function clearMeetingPoint() {
        document.getElementById('tour-meeting-search').value = '';
        document.getElementById('tour-meeting-point-name').value = '';
        document.getElementById('tour-meeting-address').value = '';
        document.getElementById('tour-meeting-lat').value = '';
        document.getElementById('tour-meeting-lng').value = '';
        document.getElementById('tour-meeting-place-id').value = '';
        document.getElementById('tour-meeting-preview').style.display = 'none';
    }

    document.getElementById('tour-meeting-clear')?.addEventListener('click', clearMeetingPoint);

    var meetingSearchInput = document.getElementById('tour-meeting-search');
    var meetingSuggestions = document.getElementById('tour-meeting-suggestions');

    meetingSearchInput?.addEventListener('input', function () {
        var q = this.value.trim();
        if (q.length < 3) { meetingSuggestions.style.display = 'none'; return; }
        clearTimeout(tourMeetingTimeout);
        tourMeetingTimeout = setTimeout(async function () {
            meetingSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--text-secondary);font-size:0.82rem;">Searching...</div>';
            meetingSuggestions.style.display = 'block';
            try {
                var results = await searchLocation(q);
                if (results.length === 0) {
                    meetingSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--text-secondary);font-size:0.82rem;">No results found.</div>';
                    return;
                }
                meetingSuggestions.innerHTML = results.map(function (r) {
                    return '<div class="meeting-suggestion" data-result=\'' + JSON.stringify(r).replace(/'/g, '&#39;') + '\' style="padding:0.55rem 0.75rem;cursor:pointer;display:flex;align-items:flex-start;gap:0.5rem;border-bottom:1px solid #f0f0f0;transition:background 0.15s;" onmouseover="this.style.background=\'#f5f7f5\'" onmouseout="this.style.background=\'\'">'
                        + '<span style="font-size:0.9rem;line-height:1.3;">📍</span>'
                        + '<div style="flex:1;min-width:0;">'
                        + '<div style="font-size:0.82rem;font-weight:600;color:var(--dark-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(r.display_name?.split(',')[0] || '') + '</div>'
                        + '<div style="font-size:0.72rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(r.display_name || '') + '</div>'
                        + '</div>'
                        + '</div>';
                }).join('');
                meetingSuggestions.querySelectorAll('.meeting-suggestion').forEach(function (el) {
                    el.addEventListener('click', function () {
                        var result = JSON.parse(this.getAttribute('data-result'));
                        meetingSuggestions.style.display = 'none';
                        meetingSearchInput.value = result.display_name?.split(',')[0] || result.display_name || '';
                        showMeetingPreview(result);
                    });
                });
            } catch (e) {
                meetingSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--error);font-size:0.82rem;">Search failed.</div>';
            }
        }, 300);
    });

    document.addEventListener('click', function (e) {
        if (meetingSuggestions && !e.target.closest('#tour-meeting-search') && !e.target.closest('#tour-meeting-suggestions')) {
            meetingSuggestions.style.display = 'none';
        }
    });

    window.editTour = async function (id) {
        try {
            var result = await api.getTours({ per_page: 100 });
            var items = result.tours || [];
            var t = items.find(function (x) { return x.id === id; });
            if (!t) return alert('Tour not found');
            document.getElementById('tour-title').value = t.title || '';
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
            showTourFormMsg('');
            buildTourItinerary();
            clearTourLocation();
            clearMeetingPoint();
            if (t.latitude != null && t.longitude != null) {
                var fakeResult = {
                    lat: t.latitude,
                    lon: t.longitude,
                    display_name: t.formatted_address || t.location_name || t.location || '',
                    county: t.county || '',
                    country: t.country || '',
                    place_id: t.place_id || ''
                };
                if (fakeResult.display_name) {
                    document.getElementById('tour-location-search').value = fakeResult.display_name.split(',')[0] || fakeResult.display_name;
                    showTourPreview(fakeResult);
                } else {
                    document.getElementById('tour-location-search').value = t.location || '';
                    document.getElementById('tour-location').value = t.location || '';
                    document.getElementById('tour-lat').value = t.latitude;
                    document.getElementById('tour-lng').value = t.longitude;
                }
            } else if (t.location) {
                document.getElementById('tour-location-search').value = t.location;
                document.getElementById('tour-location').value = t.location;
            }
            if (t.meeting_latitude != null && t.meeting_longitude != null) {
                showMeetingPreview({
                    lat: t.meeting_latitude,
                    lon: t.meeting_longitude,
                    display_name: t.meeting_point_name || t.meeting_address || '',
                    place_id: t.meeting_place_id || ''
                });
                document.getElementById('tour-meeting-search').value = t.meeting_point_name || t.meeting_address || '';
            }
            if (t.itinerary) {
                try {
                    var itineraryData = JSON.parse(t.itinerary);
                    if (Array.isArray(itineraryData) && itineraryData.length) {
                        if (itineraryData[0].activities) {
                            itineraryData.forEach(function(day) {
                                if (!day.activities) return;
                                day.activities.forEach(function(act, idx) {
                                    if (idx > 0) addActivity(day.day);
                                    var titleEl = document.getElementById('act-' + day.day + '-' + idx + '-title');
                                    if (titleEl) titleEl.value = act.title || '';
                                    var timeEl = document.getElementById('act-' + day.day + '-' + idx + '-time');
                                    if (timeEl) timeEl.value = act.start_time || '';
                                    var activityEl = document.getElementById('act-' + day.day + '-' + idx + '-activity');
                                    if (activityEl) activityEl.value = act.activity || '';
                                    var descEl = document.getElementById('act-' + day.day + '-' + idx + '-desc');
                                    if (descEl) descEl.value = act.description || '';
                                });
                            });
                        } else {
                            itineraryData.forEach(function(day) {
                                if (!day.description) return;
                                var firstTitle = document.getElementById('act-' + day.day + '-0-title');
                                var firstDesc = document.getElementById('act-' + day.day + '-0-desc');
                                if (firstTitle) firstTitle.value = day.title || '';
                                if (firstDesc) firstDesc.value = day.description || '';
                            });
                        }
                    }
                } catch(e) {
                    // old text format, ignore
                }
            }
        } catch (e) {
            alert('Failed to load tour: ' + e.message);
        }
    };

    var tourForm = document.getElementById('tour-form');
    if (tourForm) {
        tourForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            var editId = document.getElementById('tour-edit-id').value;
            var btn = document.getElementById('tour-submit-btn');
            var origText = btn.textContent;
            btn.textContent = editId ? 'Updating...' : 'Creating...';
            btn.disabled = true;
            showTourFormMsg('');

            var formData = new FormData();
            formData.append('title', document.getElementById('tour-title').value);
            formData.append('location', document.getElementById('tour-location').value);
            formData.append('location_name', document.getElementById('tour-location-name').value);
            formData.append('formatted_address', document.getElementById('tour-formatted-address').value);
            formData.append('county', document.getElementById('tour-county').value);
            formData.append('country', document.getElementById('tour-country').value);
            formData.append('place_id', document.getElementById('tour-place-id').value);
            formData.append('meeting_point_name', document.getElementById('tour-meeting-point-name').value);
            formData.append('meeting_address', document.getElementById('tour-meeting-address').value);
            formData.append('meeting_latitude', document.getElementById('tour-meeting-lat').value);
            formData.append('meeting_longitude', document.getElementById('tour-meeting-lng').value);
            formData.append('meeting_place_id', document.getElementById('tour-meeting-place-id').value);
            formData.append('price', document.getElementById('tour-price').value);
            formData.append('original_price', document.getElementById('tour-original-price').value);
            formData.append('discount_pct', document.getElementById('tour-discount-pct').value);
            formData.append('duration_days', document.getElementById('tour-duration').value);
            formData.append('max_people', document.getElementById('tour-max-people').value || '20');
            formData.append('activity_type', document.getElementById('tour-activity').value);
            formData.append('wildlife', document.getElementById('tour-wildlife').value);
            formData.append('description', document.getElementById('tour-description').value);
            formData.append('featured', document.getElementById('tour-featured').value);
            formData.append('latitude', document.getElementById('tour-lat').value || '');
            formData.append('longitude', document.getElementById('tour-lng').value || '');

            var days = parseInt(document.getElementById('tour-duration').value) || 0;
            if (days > 0) {
                var itinerary = [];
                for (var d = 1; d <= days; d++) {
                    var activities = [];
                    var actEls = document.querySelectorAll('[id^="act-' + d + '-"][id$="-title"]');
                    var re = new RegExp('^act-' + d + '-(\\d+)-title$');
                    for (var a = 0; a < actEls.length; a++) {
                        var titleEl = actEls[a];
                        var match = titleEl.id.match(re);
                        if (!match) continue;
                        var idx = match[1];
                        var timeEl = document.getElementById('act-' + d + '-' + idx + '-time');
                        var activityEl = document.getElementById('act-' + d + '-' + idx + '-activity');
                        var descEl = document.getElementById('act-' + d + '-' + idx + '-desc');
                        var desc = descEl ? descEl.value.trim() : '';
                        if (desc) {
                            activities.push({
                                title: titleEl.value.trim(),
                                start_time: timeEl ? timeEl.value : '',
                                activity: activityEl ? activityEl.value.trim() : '',
                                description: desc
                            });
                        }
                    }
                    if (activities.length) {
                        itinerary.push({ day: d, activities: activities });
                    }
                }
                if (itinerary.length) {
                    formData.append('itinerary', JSON.stringify(itinerary));
                }
            }
                    });
                    if (activities.length) {
                        itinerary.push({ day: d, activities: activities });
                    }
                }
                if (itinerary.length) {
                    formData.append('itinerary', JSON.stringify(itinerary));
                }
            }

            var files = document.getElementById('tour-images').files;
            for (var i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }
            try {
                if (editId) {
                    await api.updateTour(editId, formData);
                    document.getElementById('tour-edit-id').value = '';
                    btn.textContent = 'Add Tour';
                    document.getElementById('tour-cancel-btn').style.display = 'none';
                } else {
                    await api.createTour(formData);
                }
                tourForm.reset();
                hideTourItinerary();
                clearTourLocation();
                clearMeetingPoint();
                loadTours();
                showTourFormMsg(editId ? 'Tour updated successfully!' : 'Tour created successfully!');
                setTimeout(function() { showTourFormMsg(''); }, 4000);
            } catch (err) {
                showTourFormMsg('Failed: ' + err.message, true);
            } finally {
                btn.textContent = origText;
                btn.disabled = false;
            }
        });
    }

    async function loadActivityTypesDropdown() {
        var select = document.getElementById('tour-activity');
        try {
            var result = await api.getActivityTypes();
            var types = result.types || [];
            select.innerHTML = '<option value="">Select type</option>';
            types.forEach(function(t) {
                var opt = document.createElement('option');
                opt.value = t;
                opt.textContent = t.charAt(0).toUpperCase() + t.slice(1);
                select.appendChild(opt);
            });
        } catch (e) {
            select.innerHTML = '<option value="">Select type</option>';
        }
    }

    window.openActivityTypesModal = async function() {
        document.getElementById('activity-types-modal').style.display = 'flex';
        loadActivityTypesList();
    };
    window.closeActivityTypesModal = function() {
        document.getElementById('activity-types-modal').style.display = 'none';
    };

    async function loadActivityTypesList() {
        var container = document.getElementById('activity-types-list');
        try {
            var result = await api.getActivityTypes();
            var types = result.types || [];
            if (types.length === 0) {
                container.innerHTML = '<p style="color:var(--text-secondary);font-size:0.9rem;">No activity types yet. Add one above.</p>';
                return;
            }
            container.innerHTML = types.map(function(t) {
                return '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0.75rem;border-bottom:1px solid #eee;">'
                    + '<span style="font-weight:500;">' + escHtml(t.charAt(0).toUpperCase() + t.slice(1)) + '</span>'
                    + '<button class="admin-btn admin-btn--danger" style="padding:2px 8px;font-size:11px;" onclick="deleteActivityType(\'' + escHtml(t) + '\')">Delete</button>'
                    + '</div>';
            }).join('');
        } catch (e) {
            container.innerHTML = '<p style="color:var(--error);">Failed to load types.</p>';
        }
    }

    window.addActivityType = async function() {
        var input = document.getElementById('new-activity-type');
        var name = input.value.trim().toLowerCase();
        if (!name) return;
        input.disabled = true;
        try {
            await api.createActivityType(name);
            input.value = '';
            loadActivityTypesList();
            loadActivityTypesDropdown();
        } catch (e) {
            alert('Failed to add type: ' + e.message);
        } finally {
            input.disabled = false;
            input.focus();
        }
    };

    window.deleteActivityType = async function(name) {
        if (!confirm('Delete "' + name + '" activity type?')) return;
        try {
            await api.deleteActivityType(name);
            loadActivityTypesList();
            loadActivityTypesDropdown();
        } catch (e) {
            alert('Failed to delete: ' + e.message);
        }
    };

    loadActivityTypesDropdown();
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

    // ── Hotel Location Picker ─────────────────────────────────
    var hotelLocMap = null;
    var hotelLocMarker = null;
    var hotelGeocache = {};
    var hotelSearchTimeout = null;

    function showHotelPreview(result) {
        var shortName = (result.display_name || '').split(',')[0] || result.display_name || '';
        document.getElementById('hotel-location-name').value = shortName;
        document.getElementById('hotel-formatted-address').value = result.display_name || '';
        document.getElementById('hotel-county').value = result.county || '';
        document.getElementById('hotel-country').value = result.country || '';
        document.getElementById('hotel-place-id').value = result.place_id || '';
        document.getElementById('hotel-location').value = shortName;
        document.getElementById('hotel-lat').value = result.lat;
        document.getElementById('hotel-lng').value = result.lon;

        document.getElementById('hotel-preview-name').textContent = shortName;
        document.getElementById('hotel-preview-address').textContent = result.display_name || '';
        document.getElementById('hotel-preview-county').textContent = result.county ? 'County: ' + result.county : '';
        document.getElementById('hotel-preview-country').textContent = result.country ? 'Country: ' + result.country : '';
        document.getElementById('hotel-preview-lat').textContent = result.lat;
        document.getElementById('hotel-preview-lng').textContent = result.lon;

        var preview = document.getElementById('hotel-location-preview');
        preview.style.display = 'block';

        var mapContainer = document.getElementById('hotel-loc-map');
        if (hotelLocMap) hotelLocMap.remove();
        hotelLocMap = L.map(mapContainer, { zoomControl: true }).setView([result.lat, result.lon], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18, attribution: '&copy; OpenStreetMap'
        }).addTo(hotelLocMap);
        hotelLocMarker = L.marker([result.lat, result.lon], { draggable: true }).addTo(hotelLocMap);
        hotelLocMarker.bindPopup('<b>' + escHtml(document.getElementById('hotel-name').value || 'Hotel') + '</b>');
        hotelLocMarker.on('dragend', async function () {
            var pos = hotelLocMarker.getLatLng();
            document.getElementById('hotel-lat').value = pos.lat;
            document.getElementById('hotel-lng').value = pos.lng;
            document.getElementById('hotel-preview-lat').textContent = pos.lat.toFixed(6);
            document.getElementById('hotel-preview-lng').textContent = pos.lng.toFixed(6);
            try {
                var rev = await reverseGeocode(pos.lat, pos.lng);
                if (rev && rev.display_name) {
                    var short = (rev.display_name || '').split(',')[0] || rev.display_name || '';
                    document.getElementById('hotel-location-name').value = short;
                    document.getElementById('hotel-formatted-address').value = rev.display_name || '';
                    document.getElementById('hotel-county').value = rev.county || '';
                    document.getElementById('hotel-country').value = rev.country || '';
                    document.getElementById('hotel-place-id').value = rev.place_id || '';
                    document.getElementById('hotel-location').value = short;
                    document.getElementById('hotel-preview-name').textContent = short;
                    document.getElementById('hotel-preview-address').textContent = rev.display_name || '';
                    document.getElementById('hotel-preview-county').textContent = rev.county ? 'County: ' + rev.county : '';
                    document.getElementById('hotel-preview-country').textContent = rev.country ? 'Country: ' + rev.country : '';
                }
            } catch (e) {}
        });
        setTimeout(function () { hotelLocMap.invalidateSize(); }, 300);
    }

    function clearHotelLocation() {
        document.getElementById('hotel-location-search').value = '';
        document.getElementById('hotel-location').value = '';
        document.getElementById('hotel-location-name').value = '';
        document.getElementById('hotel-formatted-address').value = '';
        document.getElementById('hotel-county').value = '';
        document.getElementById('hotel-country').value = '';
        document.getElementById('hotel-place-id').value = '';
        document.getElementById('hotel-lat').value = '';
        document.getElementById('hotel-lng').value = '';
        document.getElementById('hotel-location-preview').style.display = 'none';
        if (hotelLocMap) { hotelLocMap.remove(); hotelLocMap = null; hotelLocMarker = null; }
    }

    document.getElementById('hotel-location-clear')?.addEventListener('click', clearHotelLocation);

    var hotelSearchInput = document.getElementById('hotel-location-search');
    var hotelSuggestions = document.getElementById('hotel-location-suggestions');

    hotelSearchInput?.addEventListener('input', function () {
        var q = this.value.trim();
        if (q.length < 3) { hotelSuggestions.style.display = 'none'; return; }
        clearTimeout(hotelSearchTimeout);
        if (hotelGeocache[q]) {
            showHotelSuggestions(hotelGeocache[q]);
            return;
        }
        hotelSearchTimeout = setTimeout(async function () {
            hotelSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--text-secondary);font-size:0.82rem;">Searching...</div>';
            hotelSuggestions.style.display = 'block';
            try {
                var results = await searchLocation(q);
                hotelGeocache[q] = results;
                showHotelSuggestions(results);
            } catch (e) {
                hotelSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--error);font-size:0.82rem;">Search failed.</div>';
            }
        }, 300);
    });

    function showHotelSuggestions(results) {
        if (results.length === 0) {
            hotelSuggestions.innerHTML = '<div style="padding:0.75rem;text-align:center;color:var(--text-secondary);font-size:0.82rem;">No results found.</div>';
            return;
        }
        hotelSuggestions.innerHTML = results.map(function (r) {
            var icon = '📍';
            if (r.type === 'city' || r.type === 'town') icon = '🏙️';
            else if (r.type === 'country') icon = '🌍';
            else if (r.category === 'natural') icon = '🏔️';
            return '<div class="location-suggestion" data-result=\'' + JSON.stringify(r).replace(/'/g, '&#39;') + '\' style="padding:0.6rem 0.75rem;cursor:pointer;display:flex;align-items:flex-start;gap:0.5rem;border-bottom:1px solid #f0f0f0;transition:background 0.15s;" onmouseover="this.style.background=\'#f5f7f5\'" onmouseout="this.style.background=\'\'">'
                + '<span style="font-size:1rem;line-height:1.3;">' + icon + '</span>'
                + '<div style="flex:1;min-width:0;">'
                + '<div style="font-size:0.85rem;font-weight:600;color:var(--dark-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(r.display_name?.split(',')[0] || '') + '</div>'
                + '<div style="font-size:0.75rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + escHtml(r.display_name || '') + '</div>'
                + (r.county || r.country ? '<div style="font-size:0.7rem;color:var(--text-placeholder);margin-top:0.15rem;">' + [r.county, r.country].filter(Boolean).join(', ') + '</div>' : '')
                + '</div>'
                + '</div>';
        }).join('');
        hotelSuggestions.querySelectorAll('.location-suggestion').forEach(function (el) {
            el.addEventListener('click', function () {
                var result = JSON.parse(this.getAttribute('data-result'));
                hotelSuggestions.style.display = 'none';
                hotelSearchInput.value = result.display_name?.split(',')[0] || result.display_name || '';
                showHotelPreview(result);
            });
        });
    }

    document.addEventListener('click', function (e) {
        if (hotelSuggestions && !e.target.closest('#hotel-location-search') && !e.target.closest('#hotel-location-suggestions')) {
            hotelSuggestions.style.display = 'none';
        }
    });

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
            clearHotelLocation();
            if (h.latitude != null && h.longitude != null) {
                var fakeResult = {
                    lat: h.latitude,
                    lon: h.longitude,
                    display_name: h.formatted_address || h.location_name || h.location || '',
                    county: h.county || '',
                    country: h.country || '',
                    place_id: h.place_id || ''
                };
                if (fakeResult.display_name) {
                    document.getElementById('hotel-location-search').value = fakeResult.display_name.split(',')[0] || fakeResult.display_name;
                    showHotelPreview(fakeResult);
                } else {
                    document.getElementById('hotel-location-search').value = h.location || '';
                    document.getElementById('hotel-location').value = h.location || '';
                    document.getElementById('hotel-lat').value = h.latitude;
                    document.getElementById('hotel-lng').value = h.longitude;
                }
            } else if (h.location) {
                document.getElementById('hotel-location-search').value = h.location;
                document.getElementById('hotel-location').value = h.location;
            }
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
            formData.append('location_name', document.getElementById('hotel-location-name').value);
            formData.append('formatted_address', document.getElementById('hotel-formatted-address').value);
            formData.append('county', document.getElementById('hotel-county').value);
            formData.append('country', document.getElementById('hotel-country').value);
            formData.append('place_id', document.getElementById('hotel-place-id').value);
            formData.append('price_per_night', document.getElementById('hotel-price').value);
            formData.append('rating', document.getElementById('hotel-rating').value || '0');
            formData.append('amenities', document.getElementById('hotel-amenities').value);
            formData.append('description', document.getElementById('hotel-description').value);
            formData.append('latitude', document.getElementById('hotel-lat').value || '');
            formData.append('longitude', document.getElementById('hotel-lng').value || '');
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
                clearHotelLocation();
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
                html += '<td style="white-space:nowrap;">';
                html += '<button class="admin-btn admin-btn--primary" style="padding:4px 10px;font-size:11px;margin-right:4px;" onclick="editAuthSlide(\'' + s.id + '\',\'' + escHtml(s.location.replace(/'/g, "\\'")) + '\',\'' + escHtml((s.description || '').replace(/'/g, "\\'")) + '\')">Edit</button>';
                html += '<button class="admin-btn admin-btn--danger" style="padding:4px 10px;font-size:11px;" onclick="deleteAuthSlide(\'' + s.id + '\')">Delete</button>';
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p class="admin-empty-state">Failed to load slides.</p>';
        }
    }

    window.editAuthSlide = function (id, location, description) {
        document.getElementById('auth-slide-edit-id').value = id;
        document.getElementById('auth-slide-location').value = location || '';
        document.getElementById('auth-slide-desc').value = description || '';
        document.getElementById('auth-slide-file').required = false;
        document.getElementById('auth-slide-submit-btn').textContent = 'Update Slide';
        document.getElementById('auth-slide-cancel-btn').style.display = '';
        document.getElementById('auth-slide-location').focus();
    };

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
            var editId = document.getElementById('auth-slide-edit-id').value;
            var formData = new FormData(authSlideForm);
            try {
                if (editId) {
                    await api.updateAuthSlide(editId, formData);
                    document.getElementById('auth-slide-edit-id').value = '';
                    document.getElementById('auth-slide-submit-btn').textContent = 'Upload Slide';
                    document.getElementById('auth-slide-cancel-btn').style.display = 'none';
                    document.getElementById('auth-slide-file').required = true;
                } else {
                    if (!document.getElementById('auth-slide-file').files.length) {
                        alert('Please select an image.');
                        return;
                    }
                    await api.createAuthSlide(formData);
                }
                authSlideForm.reset();
                loadAuthSlides();
            } catch (err) {
                alert('Failed: ' + err.message);
            }
        });
    }

    loadAuthSlides();

    // ── Locations (Thrilling Locations) ───────────────────────────
    var locMap = null;

    function initLocMap(lat, lng) {
        var container = document.getElementById('loc-map-preview');
        container.style.display = 'block';
        if (locMap) locMap.remove();
        locMap = L.map(container, { zoomControl: false }).setView([lat, lng], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18, attribution: '&copy; OpenStreetMap'
        }).addTo(locMap);
        L.marker([lat, lng]).addTo(locMap);
        setTimeout(function () { locMap.invalidateSize(); }, 200);
    }

    function destroyLocMap() {
        if (locMap) { locMap.remove(); locMap = null; }
        document.getElementById('loc-map-preview').style.display = 'none';
    }

    async function lookupLocation() {
        var name = document.getElementById('loc-name').value.trim();
        var locText = document.getElementById('loc-location-text').value.trim();
        var query = locText || name;
        if (!query) { alert('Enter a name or location text first.'); return; }
        try {
            var results = await searchLocation(query);
            if (results.length > 0) {
                document.getElementById('loc-lat').value = results[0].lat;
                document.getElementById('loc-lng').value = results[0].lon;
                initLocMap(results[0].lat, results[0].lon);
            } else {
                alert('Could not find that location.');
            }
        } catch (e) {
            alert('Geocoding failed: ' + e.message);
        }
    }

    document.getElementById('loc-geocode-btn')?.addEventListener('click', lookupLocation);

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
            html += '<th>Image</th><th>Name</th><th>Location</th><th>Lat</th><th>Lng</th><th>Order</th><th>Status</th><th>Actions</th>';
            html += '</tr></thead><tbody>';
            items.forEach(function (d) {
                var hasCoords = d.latitude != null && d.longitude != null;
                html += '<tr>';
                html += '<td><img src="' + escHtml(d.image_url) + '" style="width:80px;height:50px;object-fit:cover;border-radius:6px;"></td>';
                html += '<td>' + escHtml(d.name) + '</td>';
                html += '<td>' + escHtml(d.location_text || '—') + '</td>';
                html += '<td>' + (hasCoords ? d.latitude.toFixed(4) : '—') + '</td>';
                html += '<td>' + (hasCoords ? d.longitude.toFixed(4) : '—') + '</td>';
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
            document.getElementById('loc-lat').value = item.latitude != null ? item.latitude : '';
            document.getElementById('loc-lng').value = item.longitude != null ? item.longitude : '';
            document.getElementById('loc-edit-id').value = item.id;
            document.getElementById('loc-submit-btn').textContent = 'Update Location';
            document.getElementById('loc-name').focus();
            destroyLocMap();
            if (item.latitude != null && item.longitude != null) {
                initLocMap(item.latitude, item.longitude);
            }
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
                destroyLocMap();
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
