(function() {
    function loadComponent(id, file) {
        var el = document.getElementById(id);
        if (!el) return;
        fetch(file).then(function(r) { return r.text(); }).then(function(html) {
            el.innerHTML = html;
            highlightActiveNav();
            if (id === 'navbar-placeholder') {
                initUserDropdown();
                if (typeof updateAuthUI === 'function') updateAuthUI();
            }
        }).catch(function() {});
    }

    function highlightActiveNav() {
        var path = window.location.pathname;
        var links = document.querySelectorAll('.nav-links a[href]');
        links.forEach(function(link) {
            var href = link.getAttribute('href');
            if (!href || href === '#') return;
            if (href === '/' && path === '/') {
                link.parentElement.classList.add('active');
            } else if (href !== '/' && path.startsWith(href)) {
                link.parentElement.classList.add('active');
            }
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        var body = document.body;
        if (!body.classList.contains('no-nav')) {
            loadComponent('navbar-placeholder', '/navbar.html');
            initNavbarScroll();
        }
        loadComponent('footer-placeholder', '/footer.html');
        if (typeof initSupabaseAuthPage === 'function') {
            initSupabaseAuthPage();
        }
    });

    function initNavbarScroll() {
        var onScroll = function() {
            var navbar = document.querySelector('.navbar');
            var bar = document.querySelector('.announcement-bar');
            if (!navbar) return;
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
                if (bar) bar.style.display = 'none';
            } else {
                navbar.classList.remove('scrolled');
                if (bar) bar.style.display = '';
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    function initUserDropdown() {
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('auth-buttons');
            if (dd && !e.target.closest('.nav-user-dropdown')) {
                dd.classList.remove('open');
            }
        });
    }
})();