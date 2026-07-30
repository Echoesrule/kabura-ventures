import random
from datetime import datetime
from flask import Blueprint, request, jsonify
from models.review import Review
from models.tour import Tour
from models.hotel import Hotel
from models.user import User
from models import db
from middleware.auth import token_required, admin_required
from utils.helpers import validate_required_fields, sanitize_input, validate_number

reviews_bp = Blueprint('reviews', __name__, url_prefix='/api/reviews')

@reviews_bp.route('', methods=['GET'])
def get_reviews():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 15, type=int)
    tour_id = request.args.get('tour_id')
    hotel_id = request.args.get('hotel_id')

    query = Review.query

    if tour_id == '*':
        query = query.filter(Review.tour_id.isnot(None), Review.hotel_id.is_(None))
    elif tour_id:
        query = query.filter_by(tour_id=tour_id, hotel_id=None)
    if hotel_id == '*':
        query = query.filter(Review.hotel_id.isnot(None), Review.tour_id.is_(None))
    elif hotel_id:
        query = query.filter_by(hotel_id=hotel_id, tour_id=None)

    total = query.count()
    reviews = query.order_by(Review.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        'reviews': [r.to_dict() for r in reviews.items],
        'total': total,
        'page': reviews.page,
        'pages': reviews.pages,
        'per_page': per_page
    }), 200

@reviews_bp.route('', methods=['POST'])
@token_required
def create_review(current_user):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'No data provided'}), 400

    missing = validate_required_fields(data, ['rating'])
    if missing:
        return jsonify({'error': f'Missing fields: {", ".join(missing)}'}), 400

    if not data.get('tour_id') and not data.get('hotel_id'):
        return jsonify({'error': 'Either tour_id or hotel_id is required'}), 400

    rating_err = validate_number(data['rating'], min_val=1, max_val=5, field_name='Rating')
    if rating_err:
        return jsonify({'error': rating_err}), 400

    existing = Review.query.filter_by(
        user_id=current_user['user_id'],
        tour_id=data.get('tour_id'),
        hotel_id=data.get('hotel_id')
    ).first()
    if existing:
        return jsonify({'error': 'You have already reviewed this item'}), 409

    review = Review(
        user_id=current_user['user_id'],
        tour_id=data.get('tour_id'),
        hotel_id=data.get('hotel_id'),
        rating=int(data['rating']),
        comment=sanitize_input(data.get('comment', ''), max_length=2000),
    )
    db.session.add(review)
    db.session.commit()
    return jsonify({'message': 'Review submitted', 'review': review.to_dict()}), 201

@reviews_bp.route('/<review_id>/like', methods=['POST'])
def like_review(review_id):
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    review.likes = (review.likes or 0) + 1
    db.session.commit()
    return jsonify({'likes': review.likes}), 200

@reviews_bp.route('/<review_id>/dislike', methods=['POST'])
def dislike_review(review_id):
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    review.dislikes = (review.dislikes or 0) + 1
    db.session.commit()
    return jsonify({'dislikes': review.dislikes}), 200

@reviews_bp.route('/<review_id>/reply', methods=['POST'])
@admin_required
def reply_review(current_user, review_id):
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    data = request.get_json()
    if not data or not data.get('reply'):
        return jsonify({'error': 'Reply text is required'}), 400
    review.admin_reply = sanitize_input(data['reply'], max_length=2000)
    db.session.commit()
    return jsonify({'message': 'Reply added', 'review': review.to_dict()}), 200

