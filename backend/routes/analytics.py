from flask import Blueprint, jsonify
from models import db
from models.payment import Payment
from models.booking import Booking
from models.user import User
from models.tour import Tour
from models.hotel import Hotel
from models.flight import FlightRequest
from middleware.auth import admin_required
from datetime import datetime, timedelta
from sqlalchemy import func

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('', methods=['GET'])
@admin_required
def get_analytics(current_user):
    now = datetime.utcnow()

    total_revenue = db.session.query(func.sum(Payment.amount)).filter(
        Payment.status == 'completed'
    ).scalar() or 0

    total_payments = Payment.query.filter_by(status='completed').count()

    revenue_by_method = db.session.query(
        Payment.payment_method,
        func.sum(Payment.amount),
        func.count(Payment.id)
    ).filter(Payment.status == 'completed').group_by(Payment.payment_method).all()

    revenue_by_type = db.session.query(
        Payment.payment_type,
        func.sum(Payment.amount),
        func.count(Payment.id)
    ).filter(Payment.status == 'completed').group_by(Payment.payment_type).all()

    twelve_months_ago = now - timedelta(days=365)
    monthly_revenue = db.session.query(
        func.to_char(Payment.created_at, 'YYYY-MM').label('month'),
        func.sum(Payment.amount).label('total'),
        func.count(Payment.id).label('count')
    ).filter(
        Payment.status == 'completed',
        Payment.created_at >= twelve_months_ago
    ).group_by('month').order_by('month').all()

    total_bookings = Booking.query.count()
    bookings_by_status = db.session.query(
        Booking.status,
        func.count(Booking.id)
    ).group_by(Booking.status).all()

    bookings_by_type = db.session.query(
        Booking.booking_type,
        func.count(Booking.id)
    ).group_by(Booking.booking_type).all()

    pending_bookings = Booking.query.filter_by(status='pending').count()
    confirmed_bookings = Booking.query.filter_by(status='confirmed').count()
    completed_bookings = Booking.query.filter_by(status='completed').count()
    cancelled_bookings = Booking.query.filter_by(status='cancelled').count()

    monthly_bookings = db.session.query(
        func.to_char(Booking.created_at, 'YYYY-MM').label('month'),
        func.count(Booking.id).label('count')
    ).filter(Booking.created_at >= twelve_months_ago
    ).group_by('month').order_by('month').all()

    total_users = User.query.count()
    total_tours = Tour.query.count()
    total_hotels = Hotel.query.count()
    total_flight_requests = FlightRequest.query.count()

    pending_flights = FlightRequest.query.filter_by(status='pending').count()
    new_messages = __import__('models.message', fromlist=['Message']).Message.query.filter_by(is_read=False).count()

    popular_tours = db.session.query(
        Booking.tour_id,
        func.count(Booking.id).label('bookings_count'),
        func.sum(Booking.people_count).label('total_people')
    ).filter(
        Booking.tour_id.isnot(None),
        Booking.status != 'cancelled'
    ).group_by(Booking.tour_id).order_by(func.count(Booking.id).desc()).limit(10).all()

    popular_tours_data = []
    for tour_id, b_count, t_people in popular_tours:
        tour = Tour.query.get(tour_id)
        if tour:
            popular_tours_data.append({
                'title': tour.title,
                'price': float(tour.price) if tour.price else 0,
                'bookings_count': b_count,
                'total_people': t_people,
                'estimated_revenue': float(b_count * (tour.price or 0))
            })

    return jsonify({
        'revenue': {
            'total': float(total_revenue),
            'total_payments': total_payments,
            'by_method': [
                {'method': m, 'total': float(t), 'count': c}
                for m, t, c in revenue_by_method
            ],
            'by_type': [
                {'type': t, 'total': float(a), 'count': c}
                for t, a, c in revenue_by_type
            ],
            'monthly': [
                {'month': m, 'total': float(t), 'count': c}
                for m, t, c in monthly_revenue
            ]
        },
        'bookings': {
            'total': total_bookings,
            'pending': pending_bookings,
            'confirmed': confirmed_bookings,
            'completed': completed_bookings,
            'cancelled': cancelled_bookings,
            'by_status': [
                {'status': s, 'count': c} for s, c in bookings_by_status
            ],
            'by_type': [
                {'type': t, 'count': c} for t, c in bookings_by_type
            ],
            'monthly': [
                {'month': m, 'count': c} for m, c in monthly_bookings
            ]
        },
        'platform': {
            'total_users': total_users,
            'total_tours': total_tours,
            'total_hotels': total_hotels,
            'total_flight_requests': total_flight_requests,
            'pending_flights': pending_flights,
            'unread_messages': new_messages,
        },
        'popular_tours': popular_tours_data,
    })
