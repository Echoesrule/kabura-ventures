        var wishlistItems = [];
        var currentTab = 'all';

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.wishlist-tab').forEach(function(t) { t.classList.remove('active'); });
            document.querySelector('.wishlist-tab[data-tab="' + tab + '"]').classList.add('active');
            renderWishlist();
        }

        function getWishlistImage(item) {
            if (item.tour && item.tour.images && item.tour.images.length > 0) {
                var img = item.tour.images.find(function(i) { return i.is_primary; }) || item.tour.images[0];
                return img ? img.image_url : '/assets/images/placeholder.svg';
            }
            if (item.hotel && item.hotel.images && item.hotel.images.length > 0) {
                var img = item.hotel.images.find(function(i) { return i.is_primary; }) || item.hotel.images[0];
                return img ? img.image_url : '/assets/images/placeholder.svg';
            }
            return '/assets/images/placeholder.svg';
        }

        function renderWishlist() {
            var container = document.getElementById('wishlist-container');
            var filtered = wishlistItems;
            if (currentTab === 'tours') filtered = wishlistItems.filter(function(i) { return i.tour_id; });
            else if (currentTab === 'hotels') filtered = wishlistItems.filter(function(i) { return i.hotel_id; });

            if (filtered.length === 0) {
                var icon = currentTab === 'tours' ? 'fa-hiking' : (currentTab === 'hotels' ? 'fa-hotel' : 'fa-heart');
                var msg = currentTab === 'all' ? 'Your wishlist is empty' : 'No saved ' + currentTab + ' yet';
                container.innerHTML = '<div class="wishlist-empty">'
                    + '<i class="fas ' + icon + '"></i>'
                    + '<h3>' + msg + '</h3>'
                    + '<p>Start exploring and save your favorite tours and hotels!</p>'
                    + '<a href="/tours.html" class="btn btn-primary">Browse Tours</a>'
                    + ' <a href="/hotels.html" class="btn btn-secondary">Browse Hotels</a>'
                    + '</div>';
                return;
            }

            var html = '<div class="grid grid-3">';
            filtered.forEach(function(item) {
                if (item.tour) {
                    var t = item.tour;
                    var imgUrl = getWishlistImage(item);
                    var cat = t.activity_type ? t.activity_type.toUpperCase() : '';
                    var rating = t.avg_rating || 0;
                    var fullStars = Math.round(rating);
                    var starsHtml = '<i class="fas fa-star"></i>'.repeat(fullStars) + '<i class="far fa-star"></i>'.repeat(5 - fullStars);
                    var desc = t.description ? escapeHTML(t.description) : '';
                    html += '<div class="card card-tour card-tour-deep">'
                        + '<a href="/tour-detail.html?id=' + t.id + '" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;flex:1;">'
                            + '<div class="card-image-wrap">'
                                + '<button onclick="event.stopPropagation();removeWishlist(\'' + item.id + '\', \'' + t.id + '\')" class="card-wishlist-btn" title="Remove from wishlist">'
                                    + '<i class="fas fa-heart" style="color:var(--accent);"></i>'
                                + '</button>'
                                + (cat ? '<span class="card-badge-cat">' + cat + '</span>' : '')
                                + '<img src="' + imgUrl + '" alt="' + escapeHTML(t.title) + '" class="card-image" loading="lazy" onerror="this.src=\'/assets/images/placeholder.svg\'">'
                            + '</div>'
                            + '<div class="card-body">'
                                + '<div class="card-location-deep"><i class="fas fa-map-pin"></i> ' + escapeHTML(t.location || 'Kenya') + '</div>'
                                + '<h3 class="card-title">' + escapeHTML(t.title) + '</h3>'
                                + (desc ? '<p class="card-text">' + desc + '</p>' : '')
                                + (rating > 0 ? '<div class="card-stars-deep">' + starsHtml + ' <span>' + rating.toFixed(1) + '</span></div>' : '')
                                + '<div class="card-footer-deep">'
                                    + '<div class="card-author-deep">'
                                        + '<span class="card-author-name">BY KABURA VENTURES</span>'
                                    + '</div>'
                                    + '<div class="card-footer-bar">'
                                        + '<span class="card-price price-amount" data-kes="' + t.price + '">' + window.formatPrice(t.price) + '</span>'
                                        + '<span class="card-cta">Details <i class="fas fa-arrow-right"></i></span>'
                                    + '</div>'
                                + '</div>'
                            + '</div>'
                        + '</a>'
                    + '</div>';
                } else if (item.hotel) {
                    var h = item.hotel;
                    var imgUrl = getWishlistImage(item);
                    var rating = h.avg_rating || h.rating || 0;
                    var fullStars = Math.round(rating);
                    var starsHtml = '<i class="fas fa-star"></i>'.repeat(fullStars) + '<i class="far fa-star"></i>'.repeat(5 - fullStars);
                    var desc = h.description ? escapeHTML(h.description) : '';
                    html += '<div class="card card-tour card-tour-deep">'
                        + '<a href="/hotel-detail.html?id=' + h.id + '" style="text-decoration:none;color:inherit;display:flex;flex-direction:column;flex:1;">'
                            + '<div class="card-image-wrap">'
                                + '<button onclick="event.stopPropagation();removeWishlist(\'' + item.id + '\', null, \'' + h.id + '\')" class="card-wishlist-btn" title="Remove from wishlist">'
                                    + '<i class="fas fa-heart" style="color:var(--accent);"></i>'
                                + '</button>'
                                + '<img src="' + imgUrl + '" alt="' + escapeHTML(h.name) + '" class="card-image" loading="lazy" onerror="this.src=\'/assets/images/placeholder.svg\'">'
                            + '</div>'
                            + '<div class="card-body">'
                                + '<div class="card-location-deep"><i class="fas fa-map-pin"></i> ' + escapeHTML(h.location || 'Kenya') + '</div>'
                                + '<h3 class="card-title">' + escapeHTML(h.name) + '</h3>'
                                + (desc ? '<p class="card-text">' + desc + '</p>' : '')
                                + (rating > 0 ? '<div class="card-stars-deep">' + starsHtml + ' <span>' + rating.toFixed(1) + '</span></div>' : '')
                                + '<div class="card-footer-deep">'
                                    + '<div class="card-author-deep">'
                                        + '<span class="card-author-name">BY KABURA VENTURES</span>'
                                    + '</div>'
                                    + '<div class="card-footer-bar">'
                                        + '<span class="card-price"><span class="price-amount" data-kes="' + h.price_per_night + '">' + window.formatPrice(h.price_per_night) + '</span> <small>/night</small></span>'
                                        + '<span class="card-cta">Details <i class="fas fa-arrow-right"></i></span>'
                                    + '</div>'
                                + '</div>'
                            + '</div>'
                        + '</a>'
                    + '</div>';
                }
            });
            html += '</div>';
            container.innerHTML = html;
        }

        async function removeWishlist(wishlistId, tourId, hotelId) {
            try {
                await api.removeFromWishlist(wishlistId);
                wishlistItems = wishlistItems.filter(function(i) { return i.id !== wishlistId; });
                updateCounts();
                renderWishlist();
                showToast('Removed from wishlist', 'info');
            } catch (err) {
                showToast(err.message, 'error');
            }
        }

        function updateCounts() {
            var all = wishlistItems.length;
            var tours = wishlistItems.filter(function(i) { return i.tour_id; }).length;
            var hotels = wishlistItems.filter(function(i) { return i.hotel_id; }).length;
            document.getElementById('count-all').textContent = all;
            document.getElementById('count-tours').textContent = tours;
            document.getElementById('count-hotels').textContent = hotels;
        }

        async function loadWishlistPage() {
            if (!api.token) {
                document.getElementById('wishlist-container').innerHTML = '<div class="wishlist-empty">'
                    + '<i class="fas fa-heart"></i>'
                    + '<h3>Login to view your wishlist</h3>'
                    + '<p>Sign in to save and view your favorite tours and hotels.</p>'
                    + '<a href="/login.html" class="btn btn-primary">Login</a>'
                    + ' <a href="/signup.html" class="btn btn-secondary">Sign Up</a>'
                    + '</div>';
                return;
            }
            try {
                var result = await api.getWishlist();
                wishlistItems = result.wishlist || [];
                updateCounts();
                renderWishlist();
            } catch (err) {
                document.getElementById('wishlist-container').innerHTML = '<div class="wishlist-empty">'
                    + '<i class="fas fa-exclamation-triangle"></i>'
                    + '<h3>Could not load wishlist</h3>'
                    + '<p>Please try again later.</p>'
                    + '</div>';
            }
        }

        loadWishlistPage();