// Admin dashboard
(async function () {
    var token = localStorage.getItem('token');
    if (!token) { window.location.href = '/login.html'; return; }

    try {
        var me = await api.getProfile();
        if (!me.user || me.user.role !== 'admin') {
            document.querySelector('.admin-content').innerHTML = '<div class="admin-empty-state" style="padding:4rem;"><h3>Access Denied</h3><p>You need admin privileges to view this page.</p><a href="/" style="display:inline-block;margin-top:1rem;padding:0.7rem 1.5rem;background:var(--primary);color:#fff;border-radius:60px;text-decoration:none;font-family:var(--font-heading);">Go Home</a></div>';
            return;
        }
        document.getElementById('admin-user-name').textContent = me.user.name || 'Admin';
    } catch (e) {
        window.location.href = '/login.html';
        return;
    }

    // Sidebar navigation
    var sidebarLinks = document.querySelectorAll('.admin-sidebar-link[data-section]');
    var sections = document.querySelectorAll('.admin-section');
    var sectionTitle = document.getElementById('section-title');
    var sidebar = document.getElementById('admin-sidebar');
    var toggle = document.getElementById('sidebar-toggle');

    sidebarLinks.forEach(function (link) {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            var target = this.getAttribute('data-section');

            sidebarLinks.forEach(function (l) { l.classList.remove('active'); });
            this.classList.add('active');

            sections.forEach(function (s) { s.classList.remove('active'); });
            var section = document.getElementById('section-' + target);
            if (section) section.classList.add('active');

            sectionTitle.textContent = this.querySelector('span').textContent;

            sidebar.classList.remove('open');
        });
    });

    // Mobile sidebar toggle
    toggle.addEventListener('click', function () {
        sidebar.classList.toggle('open');
    });

    // Close sidebar on outside click
    document.addEventListener('click', function (e) {
        if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== toggle) {
            sidebar.classList.remove('open');
        }
    });

    // Helper
    function escHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    }

    function makeTable(headers, rows) {
        var html = '<table class="admin-table"><thead><tr>';
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
        html += '</tbody></table>';
        return html;
    }

    function statusBadge(status) {
        var cls = 'admin-badge--pending';
        if (status === 'confirmed') cls = 'admin-badge--confirmed';
        if (status === 'completed') cls = 'admin-badge--completed';
        return '<span class="admin-badge ' + cls + '">' + escHtml(status || 'pending') + '</span>';
    }

    // Load bookings
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

        var dashHtml = makeTable(headers, rows);
        document.getElementById('dashboard-bookings-list').innerHTML = dashHtml;

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

    // Load messages
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

    // Load tours
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

    // Load users
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
