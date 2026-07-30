from models.booking import Booking
from models import db
from services.base import ServiceError


def get_all_bookings(page=1, per_page=20, status=None, booking_type=None):
    query = Booking.query
    if status:
        query = query.filter_by(status=status)
    if booking_type:
        query = query.filter_by(booking_type=booking_type)
    query = query.order_by(Booking.created_at.desc())
    bookings = query.paginate(page=page, per_page=per_page, error_out=False)
    return [b.to_admin_dict() for b in bookings.items], {
        'total': bookings.total, 'page': bookings.page,
        'per_page': bookings.per_page, 'pages': bookings.pages
    }


def update_booking_status(booking, data):
    valid_statuses = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
    valid_payment = ['unpaid', 'partially_paid', 'fully_paid', 'refunded']

    if 'status' in data:
        if data['status'] not in valid_statuses:
            raise ServiceError(f'Invalid status. Must be one of: {", ".join(valid_statuses)}')
        booking.status = data['status']
    if 'payment_status' in data:
        if data['payment_status'] not in valid_payment:
            raise ServiceError(f'Invalid payment status. Must be one of: {", ".join(valid_payment)}')
        booking.payment_status = data['payment_status']
    db.session.commit()
