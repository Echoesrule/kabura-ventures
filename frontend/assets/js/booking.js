var urlParams = new URLSearchParams(window.location.search);
var preselectedTour = urlParams.get('tour');
var preselectedHotel = urlParams.get('hotel');
var prefilledCheckin = urlParams.get('checkin');
var prefilledCheckout = urlParams.get('checkout');
var prefilledGuests = urlParams.get('guests');
var selectedItem = null;
var selectedType = '';
var allBookings = [];
var currentStep = 1;
var allPackages = { tours: [], hotels: [] };
var couponDiscount = 0;
var couponCodeApplied = '';

var todayStr = new Date().toISOString().split('T')[0];

// ── Step Management ────────────────────────────────────────

function goToStep(step) {
    if (step < 1 || step > 4) return;
    currentStep = step;

    document.querySelectorAll('.wizard-panel').forEach(function(p) { p.classList.remove('active'); });
    document.getElementById('wizard-step-' + step).classList.add('active');

    document.querySelectorAll('.wizard-step-indicator').forEach(function(i) {
        var s = parseInt(i.dataset.step);
        var circle = i.querySelector('.wizard-step-circle');
        i.classList.remove('active', 'completed');
        if (s === step) {
            i.classList.add('active');
            circle.textContent = s;
        } else if (s < step) {
            i.classList.add('completed');
            circle.textContent = '✓';
        } else {
            circle.textContent = s;
        }
    });

    var backBtn = document.getElementById('wizard-back');
    var nextBtn = document.getElementById('wizard-next');
    backBtn.style.display = step === 1 ? 'none' : 'flex';
    nextBtn.style.display = step === 4 ? 'none' : 'flex';

    if (step === 4) populateReview();
    if (step === 3) updatePriceSummary();

    window.scrollTo({ top: document.querySelector('.wizard-steps').offsetTop - 100, behavior: 'smooth' });
}

function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep === 4) return;
    goToStep(currentStep + 1);
}

function prevStep() {
    if (currentStep === 1) return;
    goToStep(currentStep - 1);
}

function validateStep(step) {
    if (step === 1) {
        if (!selectedItem) { showToast('Please select a package', 'warning'); return false; }
        var date = document.getElementById('booking-date').value;
        if (!date) { showToast('Please select a travel date', 'warning'); return false; }
        return true;
    }
    if (step === 2) {
        var name = document.getElementById('booking-name').value.trim();
        var email = document.getElementById('booking-email').value.trim();
        if (!name) { showToast('Please enter your full name', 'warning'); return false; }
        if (!email) { showToast('Please enter your email', 'warning'); return false; }
        if (!/\S+@\S+\.\S+/.test(email)) { showToast('Please enter a valid email', 'warning'); return false; }
        return true;
    }
    if (step === 3) {
        // Coupon is optional, payment method is already selected
        return true;
    }
    return true;
}

// ── Package Selection ──────────────────────────────────────

async function loadPackages() {
    try {
        var t = await api.getTours({ per_page: 50 });
        allPackages.tours = t.tours || [];
    } catch (e) { console.error(e); }
    try {
        var h = await api.getHotels({ per_page: 50 });
        allPackages.hotels = h.hotels || [];
    } catch (e) { console.error(e); }
}

function selectPackage(item, type) {
    selectedItem = item;
    selectedType = type;
    document.getElementById('booking-type').value = type;
    document.getElementById('booking-item-id').value = item.id || item._id;

    var display = document.getElementById('selected-package-display');
    var picker = document.getElementById('package-picker');
    display.style.display = 'block';
    picker.style.display = 'none';

    var imgUrl = '/assets/images/placeholder.svg';
    if (item.images && item.images.length > 0) {
        var img = item.images.find(function(i) { return i.is_primary; }) || item.images[0];
        if (img) imgUrl = img.image_url;
    }

    document.getElementById('package-img').src = imgUrl;
    document.getElementById('package-title').textContent = item.title || item.name || 'Package';
    document.getElementById('package-location').textContent = item.location || item.formatted_address || 'Kenya';

    var price = type === 'hotel' ? item.price_per_night : item.price;
    var label = type === 'hotel' ? '/night' : '/person';
    document.getElementById('package-price').innerHTML = '<span class="price-amount" data-kes="' + price + '">' + window.formatPrice(price) + '</span> ' + label;

    var roomRow = document.getElementById('booking-room-type-row');
    roomRow.style.display = type === 'hotel' ? 'block' : 'none';

    updatePriceSummary();
    document.getElementById('booking-date').dispatchEvent(new Event('change'));
}

function showPackagePicker() {
    document.getElementById('selected-package-display').style.display = 'none';
    document.getElementById('package-picker').style.display = 'block';
    renderPackageGrid('tour');
}

