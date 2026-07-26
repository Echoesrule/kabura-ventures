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

    var allBookings = [];
    try {
        var bookings = await api.request('/bookings');
        allBookings = bookings.bookings || bookings || [];
        document.getElementById('stat-bookings').textContent = allBookings.length;

        var headers = ['Customer', 'Tour', 'Date', 'Status'];
        var rows = allBookings.slice(0, 10).map(function (b) {
            return [
                escHtml(b.name || b.user_name || '—'),
                escHtml(b.tour_name || b.tour || '—'),
                escHtml(b.date || b.travel_date || '—'),
                statusBadge(b.status)
            ];
        });

        document.getElementById('dashboard-bookings-list').innerHTML = makeTable(headers, rows);

        var allRows = allBookings.map(function (b) {
            return [
                escHtml(b.name || b.user_name || '—'),
                escHtml(b.email || b.user_email || '—'),
                escHtml(b.tour_name || b.tour || '—'),
                escHtml(b.date || b.travel_date || '—'),
                statusBadge(b.status)
            ];
        });
        document.getElementById('bookings-list').innerHTML = makeTable(['Customer', 'Email', 'Tour', 'Date', 'Status'], allRows);
    } catch (e) {
        document.getElementById('dashboard-bookings-list').innerHTML = '<p class="admin-empty-state">Failed to load bookings.</p>';
        document.getElementById('bookings-list').innerHTML = '<p class="admin-empty-state">Failed to load bookings.</p>';
    }

    try {
        var msgs = await api.request('/messages');
        var allMsgs = msgs.messages || msgs || [];
        var unread = allMsgs.filter(function (m) { return !m.read && !m.admin_reply; });
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

    try {
        var tours = await api.request('/tours');
        var allTours = tours.tours || tours || [];
        document.getElementById('stat-tours').textContent = allTours.length;

        var tourRows = allTours.map(function (t) {
            return [
                escHtml(t.name || t.title || '—'),
                escHtml(t.location || '—'),
                '$' + escHtml(String(t.price || '—')),
                escHtml(t.duration || '—')
            ];
        });
        document.getElementById('tours-list').innerHTML = makeTable(['Tour', 'Location', 'Price', 'Duration'], tourRows);
    } catch (e) {
        document.getElementById('tours-list').innerHTML = '<p class="admin-empty-state">Failed to load tours.</p>';
    }

    try {
        var users = await api.request('/users');
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
})();
