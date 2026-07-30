// Kabura Ventures - API Client
const API_BASE = location.hostname === 'kabura-ventures.onrender.com'
    ? 'https://kabura-ventures.onrender.com/api'
    : location.origin + '/api';
window.API_BASE = API_BASE;

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('token');
    }

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(method, endpoint, data = null) {
        const url = `${API_BASE}${endpoint}`;
        const options = { method, headers: this.getHeaders() };

        if (data && !(data instanceof FormData)) {
            options.body = JSON.stringify(data);
        } else if (data instanceof FormData) {
            const formHeaders = { ...this.getHeaders() };
            delete formHeaders['Content-Type'];
            if (!formHeaders.Authorization) {
                delete formHeaders.Authorization;
            }
            options.headers = formHeaders;
            options.body = data;
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Request failed');
            }

            return result;
        } catch (error) {
            if (error.message === 'Token has expired') {
                this.setToken(null);
                window.location.href = '/';
            }
            throw error;
        }
    }

    get(endpoint) { return this.request('GET', endpoint); }
    post(endpoint, data) { return this.request('POST', endpoint, data); }
    put(endpoint, data) { return this.request('PUT', endpoint, data); }
    delete(endpoint) { return this.request('DELETE', endpoint); }

    // Auth
    async register(data) {
        const result = await this.post('/auth/register', data);
        return result;
    }

    async login(data) {
        const result = await this.post('/auth/login', data);
        if (result.token) this.setToken(result.token);
        return result;
    }

    async sendOtp(email) {
        return this.post('/auth/send-otp', { email });
    }

    async verifyEmail(email, token) {
        const result = await this.post('/auth/verify-email', { email, token });
        if (result.token) this.setToken(result.token);
        return result;
    }

    logout() {
        this.setToken(null);
        window.location.href = '/';
    }

    async getProfile() { return this.get('/auth/profile'); }
    async updateProfile(data) { return this.put('/auth/profile', data); }

    // Tours
    async getTours(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/tours${query ? '?' + query : ''}`);
    }

    async getTour(id) { return this.get(`/tours/${id}`); }
    async createTour(data) { return this.post('/tours', data); }
    async updateTour(id, data) { return this.put(`/tours/${id}`, data); }
    async deleteTour(id) { return this.delete(`/tours/${id}`); }
    async deleteTourImage(id) { return this.delete(`/tours/images/${id}`); }

    // Destinations
    async getDestinations() { return this.get('/destinations'); }
    async getAllDestinationsAdmin() { return this.get('/destinations/all'); }
    async createDestination(data) { return this.post('/destinations', data); }
    async updateDestination(id, data) { return this.put(`/destinations/${id}`, data); }
    async deleteDestination(id) { return this.delete(`/destinations/${id}`); }

    // Offers / What We Offer
    async getOffers() { return this.get('/offers'); }
    async getAllOffersAdmin() { return this.get('/offers/all'); }
    async createOffer(data) { return this.post('/offers', data); }
    async updateOffer(id, data) { return this.put(`/offers/${id}`, data); }
    async deleteOffer(id) { return this.delete(`/offers/${id}`); }

    // Testimonials
    async getTestimonials() { return this.get('/testimonials'); }
    async getAllTestimonialsAdmin() { return this.get('/testimonials/all'); }
    async createTestimonial(data) { return this.post('/testimonials', data); }
    async updateTestimonial(id, data) { return this.put(`/testimonials/${id}`, data); }
    async deleteTestimonial(id) { return this.delete(`/testimonials/${id}`); }

    // Page Content (homepage sections)
    async getPageContent() { return this.get('/page-content'); }
    async getSection(key) { return this.get(`/page-content/${key}`); }
    async saveSection(data) { return this.post('/page-content', data); }
    async deleteSection(key) { return this.delete(`/page-content/${key}`); }

    // Bookings
    async createBooking(data) { return this.post('/bookings', data); }
    async getUserBookings() { return this.get('/bookings/user'); }
    async getBooking(id) { return this.get(`/bookings/${id}`); }
    async getAllBookings(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/bookings${query ? '?' + query : ''}`);
    }
    async updateBookingStatus(id, data) { return this.put(`/bookings/${id}/status`, data); }

    // Flights
    async createFlightRequest(data) { return this.post('/flights/request', data); }
    async getUserFlightRequests() { return this.get('/flights/user'); }
    async getAllFlightRequests(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/flights${query ? '?' + query : ''}`);
    }
    async updateFlightRequest(id, data) { return this.put(`/flights/${id}`, data); }

    // Hotels
    async getHotels(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/hotels${query ? '?' + query : ''}`);
    }
    async getHotel(id) { return this.get(`/hotels/${id}`); }
    async createHotel(data) { return this.post('/hotels', data); }
    async updateHotel(id, data) { return this.put(`/hotels/${id}`, data); }
    async deleteHotel(id) { return this.delete(`/hotels/${id}`); }

    // Payments
    async createPayment(data) { return this.post('/payments', data); }
    async getPayments() { return this.get('/payments'); }

    // Media
    async getHeroMedia() { return this.get('/media/hero'); }
    async uploadHeroMedia(data) { return this.post('/media/hero', data); }
    async deleteHeroMedia(id) { return this.delete(`/media/hero/${id}`); }
    async reorderHeroMedia(data) { return this.put('/media/hero/reorder', data); }
    async deleteHotelImage(id) { return this.delete(`/hotels/images/${id}`); }

    // Auth Slides (login/register carousel)
    async getAuthSlides() { return this.get('/media/auth-slides'); }
    async createAuthSlide(data) { return this.post('/media/auth-slides', data); }
    async updateAuthSlide(id, data) { return this.put(`/media/auth-slides/${id}`, data); }
    async deleteAuthSlide(id) { return this.delete(`/media/auth-slides/${id}`); }
    async reorderAuthSlides(data) { return this.put('/media/auth-slides/reorder', data); }
    async setTourPrimaryImage(id) { return this.put(`/tours/images/${id}/primary`); }
    async setHotelPrimaryImage(id) { return this.put(`/hotels/images/${id}/primary`); }
    async getRelatedTours(id) { return this.get(`/tours/${id}/related`); }
    async getActivityTypes() { return this.get('/tours/activity-types'); }
    async createActivityType(name) { return this.post('/tours/activity-types', { name: name }); }
    async deleteActivityType(name) { return this.delete('/tours/activity-types/' + encodeURIComponent(name)); }

    async getSubscribers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/subscribers${query ? '?' + query : ''}`);
    }

    async subscribeNewsletter(data) { return this.post('/subscribers', data); }

    // Reviews
    async getReviews(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/reviews${query ? '?' + query : ''}`);
    }
    async createReview(data) { return this.post('/reviews', data); }
    async deleteReview(id) { return this.delete(`/reviews/${id}`); }
    async likeReview(id) { return this.post(`/reviews/${id}/like`); }
    async dislikeReview(id) { return this.post(`/reviews/${id}/dislike`); }
    async replyToReview(id, reply) { return this.post(`/reviews/${id}/reply`, { reply }); }
    async seedReviews(count = 50) { return this.post(`/reviews/seed?count=${count}`); }
    async seedAll(users = 50, reviews = 50) { return this.post(`/reviews/seed-all?users=${users}&reviews=${reviews}`); }

    // Wishlist
    async getWishlist() { return this.get('/wishlist'); }
    async addToWishlist(data) { return this.post('/wishlist', data); }
    async removeFromWishlist(id) { return this.delete(`/wishlist/${id}`); }
    async checkWishlist(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/wishlist/check${query ? '?' + query : ''}`);
    }

    // Availability
    async getAvailability(tourId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/availability/${tourId}${query ? '?' + query : ''}`);
    }

    // Currencies
    async getCurrencies() { return this.get('/currencies'); }

    // Blogs
    async getBlogs(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/blogs${query ? '?' + query : ''}`);
    }
    async getBlog(slug) { return this.get(`/blogs/${slug}`); }
    async getBlogCategories() { return this.get('/blogs/categories'); }
    async getAllBlogsAdmin(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/blogs/admin/all${query ? '?' + query : ''}`);
    }
    async createBlog(data) { return this.post('/blogs', data); }
    async updateBlog(id, data) { return this.put(`/blogs/${id}`, data); }
    async deleteBlog(id) { return this.delete(`/blogs/${id}`); }

    // Search
    async searchAll(q) { return this.get(`/search?q=${encodeURIComponent(q)}`); }

    // Messages
    async sendMessage(data) { return this.post('/messages', data); }
    async getMessages(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/messages${query ? '?' + query : ''}`);
    }
    async getMyMessages(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/messages/me${query ? '?' + query : ''}`);
    }
    async clearMyMessages() { return this.delete('/messages/me'); }
    async sendAdminMessage(data) { return this.post('/messages/send', data); }
    async markMessageRead(id) { return this.put(`/messages/${id}/read`); }
    async replyToMessage(id, data) { return this.put(`/messages/${id}/reply`, data); }
    async deleteMessage(id) { return this.delete(`/messages/${id}`); }

    // Analytics
    async getAnalytics() { return this.get('/analytics'); }
}

const api = new ApiClient();
