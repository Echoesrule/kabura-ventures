/* ── FAQ Data ──────────────────────────────────────────────── */
var faqData = {
    general: {
        title: 'General',
        icon: 'user',
        items: [
            { q: 'How do I create an account?', a: 'Click the user icon in the top-right corner and select "Sign Up". Fill in your name, email, and password. Once registered, you can browse tours, hotels, save items to your wishlist, and make bookings.' },
            { q: 'How do I reset my password?', a: 'On the login page, click "Forgot Password" and enter your registered email address. We\'ll send you a link to reset your password. If you don\'t receive the email within a few minutes, check your spam folder.' },
            { q: 'Is my personal information secure?', a: 'Yes. We use industry-standard encryption to protect your data. Your payment information is processed securely through our trusted partners and is never stored on our servers.' },
            { q: 'How does the currency switcher work?', a: 'You can switch between KES (Kenyan Shillings), USD (US Dollars), and EUR (Euros) using the dropdown in the navigation bar. Prices will automatically convert using live exchange rates.' }
        ]
    },
    bookings: {
        title: 'Bookings',
        icon: 'suitcase',
        items: [
            { q: 'How do I book a tour or hotel?', a: 'Browse our tours or hotels and click "Details" or "View" on any listing. On the detail page, select your preferred date, number of guests, and click "Book Now". Follow the checkout process to confirm your reservation.' },
            { q: 'Can I modify or cancel a booking?', a: 'Yes. Go to "My Bookings" in your account menu to view all your reservations. Depending on the cancellation policy of the specific tour or hotel, you may be able to modify or cancel your booking. Please refer to the terms shown during checkout.' },
            { q: 'How will I know my booking is confirmed?', a: 'After completing your booking, you\'ll receive a confirmation email with your booking reference number. You can also view all your confirmed bookings under "My Bookings" in your account.' },
            { q: 'Can I book for a group?', a: 'Absolutely! During the booking process, you can specify the number of guests. For large groups or corporate retreats, <a href="/services.html#service-corporate">visit our Group & Corporate Travel page</a> or contact us directly for customized packages.' }
        ]
    },
    payments: {
        title: 'Payments',
        icon: 'credit-card',
        items: [
            { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, PayPal, and M-Pesa (Kenya\'s mobile money service). All payments are processed securely through trusted payment gateways.' },
            { q: 'Do you require a deposit?', a: 'Deposit requirements vary by tour or hotel. Most bookings require a 30-50% deposit at the time of booking, with the balance due before or upon arrival. Specific terms are displayed during checkout.' },
            { q: 'What is your refund policy?', a: '<p>Refund policies vary by provider:</p><ul><li><strong>Tours:</strong> Free cancellation up to 48 hours before departure. 50% refund for cancellations within 24-48 hours.</li><li><strong>Hotels:</strong> Free cancellation up to 24 hours before check-in.</li></ul><p>Please refer to the specific terms shown during booking.</p>' }
        ]
    },
    tours: {
        title: 'Tours',
        icon: 'map-pin',
        items: [
            { q: 'What should I pack for a safari?', a: 'We recommend packing light, neutral-colored clothing, comfortable walking shoes, a hat, sunscreen, insect repellent, binoculars, a camera, and a reusable water bottle. For specific tours, a detailed packing list is provided in your booking confirmation.' },
            { q: 'Are meals included in tour packages?', a: 'Meal inclusions vary by tour. Most full-day and multi-day tours include breakfast, lunch, and dinner. Check the specific tour details on the listing page for exact inclusions.' },
            { q: 'What is the maximum group size?', a: 'Group sizes vary by tour type. Our standard safari tours typically accommodate 6-8 guests per vehicle for an intimate experience. Private tours are also available for solo travelers, couples, or groups who prefer a personalized experience.' },
            { q: 'Are children allowed on tours?', a: 'Yes, children are welcome on most tours. Age restrictions may apply for certain adventure activities. Check the specific tour listing for age requirements or <a href="/services.html#service-tours">contact us</a> for family-friendly recommendations.' }
        ]
    },
    hotels: {
        title: 'Hotels',
        icon: 'bed',
        items: [
            { q: 'What types of accommodation do you offer?', a: 'We offer a wide range of accommodation options including luxury lodges, boutique hotels, budget-friendly guesthouses, beach resorts, and tented camps. Use the filters on our <a href="/hotels.html">Hotels page</a> to find the perfect stay for your budget and preferences.' },
            { q: 'Can I request early check-in or late check-out?', a: 'Early check-in and late check-out are subject to availability. You can request these during the booking process or by contacting the property directly. Additional charges may apply.' },
            { q: 'Are airport transfers included?', a: 'Airport transfers are not automatically included in hotel bookings. However, you can add airport transfers through our <a href="/services.html#service-transport">Airport Transfers service</a> or request them when making your reservation.' }
        ]
    },
    policies: {
        title: 'Policies',
        icon: 'shield',
        items: [
            { q: 'Cancellation Policy', a: 'We offer free cancellation up to 48 hours before departure for tours and 24 hours before check-in for hotels. Cancellations within these windows may incur partial charges. Please refer to the specific terms shown during booking.' },
            { q: 'Refund Policy', a: 'Refunds are processed within 5-10 business days to the original payment method. The refund amount depends on the cancellation timing and the provider\'s policy. Contact us for any refund-related queries.' },
            { q: 'Privacy Policy', a: 'We respect your privacy and protect your personal data using industry-standard encryption. We never sell or share your information with third parties. Read our full privacy policy for detailed information.' },
            { q: 'Terms & Conditions', a: 'By using our services, you agree to our terms and conditions covering bookings, payments, cancellations, and liability. Please review them carefully before making a reservation.' }
        ]
    }
};

var activeCategory = null;

/* ── Init ──────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function() {
    var searchIcon = document.getElementById('help-search-icon');
    if (searchIcon) searchIcon.innerHTML = svgIcon('search', { size: 20, color: 'var(--text-secondary)' });

    var catIcons = {
        'cat-general':  'user',
        'cat-bookings': 'suitcase',
        'cat-payments': 'credit-card',
        'cat-tours':    'map-pin',
        'cat-hotels':   'bed',
        'cat-policies': 'shield',
        'cat-support':  'headset'
    };
    Object.keys(catIcons).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = svgIcon(catIcons[id], { size: 26, color: 'var(--primary)' });
    });

    var supportIcon = document.getElementById('support-icon');
    if (supportIcon) supportIcon.innerHTML = svgIcon('headset', { size: 32, color: '#fff' });

    var contactIcons = {
        'contact-email-icon':    'envelope',
        'contact-phone-icon':    'phone',
        'contact-location-icon': 'map-pin'
    };
    Object.keys(contactIcons).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = svgIcon(contactIcons[id], { size: 22, color: '#fff' });
    });
});

/* ── Show a single category ────────────────────────────────── */
function showCategory(cat) {
    var data = faqData[cat];
    if (!data) return;

    activeCategory = cat;

    var container = document.getElementById('faq-container');
    var section = document.getElementById('help-faqs');
    section.style.display = '';

    var chevron = svgIcon('chevron-down', { size: 18, color: 'var(--text-secondary)' });
    var catIcon = svgIcon(data.icon, { size: 22, color: 'var(--primary)' });

    var html = '<div class="faq-group faq-group--visible">';
    html += '<div class="faq-group-header">';
    html += '<button class="faq-back-btn" onclick="hideCategory()">' + svgIcon('chevron-left', { size: 18, color: 'var(--text-secondary)' }) + ' Back</button>';
    html += '<h2 class="faq-group-title">' + catIcon + data.title + '</h2>';
    html += '</div>';

    data.items.forEach(function(item) {
        html += '<div class="faq-item">';
        html += '<div class="faq-question" onclick="toggleFAQ(this)">' + item.q + '<span class="faq-toggle">' + chevron + '</span></div>';
        html += '<div class="faq-answer"><p>' + item.a + '</p></div>';
        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideCategory() {
    activeCategory = null;
    var section = document.getElementById('help-faqs');
    section.style.display = 'none';
    document.getElementById('faq-container').innerHTML = '';
}

function scrollToSupport() {
    var el = document.getElementById('support');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ── FAQ toggle ────────────────────────────────────────────── */
function toggleFAQ(el) {
    el.parentElement.classList.toggle('open');
}

/* ── Search across all categories ──────────────────────────── */
function filterFAQs(query) {
    var q = query.toLowerCase().trim();
    if (!q) {
        if (activeCategory) showCategory(activeCategory);
        return;
    }

    var container = document.getElementById('faq-container');
    var section = document.getElementById('help-faqs');
    section.style.display = '';
    activeCategory = null;

    var chevron = svgIcon('chevron-down', { size: 18, color: 'var(--text-secondary)' });
    var html = '';

    Object.keys(faqData).forEach(function(cat) {
        var data = faqData[cat];
        var matches = data.items.filter(function(item) {
            return item.q.toLowerCase().indexOf(q) !== -1 || item.a.toLowerCase().indexOf(q) !== -1;
        });
        if (matches.length === 0) return;

        var catIcon = svgIcon(data.icon, { size: 22, color: 'var(--primary)' });
        html += '<div class="faq-group faq-group--visible">';
        html += '<h2 class="faq-group-title">' + catIcon + data.title + '</h2>';
        matches.forEach(function(item) {
            html += '<div class="faq-item">';
            html += '<div class="faq-question" onclick="toggleFAQ(this)">' + highlightMatch(item.q, q) + '<span class="faq-toggle">' + chevron + '</span></div>';
            html += '<div class="faq-answer"><p>' + item.a + '</p></div>';
            html += '</div>';
        });
        html += '</div>';
    });

    if (!html) {
        html = '<div class="faq-empty">No results found for "' + escHtml(query) + '"</div>';
    }

    container.innerHTML = html;
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function highlightMatch(text, query) {
    var idx = text.toLowerCase().indexOf(query);
    if (idx === -1) return text;
    return text.substring(0, idx) + '<mark>' + text.substring(idx, idx + query.length) + '</mark>' + text.substring(idx + query.length);
}

function escHtml(str) {
    var d = document.createElement('div');
    d.appendChild(document.createTextNode(str));
    return d.innerHTML;
}
