from models.flight import FlightRequest
from models import db
from utils.helpers import validate_number, sanitize_input
from services.base import ServiceError


def get_all_flight_requests(page=1, per_page=20, status=None):
    query = FlightRequest.query
    if status:
        query = query.filter_by(status=status)
    query = query.order_by(FlightRequest.created_at.desc())
    requests = query.paginate(page=page, per_page=per_page, error_out=False)
    return [r.to_dict() for r in requests.items], {
        'total': requests.total, 'page': requests.page,
        'per_page': requests.per_page, 'pages': requests.pages
    }


def respond_to_flight_request(flight_request, data):
    valid_statuses = ['pending', 'quoted', 'approved', 'rejected', 'booked']
    if 'status' in data:
        if data['status'] not in valid_statuses:
            raise ServiceError(f'Invalid status. Must be one of: {", ".join(valid_statuses)}')
        flight_request.status = data['status']
    if 'price_quote' in data:
        err = validate_number(data['price_quote'], min_val=0, field_name='Price quote')
        if err:
            raise ServiceError(err)
        flight_request.price_quote = float(data['price_quote'])
    if 'admin_notes' in data:
        flight_request.admin_notes = sanitize_input(data['admin_notes'], max_length=2000)
    db.session.commit()
