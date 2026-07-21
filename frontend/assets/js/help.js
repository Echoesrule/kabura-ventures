        function toggleFAQ(el) {
            var item = el.parentElement;
            var wasOpen = item.classList.contains('open');
            item.classList.toggle('open');
        }

        function filterFAQs(query) {
            var items = document.querySelectorAll('.faq-item');
            var groups = document.querySelectorAll('.faq-group');
            var q = query.toLowerCase().trim();
            items.forEach(function(item) {
                var text = item.textContent.toLowerCase();
                item.style.display = (!q || text.indexOf(q) !== -1) ? '' : 'none';
            });
            groups.forEach(function(g) {
                var visible = Array.from(g.querySelectorAll('.faq-item')).some(function(i) { return i.style.display !== 'none'; });
                g.style.display = (!q || visible) ? '' : 'none';
                if (!q) {
                    g.querySelectorAll('.faq-item.open').forEach(function(i) { i.classList.remove('open'); });
                }
            });
        }

        function scrollToGroup(id) {
            var el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setTimeout(function() {
                    var firstItem = el.querySelector('.faq-item');
                    if (firstItem) firstItem.classList.add('open');
                }, 500);
            }
        }

        var urlHash = window.location.hash.replace('#', '');
        if (urlHash && document.getElementById(urlHash)) {
            setTimeout(function() { scrollToGroup(urlHash); }, 300);
        }