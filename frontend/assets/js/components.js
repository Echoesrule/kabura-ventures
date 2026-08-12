(function() {
    function loadComponent(id, file) {
        var el = document.getElementById(id);
        if (!el) return;
        fetch(file).then(function(r) { return r.text(); }).then(function(html) {
            el.innerHTML = html;
            highlightActiveNav();
            if (id === 'navbar-placeholder') {
                initUserDropdown();
                initAnnouncementBar();
                if (typeof updateAuthUI === 'function') updateAuthUI();
                if (typeof initCurrencySwitcher === 'function') initCurrencySwitcher();
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

    function syncAnnouncementOffset() {
        var topBars = document.querySelector('.site-top-bars');
        var offset = 0;
        if (topBars && topBars.style.display !== 'none') {
            offset = topBars.offsetHeight || 0;
        }
        document.documentElement.style.setProperty('--announcement-offset', offset + 'px');
    }

    function initAnnouncementBar() {
        var topBars = document.querySelector('.site-top-bars');
        var bar = document.querySelector('.announcement-bar');
        if (topBars) topBars.style.display = '';
        if (bar) {
            bar.classList.remove('is-dismissed');
            bar.style.display = '';
        }
        syncAnnouncementOffset();
        if (!bar) return;
        var closeBtn = bar.querySelector('.announcement-bar-close');
        if (!closeBtn) return;
        closeBtn.addEventListener('click', function() {
            bar.classList.add('is-dismissed');
            syncAnnouncementOffset();
            setTimeout(function() {
                bar.style.display = 'none';
                syncAnnouncementOffset();
            }, 250);
        });
        window.addEventListener('resize', syncAnnouncementOffset, { passive: true });
    }

    function initNavbarScroll() {
        var onScroll = function() {
            var navbar = document.querySelector('.navbar');
            var topBars = document.querySelector('.site-top-bars');
            if (!navbar) return;
            if (window.scrollY > 40) {
                navbar.classList.add('scrolled');
                if (topBars) topBars.style.display = 'none';
            } else {
                navbar.classList.remove('scrolled');
                if (topBars) topBars.style.display = '';
            }
            syncAnnouncementOffset();
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

    // Kabura site styling: inject the shared navbar and motion layers site-wide.
    (function injectSiteStyles() {
        var navbarCss = document.createElement('link');
        navbarCss.rel = 'stylesheet';
        navbarCss.href = '/assets/css/navbar.css';
        document.head.appendChild(navbarCss);

        var motionCss = document.createElement('link');
        motionCss.rel = 'stylesheet';
        motionCss.href = '/assets/css/motion.css';
        document.head.appendChild(motionCss);

        var js = document.createElement('script');
        js.src = '/assets/js/motion.js';
        js.async = true;
        document.body.appendChild(js);
    })();
})();