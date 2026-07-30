import random
from datetime import datetime
from models.review import Review
from models.tour import Tour
from models.user import User
from models import db
from utils.helpers import sanitize_input
from services.base import ServiceError


def reply_to_review(review, reply_text):
    if not reply_text:
        raise ServiceError('Reply text is required')
    review.admin_reply = sanitize_input(reply_text, max_length=2000)
    db.session.commit()
    return review.to_dict(), 200


FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth',
               'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen',
               'Charles', 'Lisa', 'Daniel', 'Nancy', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra',
               'Donald', 'Ashley', 'Steven', 'Dorothy', 'Paul', 'Kimberly', 'Andrew', 'Emily', 'Joshua', 'Donna',
               'Kenneth', 'Michelle', 'Kevin', 'Carol', 'Brian', 'Amanda', 'George', 'Melissa', 'Timothy', 'Deborah']
LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
              'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
              'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
              'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
              'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts']
SAMPLE_COMMENTS = [
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
COMPLAINT_COMMENTS = [
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


def _create_reviews_for_tours(tours, users, count_per_tour):
    created = 0
    for tour in tours:
        existing = Review.query.filter_by(tour_id=tour.id).count()
        needed = count_per_tour - existing
        if needed <= 0:
            continue
        for _ in range(needed):
            user = random.choice(users)
            is_complaint = random.random() < 0.2
            if is_complaint:
                rating = random.choices([1, 2], weights=[60, 40])[0]
                comment = random.choice(COMPLAINT_COMMENTS)
            else:
                rating = random.choices([3, 4, 5], weights=[10, 40, 50])[0]
                comment = random.choice(SAMPLE_COMMENTS)
            review = Review(
                user_id=user.id, tour_id=tour.id, rating=rating, comment=comment,
                likes=random.randint(0, 15), dislikes=random.randint(0, 5),
                created_at=datetime.utcnow()
            )
            db.session.add(review)
            created += 1
    return created


def seed_reviews(count=50):
    tours = Tour.query.all()
    if not tours:
        raise ServiceError('No tours found.', 400)
    all_users = User.query.all()
    if not all_users:
        raise ServiceError('No users found. Seed users first or use seed-all.', 400)
    created = _create_reviews_for_tours(tours, all_users, min(count, 500))
    db.session.commit()
    return f'{created} reviews seeded', 200


def seed_all(user_count=50, review_count=50):
    try:
        tours = Tour.query.all()
        if not tours:
            raise ServiceError('No tours found.', 400)

        created_users = 0
        for i in range(user_count):
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            name = f'{fn} {ln}'
            email = f'{fn.lower()}.{ln.lower()}.{i}_{random.randint(1,9999)}@example.com'
            if User.query.filter_by(email=email).first():
                continue
            user = User(name=name, email=email, phone=f'+2547{random.randint(10000000, 99999999)}', is_verified=True, role='customer')
            user.set_password('Password123!')
            db.session.add(user)
            created_users += 1
        db.session.commit()

        all_users = User.query.all()
        created_reviews = _create_reviews_for_tours(tours, all_users, review_count)
        db.session.commit()
        return f'Created {created_users} users and {created_reviews} reviews across {len(tours)} tours', 201
    except Exception as e:
        db.session.rollback()
        raise ServiceError(f'Seed failed: {str(e)}', 500)