function renderPackageGrid(type) {
    var grid = document.getElementById('package-grid');
    var items = allPackages[type + 's'] || [];
    if (items.length === 0) {
        grid.innerHTML = '<p style="color:var(--text-secondary);padding:1rem 0;">No ' + type + 's available.</p>';
        return;
    }
    var html = '';
    items.forEach(function(item) {
        var imgUrl = '/assets/images/placeholder.svg';
        if (item.images && item.images.length > 0) {
            var img = item.images.find(function(i) { return i.is_primary; }) || item.images[0];
            if (img) imgUrl = img.image_url;
        }
        var price = type === 'hotel' ? item.price_per_night : item.price;
        var label = type === 'hotel' ? '/night' : '/person';
        html += '<div class="package-grid-item" data-id="' + (item.id || item._id) + '" data-type="' + type + '">'
            + '<img src="' + imgUrl + '" alt="" onerror="this.src=\'/assets/images/placeholder.svg\'">'
            + '<div class="package-grid-info">'
            + '<h4>' + escapeHTML(item.title || item.name || '') + '</h4>'
            + '<span>' + window.formatPrice(price) + ' ' + label + '</span>'
            + '</div></div>';
    });
    grid.innerHTML = html;

    grid.querySelectorAll('.package-grid-item').forEach(function(el) {
        el.addEventListener('click', function() {
            var id = this.dataset.id;
            var t = this.dataset.type;
            var found = allPackages[t + 's'].find(function(p) { return (p.id || p._id) === id; });
            if (found) selectPackage(found, t);
        });
    });
}

// ── Price Calculation ─────────────────────────────────────

function getBasePrice() {
    if (!selectedItem) return 0;
    return selectedType === 'hotel' ? (selectedItem.price_per_night || 0) : (selectedItem.price || 0);
}

function getNights() {
    var checkin = document.getElementById('booking-date').value;
    var checkout = document.getElementById('booking-return').value;
    if (selectedType === 'hotel' && checkin && checkout) {
        return Math.max(1, Math.round((new Date(checkout) - new Date(checkin)) / (1000 * 60 * 60 * 24)));
    }
    return 1;
}

function getGuests() {
    return parseInt(document.getElementById('booking-people').value) || 1;
}

function calculateTotal() {
    var price = getBasePrice();
    var nights = getNights();
    var guests = getGuests();
    var total = price * nights * (selectedType === 'hotel' ? 1 : guests);
    return total;
}

function updatePriceSummary() {
    var total = calculateTotal();
    var deposit = total * 0.3;
    document.getElementById('review-base-price').innerHTML = '<span class="price-amount" data-kes="' + getBasePrice() + '">' + window.formatPrice(getBasePrice()) + '</span>' + (selectedType === 'hotel' ? '/night' : '/person');
    document.getElementById('review-travelers').textContent = getGuests();
    document.getElementById('review-nights').textContent = getNights() + (selectedType === 'hotel' ? ' night(s)' : '');
    document.getElementById('review-total').innerHTML = '<span class="price-amount" data-kes="' + total + '">' + window.formatPrice(total) + '</span>';

    var depositRow = document.getElementById('review-deposit-row');
    var payType = document.querySelector('.payment-type-btn.active');
    if (payType && payType.dataset.value === 'deposit') {
        depositRow.style.display = 'flex';
        document.getElementById('review-deposit').innerHTML = '<span class="price-amount" data-kes="' + deposit + '">' + window.formatPrice(deposit) + '</span>';
    } else {
        depositRow.style.display = 'none';
    }
}

// ── View Switching ─────────────────────────────────────────

function showNewBookingForm() {
    document.getElementById('history-section').style.display = 'none';
    document.getElementById('checkout-section').style.display = 'block';

    // Reset form fields (but preserve preselected package from URL)
    document.getElementById('booking-date').value = prefilledCheckin || '';
    document.getElementById('booking-return').value = prefilledCheckout || '';
    document.getElementById('booking-people').value = prefilledGuests || '1';
    document.getElementById('booking-room-type').value = 'standard';
    document.getElementById('booking-name').value = '';
    document.getElementById('booking-email').value = '';
    document.getElementById('booking-phone').value = '';
    document.getElementById('booking-nationality').value = '';
    document.getElementById('booking-requests').value = '';
    document.getElementById('booking-coupon').value = '';
    document.getElementById('coupon-feedback').innerHTML = '';
    couponCodeApplied = '';
    couponDiscount = 0;

    // Re-prefill from profile if logged in
    if (api.token) {
        api.getProfile().then(function(profile) {
            if (profile.user) {
                document.getElementById('booking-name').value = profile.user.name || '';
                document.getElementById('booking-email').value = profile.user.email || '';
            }
        }).catch(function(){});
    }

    goToStep(1);
    window.scrollTo({ top: document.getElementById('checkout-section').offsetTop - 80, behavior: 'smooth' });
}

function showMyBookingsView() {
    document.getElementById('checkout-section').style.display = 'none';
    document.getElementById('history-section').style.display = 'block';
    selectedItem = null;
    selectedType = '';
    currentStep = 1;
    document.getElementById('booking-type').value = '';
    document.getElementById('booking-item-id').value = '';
    goToStep(1);
}

