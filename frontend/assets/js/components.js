(function() {
    function loadComponent(id, file) {
        var el = document.getElementById(id);
        if (!el) return;
        fetch(file).then(function(r) { return r.text(); }).then(function(html) {
            el.innerHTML = html;
            highlightActiveNav();
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
            if (!navbar) return;
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }
})();