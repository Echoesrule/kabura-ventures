        document.addEventListener('DOMContentLoaded', function() {
            var hash = window.location.hash;
            if (hash) {
                var target = document.getElementById(hash.replace('#', ''));
                if (target) {
                    setTimeout(function() {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        target.classList.add('service-detail-active');
                    }, 300);
                }
            }
        });