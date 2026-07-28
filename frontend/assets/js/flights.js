
        document.getElementById('flight-request-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) {
                showToast('Please login to submit a flight request', 'warning');
                openModal('login-modal');
                return;
            }

            const btn = e.target.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Submitting...';

            try {
                await api.createFlightRequest({
                    from_location: document.getElementById('flight-from').value,
                    to_location: document.getElementById('flight-to').value,
                    departure_date: document.getElementById('flight-departure').value,
                    return_date: document.querySelector('input[name="journey"]:checked').value === 'round' ? document.getElementById('flight-return').value || null : null,
                    passengers: parseInt(document.getElementById('flight-passengers').value),
                    travel_class: document.getElementById('flight-class').value
                });
                showToast('Flight request submitted! We will get back to you soon.', 'success');
                e.target.reset();
                loadMyRequests();
            } catch (err) {
                showToast(err.message, 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = '<span>Book flight</span>';
            }
        });

        const fromField = document.getElementById('flight-from');
        const toField = document.getElementById('flight-to');
        document.getElementById('swap-route')?.addEventListener('click', () => {
            [fromField.value, toField.value] = [toField.value, fromField.value];
            fromField.focus();
        });

        document.querySelectorAll('input[name="journey"]').forEach((input) => {
            input.addEventListener('change', () => {
                const returnField = document.getElementById('flight-return');
                const isRoundTrip = input.value === 'round' && input.checked;
                returnField.disabled = !isRoundTrip;
                if (!isRoundTrip) returnField.value = '';
            });
        });

        async function loadMyRequests() {
            const container = document.getElementById('my-flight-requests');
            const token = localStorage.getItem('token');
            if (!token) {
                container.innerHTML = '<div class="empty-state"><h3>Login to view your flight requests</h3></div>';
                return;
            }

            try {
                const result = await api.getUserFlightRequests();
                const requests = result.flight_requests;

                if (requests.length === 0) {
                    container.innerHTML = '<div class="empty-state"><h3>No flight requests yet</h3><p>Submit your first request above.</p></div>';
                    return;
                }

                container.innerHTML = `
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Route</th>
                                    <th>Date</th>
                                    <th>Passengers</th>
                                    <th>Status</th>
                                    <th>Quote</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${requests.map(r => `
                                    <tr>
                                        <td>${r.from_location} &rarr; ${r.to_location}</td>
                                        <td>${r.departure_date}</td>
                                        <td>${r.passengers}</td>
                                        <td><span class="badge ${r.status === 'pending' ? 'badge-warning' : r.status === 'quoted' ? 'badge-info' : r.status === 'approved' ? 'badge-success' : r.status === 'rejected' ? 'badge-danger' : 'badge-secondary'}">${r.status}</span></td>
                                        <td>${r.price_quote ? window.priceHTML(r.price_quote) : '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            } catch (err) {
                container.innerHTML = '<div class="empty-state"><h3>Could not load requests</h3></div>';
            }
        }

        loadMyRequests();
