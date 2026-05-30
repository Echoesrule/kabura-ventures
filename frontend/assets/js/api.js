// Kabura Ventures - API Client
const API_BASE = '/api';

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
            const formHeaders = { 'Authorization': this.getHeaders()['Authorization'] };
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
        if (result.token) this.setToken(result.token);
        return result;
    }

    async login(data) {
        const result = await this.post('/auth/login', data);
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
    async setTourPrimaryImage(id) { return this.put(`/tours/images/${id}/primary`); }
    async setHotelPrimaryImage(id) { return this.put(`/hotels/images/${id}/primary`); }
    async getRelatedTours(id) { return this.get(`/tours/${id}/related`); }
    async getActivityTypes() { return this.get('/tours/activity-types'); }

    async getSubscribers(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.get(`/subscribers${query ? '?' + query : ''}`);
    }

    async subscribeNewsletter(data) { return this.post('/subscribers', data); }

    // Reviews
    async createReview(data) { return this.post('/reviews', data); }
    async deleteReview(id) { return this.delete(`/reviews/${id}`); }

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