function switchBookingTab(status) {
    bookingsFilter = status;
    document.querySelectorAll('.booking-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelector('.booking-tab[data-status="' + status + '"]').classList.add('active');
    renderBookings();
}

// ── Review Population ──────────────────────────────────────

function populateReview() {
    if (!selectedItem) return;

    var imgUrl = '/assets/images/placeholder.svg';
    if (selectedItem.images && selectedItem.images.length > 0) {
        var img = selectedItem.images.find(function(i) { return i.is_primary; }) || selectedItem.images[0];
        if (img) imgUrl = img.image_url;
    }

    var price = getBasePrice();
    var label = selectedType === 'hotel' ? '/night' : '/person';

    document.getElementById('review-package-content').innerHTML = '<div class="review-package-card">'
        + '<img src="' + imgUrl + '" alt="" onerror="this.src=\'/assets/images/placeholder.svg\'">'
        + '<div><strong>' + escapeHTML(selectedItem.title || selectedItem.name || '') + '</strong>'
        + '<span style="display:block;color:var(--text-secondary);font-size:0.85rem;text-transform:capitalize;">' + selectedType + ' · ' + window.formatPrice(price) + ' ' + label + '</span></div></div>';

    document.getElementById('review-dates-content').innerHTML = ''
        + '<div class="review-field"><label>Travel Date</label><span>' + (document.getElementById('booking-date').value || '-') + '</span></div>'
        + '<div class="review-field"><label>Return Date</label><span>' + (document.getElementById('booking-return').value || '-') + '</span></div>'
        + '<div class="review-field"><label>Travelers</label><span>' + getGuests() + '</span></div>'
        + (selectedType === 'hotel' ? '<div class="review-field"><label>Room Type</label><span style="text-transform:capitalize;">' + (document.getElementById('booking-room-type').value || 'Standard') + '</span></div>' : '');

    document.getElementById('review-guest-content').innerHTML = ''
        + '<div class="review-field"><label>Name</label><span>' + escapeHTML(document.getElementById('booking-name').value || '-') + '</span></div>'
        + '<div class="review-field"><label>Email</label><span>' + escapeHTML(document.getElementById('booking-email').value || '-') + '</span></div>'
        + '<div class="review-field"><label>Phone</label><span>' + escapeHTML(document.getElementById('booking-phone').value || '-') + '</span></div>'
        + '<div class="review-field"><label>Nationality</label><span>' + escapeHTML(document.getElementById('booking-nationality').value || '-') + '</span></div>'
        + (document.getElementById('booking-requests').value ? '<div class="review-field"><label>Special Requests</label><span>' + escapeHTML(document.getElementById('booking-requests').value) + '</span></div>' : '');

    var payType = document.querySelector('.payment-type-btn.active');
    var payMethod = document.querySelector('#payment-options .selected');
    document.getElementById('review-payment-content').innerHTML = ''
        + '<div class="review-field"><label>Payment</label><span>' + (payType ? (payType.dataset.value === 'deposit' ? 'Deposit (30%)' : 'Full Payment') : 'Full Payment') + '</span></div>'
        + '<div class="review-field"><label>Method</label><span style="text-transform:capitalize;">' + (payMethod ? payMethod.dataset.value : 'M-Pesa') + '</span></div>'
        + (couponCodeApplied ? '<div class="review-field"><label>Coupon</label><span>' + escapeHTML(couponCodeApplied) + '</span></div>' : '');

    updatePriceSummary();
}

// ── Submit Booking ─────────────────────────────────────────

async function submitBooking() {
    var token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    if (!selectedItem) {
        showToast('No item selected', 'warning');
        return;
    }

    var date = document.getElementById('booking-date').value;
    if (!date) { showToast('Please select a date', 'warning'); return; }

    var overlay = document.getElementById('submit-overlay');
    var loadingState = document.getElementById('submit-loading-state');
    var successState = document.getElementById('submit-success-state');
    overlay.style.display = 'flex';
    loadingState.style.display = 'block';
    successState.style.display = 'none';

    var payType = document.querySelector('.payment-type-btn.active');
    var payMethod = document.querySelector('#payment-options .selected');

    var total = calculateTotal();

    try {
        await api.createBooking({
            booking_type: selectedType,
            tour_id: selectedType === 'tour' ? document.getElementById('booking-item-id').value : null,
            hotel_id: selectedType === 'hotel' ? document.getElementById('booking-item-id').value : null,
            travel_date: date,
            return_date: document.getElementById('booking-return').value || null,
            people_count: parseInt(document.getElementById('booking-people').value),
            special_requests: document.getElementById('booking-requests').value,
            guest_name: document.getElementById('booking-name').value,
            guest_email: document.getElementById('booking-email').value,
            guest_phone: document.getElementById('booking-phone').value,
            nationality: document.getElementById('booking-nationality').value,
            room_type: selectedType === 'hotel' ? (document.getElementById('booking-room-type')?.value || null) : null,
            payment_method: payMethod ? payMethod.dataset.value : 'mpesa',
            payment_type: payType ? payType.dataset.value : 'full',
            coupon_code: couponCodeApplied
        });
        loadingState.style.display = 'none';
        successState.style.display = 'block';
        await new Promise(function(r) { setTimeout(r, 1800); });
        overlay.style.display = 'none';
        showMyBookingsView();
        loadMyBookings();
        showToast('Booking submitted successfully! Awaiting confirmation.', 'success');
    } catch (err) {
        overlay.style.display = 'none';
        showToast(err.message, 'error');
    }
}

// ── Initialization ─────────────────────────────────────────

function initDatePickers() {
    var dateInput = document.getElementById('booking-date');
    var returnInput = document.getElementById('booking-return');

    dateInput.setAttribute('min', todayStr);
    returnInput.setAttribute('min', todayStr);

    if (typeof flatpickr !== 'undefined') {
        var dateOpts = {
            minDate: todayStr,
            dateFormat: 'Y-m-d',
            disableMobile: true,
            onChange: function(selectedDates, dateStr) {
                dateInput.value = dateStr;
                returnPicker.set('minDate', dateStr || todayStr);
                updatePriceSummary();
            }
        };
        var returnOpts = {
            minDate: todayStr,
            dateFormat: 'Y-m-d',
            disableMobile: true,
            onChange: function(selectedDates, dateStr) {
                returnInput.value = dateStr;
                updatePriceSummary();
            }
        };
        var datePicker = flatpickr(dateInput, dateOpts);
        var returnPicker = flatpickr(returnInput, returnOpts);
    }

    dateInput.addEventListener('change', function() {
        var d = this.value;
        returnInput.min = d || todayStr;
        if (returnInput.value && returnInput.value < d) returnInput.value = '';
        updatePriceSummary();
    });
    returnInput.addEventListener('change', updatePriceSummary);
}

async function initCheckout() {
    initDatePickers();
    await loadPackages();

    var nameInput = document.getElementById('booking-name');
    var emailInput = document.getElementById('booking-email');
    if (api.token) {
        try {
            var profile = await api.getProfile();
            if (profile.user) {
                nameInput.value = profile.user.name || '';
                emailInput.value = profile.user.email || '';
            }
        } catch (e) {}
    }

    if (preselectedTour) {
        try {
            var res = await api.getTour(preselectedTour);
            var item = res.tour || res;
            selectPackage(item, 'tour');
        } catch (e) { console.error(e); }
    } else if (preselectedHotel) {
        try {
            var res = await api.getHotel(preselectedHotel);
            var item = res.hotel || res;
            selectPackage(item, 'hotel');
        } catch (e) { console.error(e); }
    }

    if (prefilledCheckin) document.getElementById('booking-date').value = prefilledCheckin;
    if (prefilledCheckout) document.getElementById('booking-return').value = prefilledCheckout;
    if (prefilledGuests) document.getElementById('booking-people').value = prefilledGuests;

    if (preselectedTour || preselectedHotel) {
        showNewBookingForm();
    }
}

function setupPaymentSelection() {
    document.querySelectorAll('.payment-option-card').forEach(function(card) {
        card.addEventListener('click', function() {
            var parent = this.closest('.payment-options-grid');
            parent.querySelectorAll('.payment-option-card').forEach(function(c) { c.classList.remove('selected'); });
            this.classList.add('selected');
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
}

// ── Coupon ─────────────────────────────────────────────────

document.getElementById('apply-coupon-btn')?.addEventListener('click', function() {
    var code = document.getElementById('booking-coupon').value.trim().toUpperCase();
    var fb = document.getElementById('coupon-feedback');
    if (!code) {
        fb.innerHTML = '<span style="color:var(--text-secondary);">Enter a coupon code</span>';
        return;
    }
    // For now, just validate that it looks like a code — custom coupons can be added per-package
    if (code === 'SAVE10') {
        couponDiscount = 10;
        couponCodeApplied = code;
        fb.innerHTML = '<span style="color:#047857;">✓ Coupon applied! 10% discount</span>';
    } else {
        couponDiscount = 0;
        couponCodeApplied = '';
        fb.innerHTML = '<span style="color:#b91c1c;">Invalid coupon code</span>';
    }
    updatePriceSummary();
});

// ── Payment Type Toggle ───────────────────────────────────

document.getElementById('pay-type-full')?.addEventListener('click', function() {
    document.querySelectorAll('.payment-type-btn').forEach(function(b) { b.classList.remove('active'); });
    this.classList.add('active');
    updatePriceSummary();
});

document.getElementById('pay-type-deposit')?.addEventListener('click', function() {
    document.querySelectorAll('.payment-type-btn').forEach(function(b) { b.classList.remove('active'); });
    this.classList.add('active');
    updatePriceSummary();
});

// ── Package type tabs ──────────────────────────────────────

document.querySelectorAll('.package-type-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.package-type-tab').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
        renderPackageGrid(this.dataset.type);
    });
});

// ── Package search ─────────────────────────────────────────

document.getElementById('package-search')?.addEventListener('input', function() {
    var q = this.value.toLowerCase().trim();
    var results = document.getElementById('package-search-results');
    if (!q) { results.innerHTML = ''; results.style.display = 'none'; return; }

    var matches = [];
    allPackages.tours.forEach(function(t) {
        if ((t.title || '').toLowerCase().includes(q) || (t.location || '').toLowerCase().includes(q)) {
            matches.push({ item: t, type: 'tour' });
        }
    });
    allPackages.hotels.forEach(function(h) {
        if ((h.name || '').toLowerCase().includes(q) || (h.location || '').toLowerCase().includes(q)) {
            matches.push({ item: h, type: 'hotel' });
        }
    });
    matches = matches.slice(0, 10);

    if (matches.length === 0) {
        results.innerHTML = '<div class="pkg-search-empty">No results found</div>';
        results.style.display = 'block';
        return;
    }

    var html = '';
    matches.forEach(function(m) {
        var price = m.type === 'hotel' ? m.item.price_per_night : m.item.price;
        var label = m.type === 'hotel' ? '/night' : '/person';
        html += '<div class="pkg-search-item" data-id="' + (m.item.id || m.item._id) + '" data-type="' + m.type + '">'
            + '<strong>' + escapeHTML(m.item.title || m.item.name || '') + '</strong>'
            + '<span style="color:var(--text-secondary);font-size:0.8rem;">' + escapeHTML(m.item.location || '') + ' · ' + window.formatPrice(price) + ' ' + label + '</span>'
            + '</div>';
    });
    results.innerHTML = html;
    results.style.display = 'block';

    results.querySelectorAll('.pkg-search-item').forEach(function(el) {
        el.addEventListener('click', function() {
            var id = this.dataset.id;
            var t = this.dataset.type;
            var found = allPackages[t + 's'].find(function(p) { return (p.id || p._id) === id; });
            if (found) {
                selectPackage(found, t);
                results.style.display = 'none';
                document.getElementById('package-search').value = '';
            }
        });
    });
});

document.addEventListener('click', function(e) {
    var results = document.getElementById('package-search-results');
    if (results && !e.target.closest('.package-search-wrap')) {
        results.style.display = 'none';
    }
});

// ── Booking History ────────────────────────────────────────

var bookingsFilter = 'all';

async function loadMyBookings() {
    var container = document.getElementById('bookings-list');
    var token = localStorage.getItem('token');
    if (!token) {
        container.innerHTML = '<div class="booking-empty"><i class="fas fa-user-lock"></i><h3>Login to view your bookings</h3><p>Sign in to see your booking history.</p></div>';
        return;
    }

    try {
        var result = await api.getUserBookings();
        allBookings = result.bookings || [];
        renderBookings();
    } catch (err) {
        container.innerHTML = '<div class="booking-empty"><h3>Could not load bookings</h3></div>';
    }
}

function renderBookings() {
    var container = document.getElementById('bookings-list');
    var filtered = allBookings;
    if (bookingsFilter !== 'all') {
        filtered = allBookings.filter(function(b) { return b.status === bookingsFilter; });
    }

    if (filtered.length === 0) {
        container.innerHTML = '<div class="booking-empty"><h3>No ' + (bookingsFilter !== 'all' ? bookingsFilter : '') + ' bookings</h3><p>' + (allBookings.length === 0 ? 'Create your first booking above.' : 'No bookings match this filter.') + '</p></div>';
        return;
    }

    var html = '<div class="booking-cards">';

    filtered.forEach(function(b) {
        var details = b.booking_type;
        var location = '';
        var imgUrl = '/assets/images/placeholder.svg';
        if (b.tour) {
            details = b.tour.title || b.booking_type;
            location = b.tour.location || '';
            if (b.tour.images && b.tour.images.length) {
                var img = b.tour.images.find(function(i) { return i.is_primary; }) || b.tour.images[0];
                if (img) imgUrl = img.image_url;
            }
        } else if (b.hotel) {
            details = b.hotel.name || b.booking_type;
            location = b.hotel.location || '';
            if (b.hotel.images && b.hotel.images.length) {
                var img = b.hotel.images.find(function(i) { return i.is_primary; }) || b.hotel.images[0];
                if (img) imgUrl = img.image_url;
            }
        }

        var statusBadge = { pending: 'badge-warning', confirmed: 'badge-success', cancelled: 'badge-danger', completed: 'badge-info', no_show: 'badge-secondary' }[b.status] || 'badge-secondary';
        var displayPayment = { unpaid: 'Unpaid', partially_paid: 'Partial', fully_paid: 'Paid', refunded: 'Refunded' }[b.payment_status] || b.payment_status;
        var paymentBadge = { unpaid: 'badge-danger', partially_paid: 'badge-warning', fully_paid: 'badge-success', refunded: 'badge-info' }[b.payment_status] || 'badge-secondary';
        var typeBadge = { tour: 'badge-info', hotel: 'badge-success' }[b.booking_type] || 'badge-info';

        var actionsHtml = '';
        if ((b.status === 'confirmed' || b.status === 'pending') && b.payment_status !== 'fully_paid') {
            actionsHtml += '<button class="btn btn-pay" onclick="openPayment(\'' + b.id + '\', \'' + (b.total_amount || 0) + '\')">Pay</button>';
        }
        actionsHtml += '<button class="btn" onclick="printReceipt(\'' + b.id + '\')">Receipt</button>';

        var dateStr = b.travel_date || '';
        if (b.return_date) dateStr += ' → ' + b.return_date;

        html += '<div class="booking-card">'
            + '<img class="booking-card-img" src="' + imgUrl + '" alt="' + escapeHTML(details) + '" onerror="this.src=\'/assets/images/placeholder.svg\'">'
            + '<div class="booking-card-body">'
                + '<div class="booking-card-top">'
                    + '<h3 class="booking-card-name">' + escapeHTML(details) + '</h3>'
                    + (location ? '<div class="booking-card-location">' + escapeHTML(location) + '</div>' : '')
                + '</div>'
                + '<div class="booking-card-badges">'
                    + '<span class="badge ' + typeBadge + '" style="text-transform:capitalize;">' + b.booking_type + '</span>'
                    + '<span class="badge ' + statusBadge + '">' + b.status + '</span>'
                    + '<span class="badge ' + paymentBadge + '">' + displayPayment + '</span>'
                + '</div>'
                + '<div class="booking-card-meta">'
                    + '<div><span class="ml">Dates</span><span class="mv">' + dateStr + '</span></div>'
                    + '<div><span class="ml">Guests</span><span class="mv">' + (b.people_count || 1) + '</span></div>'
                    + (b.total_amount ? '<div><span class="ml">Total</span><span class="mv price-amount" data-kes="' + b.total_amount + '">' + window.formatPrice(b.total_amount) + '</span></div>' : '')
                + '</div>'
                + '<div class="booking-card-bottom">'
                    + '<span class="booking-card-date">' + (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '') + '</span>'
                    + '<div class="booking-card-actions">' + actionsHtml + '</div>'
                + '</div>'
            + '</div>'
        + '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

function openPayment(bookingId, amount) {
    document.getElementById('pay-booking-id').value = bookingId;
    document.getElementById('pay-amount').value = amount || '';
    openModal('payment-modal');
}

document.getElementById('payment-form')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    var btn = this.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Processing...';
    try {
        var selectedMethod = document.querySelector('#pay-modal-options .selected')?.dataset?.value || 'mpesa';
        await api.createPayment({
            booking_id: document.getElementById('pay-booking-id').value,
            amount: parseFloat(document.getElementById('pay-amount').value),
            payment_method: selectedMethod,
            payment_type: 'full',
            transaction_ref: document.getElementById('pay-ref').value
        });
        showToast('Payment request submitted! We will contact you with instructions.', 'success');
        closeModal('payment-modal');
        this.reset();
        loadMyBookings();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Submit Payment Request';
    }
});

function printReceipt(bookingId) {
    var b = allBookings.find(function(x) { return x.id === bookingId; });
    if (!b) { showToast('Booking not found', 'error'); return; }

    var details = b.booking_type;
    var location = '';
    var imgHtml = '';
    if (b.tour) {
        details = b.tour.title || b.booking_type;
        location = b.tour.location || '';
        if (b.tour.images && b.tour.images.length) {
            var img = b.tour.images.find(function(i) { return i.is_primary; }) || b.tour.images[0];
            imgHtml = '<img src="' + img.image_url + '" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:1rem;" onerror="this.style.display=\'none\'">';
        }
    } else if (b.hotel) {
        details = b.hotel.name || b.booking_type;
        location = b.hotel.location || '';
        if (b.hotel.images && b.hotel.images.length) {
            var img = b.hotel.images.find(function(i) { return i.is_primary; }) || b.hotel.images[0];
            imgHtml = '<img src="' + img.image_url + '" style="width:100%;height:160px;object-fit:cover;border-radius:8px;margin-bottom:1rem;" onerror="this.style.display=\'none\'">';
        }
    }

    var statusColors = { pending: '#F59E0B', confirmed: '#10B981', cancelled: '#EF4444', completed: '#3B82F6', no_show: '#6B7280' };
    var payLabels = { unpaid: 'Unpaid', partially_paid: 'Partially Paid', fully_paid: 'Paid', refunded: 'Refunded' };

    var win = window.open('', '_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Booking Receipt - Kabura Adventures</title>'
        + '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">'
        + '<style>'
        + '* { margin: 0; padding: 0; box-sizing: border-box; }'
        + 'body { font-family: Inter, sans-serif; background: #f6f7f3; padding: 2.5rem 1rem; color: #172019; }'
        + '.receipt { max-width: 680px; margin: 0 auto; background: #fff; border-radius: 20px; box-shadow: 0 8px 40px rgba(0,0,0,0.08); overflow: hidden; }'
        + '.receipt-header { background: #122218; padding: 2.5rem 2.5rem 2rem; color: #fff; position: relative; overflow: hidden; }'
        + '.receipt-header::after { content: ""; position: absolute; top: -40px; right: -40px; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.04); }'
        + '.receipt-header::before { content: ""; position: absolute; bottom: -60px; left: 30%; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.03); }'
        + '.receipt-header img { height: 40px; margin-bottom: 1.2rem; position: relative; z-index: 1; }'
        + '.receipt-header h1 { font-family: Poppins, sans-serif; font-size: 1.15rem; font-weight: 600; position: relative; z-index: 1; letter-spacing: -0.01em; }'
        + '.receipt-header .receipt-id { font-size: 0.8rem; opacity: 0.55; margin-top: 0.35rem; font-weight: 500; position: relative; z-index: 1; }'
        + '.receipt-body { padding: 2rem 2.5rem 2.5rem; }'
        + '.receipt-badge { display: inline-block; padding: 0.3rem 0.85rem; border-radius: 999px; font-size: 0.72rem; font-weight: 700; text-transform: capitalize; letter-spacing: 0.3px; }'
        + '.receipt-section { margin-bottom: 1.5rem; }'
        + '.receipt-section:last-child { margin-bottom: 0; }'
        + '.receipt-section h3 { font-family: Poppins, sans-serif; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 0.75rem; font-weight: 600; }'
        + '.receipt-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }'
        + '.receipt-field label { display: block; font-size: 0.68rem; color: #999; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.2rem; font-weight: 600; }'
        + '.receipt-field .value { font-weight: 600; font-size: 0.9rem; color: #172019; }'
        + '.receipt-divider { border: none; border-top: 1px solid #f0f0f0; margin: 1.5rem 0; }'
        + '.receipt-total-row { display: flex; justify-content: space-between; align-items: center; padding: 0.3rem 0; }'
        + '.receipt-total-row .label { font-size: 0.85rem; color: #666; }'
        + '.receipt-total-row .amount { font-weight: 700; font-size: 1.3rem; color: #122218; font-family: Poppins, sans-serif; }'
        + '.receipt-footer { text-align: center; padding: 1.5rem 2.5rem; border-top: 1px solid #f0f0f0; font-size: 0.75rem; color: #999; line-height: 1.7; }'
        + '.receipt-footer strong { color: #666; }'
        + '@media print { body { background: #fff; padding: 0; } .receipt { box-shadow: none; border-radius: 0; } .no-print { display: none; } }'
        + '.no-print { text-align: center; margin-top: 1.25rem; }'
        + '.no-print button { background: #122218; color: #fff; border: none; padding: 0.65rem 2.5rem; border-radius: 60px; font-weight: 700; cursor: pointer; font-family: Inter, sans-serif; font-size: 0.85rem; transition: background 0.2s; }'
        + '.no-print button:hover { background: #333; }'
        + '</style></head><body>'
        + '<div class="receipt">'
        + '<div class="receipt-header">'
        + '<img src="/assets/images/kabura-logo.png" alt="Kabura Adventures" onerror="this.style.display=\'none\'">'
        + '<h1>Booking Receipt</h1>'
        + '<div class="receipt-id">Ref: #KBA-' + b.id.slice(0,8).toUpperCase() + '</div>'
        + '</div>'
        + '<div class="receipt-body">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem;">'
        + '<span class="receipt-badge" style="background:' + (statusColors[b.status] || '#6B7280') + '12;color:' + (statusColors[b.status] || '#6B7280') + ';border:1px solid ' + (statusColors[b.status] || '#6B7280') + '25;">' + b.status + '</span>'
        + '<span style="font-size:0.8rem;color:#999;">' + (b.created_at ? new Date(b.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }) : '') + '</span>'
        + '</div>'
        + imgHtml
        + '<div class="receipt-section"><h3>Booking Details</h3><div class="receipt-grid">'
        + '<div class="receipt-field"><label>Type</label><div class="value" style="text-transform:capitalize;">' + b.booking_type + '</div></div>'
        + '<div class="receipt-field"><label>Destination</label><div class="value">' + escapeHTML(location || 'Kenya') + '</div></div>'
        + '<div class="receipt-field"><label>Package</label><div class="value">' + escapeHTML(details) + '</div></div>'
        + '<div class="receipt-field"><label>Guests</label><div class="value">' + (b.people_count || 1) + '</div></div>'
        + '<div class="receipt-field"><label>Travel Date</label><div class="value">' + (b.travel_date || '-') + '</div></div>'
        + '<div class="receipt-field"><label>Return Date</label><div class="value">' + (b.return_date || '-') + '</div></div>'
        + (b.room_type ? '<div class="receipt-field"><label>Room Type</label><div class="value" style="text-transform:capitalize;">' + b.room_type + '</div></div>' : '')
        + '</div></div>'
        + '<hr class="receipt-divider">'
        + '<div class="receipt-section"><h3>Guest Information</h3><div class="receipt-grid">'
        + '<div class="receipt-field"><label>Name</label><div class="value">' + escapeHTML(b.guest_name || '-') + '</div></div>'
        + '<div class="receipt-field"><label>Email</label><div class="value">' + escapeHTML(b.guest_email || '-') + '</div></div>'
        + '<div class="receipt-field"><label>Phone</label><div class="value">' + escapeHTML(b.guest_phone || '-') + '</div></div>'
        + '<div class="receipt-field"><label>Payment Method</label><div class="value" style="text-transform:capitalize;">' + (b.payment_method || '-') + '</div></div>'
        + '</div></div>'
        + '<hr class="receipt-divider">'
        + '<div class="receipt-section"><h3>Payment Summary</h3>'
        + '<div class="receipt-total-row"><span class="label">Payment Status</span><span class="receipt-badge" style="background:' + (statusColors[b.status] || '#6B7280') + '12;color:' + (statusColors[b.status] || '#6B7280') + ';border:1px solid ' + (statusColors[b.status] || '#6B7280') + '25;font-size:0.7rem;">' + (payLabels[b.payment_status] || b.payment_status) + '</span></div>'
        + '<div class="receipt-total-row" style="margin-top:0.75rem;padding-top:0.75rem;border-top:2px solid #f0f0f0;"><span class="label" style="font-weight:600;">Total Amount</span><span class="amount">' + (b.total_amount ? '<span class="price-amount" data-kes="' + b.total_amount + '">' + window.formatPrice(b.total_amount) + '</span>' : '-') + '</span></div>'
        + (b.special_requests ? '<div style="margin-top:1rem;padding:0.75rem 1rem;background:#f9fafb;border-radius:10px;font-size:0.8rem;color:#666;line-height:1.5;"><strong style="color:#172019;">Special Requests:</strong> ' + escapeHTML(b.special_requests) + '</div>' : '')
        + '</div>'
        + '</div>'
        + '<div class="receipt-footer">'
        + '<strong>Kabura Adventures</strong> &mdash; Explore Kenya\'s Finest Adventures<br>'
        + 'Nairobi, Kenya | info@kaburaadventures.com | +254 700 000 000'
        + '</div>'
        + '</div>'
        + '<div class="no-print"><button onclick="window.print()">Print / Save PDF</button></div>'
        + '</body></html>');
    win.document.close();
}

function downloadBookings() {
    if (!allBookings.length) {
        showToast('No bookings to download', 'warning');
        return;
    }
    var data = bookingsFilter === 'all' ? allBookings : allBookings.filter(function(b) { return b.status === bookingsFilter; });
    var rows = [['Type','Details','Travel Date','Return Date','Guests','Status','Payment Status','Total','Booked On']];
    data.forEach(function(b) {
        var details = b.booking_type;
        if (b.tour) details = b.tour.title;
        else if (b.hotel) details = b.hotel.name;
        rows.push([
            b.booking_type,
            (details || '').replace(/,/g, ' '),
            b.travel_date || '',
            b.return_date || '',
            b.people_count || '',
            b.status || '',
            b.payment_status || '',
            b.total_amount || '',
            b.created_at ? b.created_at.slice(0,10) : ''
        ]);
    });
    var csv = rows.map(function(r) { return r.map(function(c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'my-bookings-' + new Date().toISOString().slice(0,10) + '.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    showToast('Bookings downloaded!', 'success');
}

function escapeHTML(value) {
    if (value == null) return '';
    return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
}

// ── Event Bindings ─────────────────────────────────────────

document.getElementById('download-bookings-btn')?.addEventListener('click', downloadBookings);

document.getElementById('new-booking-btn')?.addEventListener('click', function() {
    var token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    showNewBookingForm();
});

document.getElementById('new-booking-btn-plus')?.addEventListener('click', function() {
    var token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    showNewBookingForm();
});

document.getElementById('back-to-bookings-btn-top')?.addEventListener('click', function() {
    showMyBookingsView();
});

document.getElementById('wizard-next')?.addEventListener('click', nextStep);
document.getElementById('wizard-back')?.addEventListener('click', prevStep);

document.getElementById('submit-booking-btn')?.addEventListener('click', submitBooking);

document.getElementById('change-package-btn')?.addEventListener('click', showPackagePicker);

document.getElementById('booking-date')?.addEventListener('change', updatePriceSummary);
document.getElementById('booking-return')?.addEventListener('change', updatePriceSummary);
document.getElementById('booking-people')?.addEventListener('change', updatePriceSummary);

document.getElementById('back-to-bookings-btn')?.addEventListener('click', function() {
    showMyBookingsView();
});

setupPaymentSelection();
initCheckout();
loadMyBookings();