@reviews_bp.route('/seed-all', methods=['POST'])
@admin_required
def seed_all(current_user):
    import traceback
    try:
        user_count = request.args.get('users', 50, type=int)
        review_count = request.args.get('reviews', 50, type=int)
        tours = Tour.query.all()
        if not tours:
            return jsonify({'error': 'No tours found.'}), 400

        first_names = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
                       'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
                       'Charles', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
                       'Donald', 'Ashley', 'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
                       'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah']
        last_names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                      'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
                      'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
                      'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
                      'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts']

        created_users = 0
        for i in range(user_count):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            name = f'{fn} {ln}'
            email = f'{fn.lower()}.{ln.lower()}.{i}_{random.randint(1,9999)}@example.com'
            if User.query.filter_by(email=email).first():
                continue
            user = User(name=name, email=email, phone=f'+2547{random.randint(10000000, 99999999)}', is_verified=True, role='customer')
            user.set_password('Password123!')
            db.session.add(user)
            created_users += 1
        db.session.commit()

        sample_comments = [
            "Absolutely incredible experience! The guides were knowledgeable and the scenery was breathtaking.",
            "Good tour overall. The organization was decent but could be improved.",
            "Not worth the price. The accommodation was below expectations.",
            "A life-changing adventure! Every detail was well planned and executed.",
            "The tour was okay. Some activities were great, others felt rushed.",
            "Amazing wildlife sightings! Our guide went above and beyond.",
            "Disappointed with the food quality throughout the trip.",
            "Perfect for families. The kids loved every moment.",
            "Too many people in the group. Felt crowded at times.",
            "The views were spectacular. Would definitely recommend.",
            "Our guide was late on the first day, but the rest of the trip was smooth.",
            "Luxurious experience from start to finish. Worth every penny.",
            "The vehicle broke down twice which wasted a lot of time.",
            "Very informative guide who knew all the best spots.",
            "I've been on many safaris and this was by far the best organized one.",
            "The itinerary was too packed. Needed more downtime.",
            "Excellent value for money. The included meals were delicious.",
            "Communication before the trip was poor. Had to follow up multiple times.",
            "The sunset game drive was magical! Saw all the Big Five.",
            "Would give 6 stars if I could. An unforgettable journey."
        ]

        complaint_comments = [
            "Terrible experience. The pickup never arrived and no one answered the phone.",
            "Very unsafe driving practices. The driver was speeding on rough roads.",
            "The room had cockroaches and the staff didn't care.",
            "False advertising! The 'luxury tent' was a basic camping tent.",
            "Our luggage was lost and the company refused to compensate.",
            "The guide was rude and unprofessional throughout the trip.",
            "Hidden fees everywhere. Ended up paying double the quoted price.",
            "Medical emergency was ignored. No first aid kit available.",
            "The vehicle was old and uncomfortable. AC didn't work.",
            "Food poisoning from the camp meals. Ruined the entire trip.",
            "Overcrowded. 15 people in a vehicle meant for 8.",
            "The 'expert guide' couldn't identify basic birds or plants.",
            "Booking cancellation policy is a scam. Lost all our money.",
            "Dirty tents and bedding. Clearly not washed between guests.",
            "No wildlife seen despite promises of guaranteed sightings.",
            "The tour operator was 3 hours late at the airport pickup.",
            "Misleading itinerary. Half the listed activities were skipped.",
            "Constant upselling. Felt like a sales pitch not a vacation.",
            "The Wi-Fi promised in the description didn't work at all.",
            "Unsafe area at night. No security measures in place."
        ]

        all_users = User.query.all()
        created_reviews = 0
        for tour in tours:
            existing = Review.query.filter_by(tour_id=tour.id).count()
            needed = review_count - existing
            if needed <= 0:
                continue
            for _ in range(needed):
                user = random.choice(all_users)
                is_complaint = random.random() < 0.2
                if is_complaint:
                    rating = random.choices([1, 2], weights=[60, 40])[0]
                    comment = random.choice(complaint_comments)
                else:
                    rating = random.choices([3, 4, 5], weights=[10, 40, 50])[0]
                    comment = random.choice(sample_comments)
                review = Review(
                    user_id=user.id,
                    tour_id=tour.id,
                    rating=rating,
                    comment=comment,
                    likes=random.randint(0, 15),
                    dislikes=random.randint(0, 5),
                    created_at=datetime.utcnow()
                )
                db.session.add(review)
                created_reviews += 1

        db.session.commit()
        return jsonify({'message': f'Created {created_users} users and {created_reviews} reviews across {len(tours)} tours'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Seed failed: {str(e)}', 'traceback': traceback.format_exc()}), 500

@reviews_bp.route('/seed', methods=['POST'])
@admin_required
def seed_reviews(current_user):
    count = request.args.get('count', 50, type=int)
    tours = Tour.query.all()
    users = User.query.all()
    if not users:
        return jsonify({'error': 'No users found. Create some users first.'}), 400
    if not tours:
        return jsonify({'error': 'No tours found.'}), 400

    sample_comments = [
        "Absolutely incredible experience! The guides were knowledgeable and the scenery was breathtaking.",
        "Good tour overall. The organization was decent but could be improved.",
        "Not worth the price. The accommodation was below expectations.",
        "A life-changing adventure! Every detail was well planned and executed.",
        "The tour was okay. Some activities were great, others felt rushed.",
        "Amazing wildlife sightings! Our guide went above and beyond.",
        "Disappointed with the food quality throughout the trip.",
        "Perfect for families. The kids loved every moment.",
        "Too many people in the group. Felt crowded at times.",
        "The views were spectacular. Would definitely recommend.",
        "Our guide was late on the first day, but the rest of the trip was smooth.",
        "Luxurious experience from start to finish. Worth every penny.",
        "The vehicle broke down twice which wasted a lot of time.",
        "Very informative guide who knew all the best spots.",
        "I've been on many safaris and this was by far the best organized one.",
        "The itinerary was too packed. Needed more downtime.",
        "Excellent value for money. The included meals were delicious.",
        "Communication before the trip was poor. Had to follow up multiple times.",
        "The sunset game drive was magical! Saw all the Big Five.",
        "Would give 6 stars if I could. An unforgettable journey."
    ]

    complaint_comments = [
        "Terrible experience. The pickup never arrived and no one answered the phone.",
        "Very unsafe driving practices. The driver was speeding on rough roads.",
        "The room had cockroaches and the staff didn't care.",
        "False advertising! The 'luxury tent' was a basic camping tent.",
        "Our luggage was lost and the company refused to compensate.",
        "The guide was rude and unprofessional throughout the trip.",
        "Hidden fees everywhere. Ended up paying double the quoted price.",
        "Medical emergency was ignored. No first aid kit available.",
        "The vehicle was old and uncomfortable. AC didn't work.",
        "Food poisoning from the camp meals. Ruined the entire trip.",
        "Overcrowded. 15 people in a vehicle meant for 8.",
        "The 'expert guide' couldn't identify basic birds or plants.",
        "Booking cancellation policy is a scam. Lost all our money.",
        "Dirty tents and bedding. Clearly not washed between guests.",
        "No wildlife seen despite promises of guaranteed sightings.",
        "The tour operator was 3 hours late at the airport pickup.",
        "Misleading itinerary. Half the listed activities were skipped.",
        "Constant upselling. Felt like a sales pitch not a vacation.",
        "The Wi-Fi promised in the description didn't work at all.",
        "Unsafe area at night. No security measures in place."
    ]

    created = 0
    admin_user = next((u for u in users if u.role == 'admin'), users[0])

    for tour in tours:
        existing = Review.query.filter_by(tour_id=tour.id).count()
        needed = count - existing
        if needed <= 0:
            continue

        for _ in range(needed):
            user = random.choice(users)
            is_complaint = random.random() < 0.2
            if is_complaint:
                rating = random.choices([1, 2], weights=[60, 40])[0]
                comment = random.choice(complaint_comments)
            else:
                rating = random.choices([3, 4, 5], weights=[10, 40, 50])[0]
                comment = random.choice(sample_comments)

            review = Review(
                user_id=user.id,
                tour_id=tour.id,
                rating=rating,
                comment=comment,
                likes=random.randint(0, 15),
                dislikes=random.randint(0, 5),
                created_at=datetime.utcnow()
            )
            db.session.add(review)
            created += 1

    db.session.commit()
    return jsonify({'message': f'Created {created} reviews across {len(tours)} tours'}), 201

@reviews_bp.route('/<review_id>', methods=['DELETE'])
@token_required
def delete_review(current_user, review_id):
    review = Review.query.get(review_id)
    if not review:
        return jsonify({'error': 'Review not found'}), 404
    if review.user_id != current_user['user_id'] and current_user['role'] != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    db.session.delete(review)
    db.session.commit()
    return jsonify({'message': 'Review deleted'}), 200
