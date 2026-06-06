from datetime import datetime, timedelta
from models.user import User
from models.tour import Tour, TourImage
from models.hotel import Hotel, HotelImage
from models.review import Review
from models.availability import TourAvailability
from models.currency import ExchangeRate
from models.blog import Blog, slugify
from models import db

Q = '?auto=compress&cs=tinysrgb&w=800'

TOUR_IMAGES = {
    'Maasai Mara Safari': [
        'https://images.pexels.com/photos/750540/pexels-photo-750540.jpeg' + Q,
    ],
    'Mombasa Beach Getaway': [
        'https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg' + Q,
        'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg' + Q,
    ],
    'Mount Kenya Trek': [
        'https://i.pinimg.com/736x/36/f6/51/36f651f2a6456b18602a2a6a7ba4e976.jpg' + Q,
        'https://images.pexels.com/photos/414171/pexels-photo-414171.jpeg' + Q,
    ],
    'Lake Nakuru Bird Watching': [
        'https://images.pexels.com/photos/90946/pexels-photo-90946.jpeg' + Q,
        'https://images.pexels.com/photos/259771/pexels-photo-259771.jpeg' + Q,
    ],
    'Amboseli National Park': [
        'https://images.pexels.com/photos/158255/pexels-photo-158255.jpeg' + Q,
        'https://images.pexels.com/photos/750540/pexels-photo-750540.jpeg' + Q,
    ],
    'Diani Sea Adventure': [
        'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg' + Q,
        'https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg' + Q,
    ],
}

HOTEL_IMAGES = {
    'Mara Serena Safari Lodge': ['https://images.pexels.com/photos/258154/pexels-photo-258154.jpeg' + Q],
    'Sarova Whitesands Beach Resort': ['https://images.pexels.com/photos/221457/pexels-photo-221457.jpeg' + Q],
    'The Ark Lodge': ['https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg' + Q],
    'Lake Naivasha Sopa Resort': ['https://images.pexels.com/photos/261102/pexels-photo-261102.jpeg' + Q],
}

ITINERARIES = {
    'Maasai Mara Safari': (
        'Day 1: Arrival in Nairobi - Transfer to Maasai Mara\n'
        'Morning pickup from JKIA, drive through the Great Rift Valley. Arrive at camp for lunch. '
        'Afternoon game drive to spot lions, cheetahs, and giraffes. Dinner under the stars.\n\n'
        'Day 2: Full Day Mara Exploration\n'
        'Sunrise game drive to catch predators hunting. Breakfast in the bush. '
        'Visit the Mara River to witness wildebeest crossings (seasonal). Picnic lunch by the river. '
        'Evening game drive to see nocturnal wildlife.\n\n'
        'Day 3: Maasai Village Visit + Game Drive\n'
        'Morning visit to a traditional Maasai village. Learn about their culture, dances, and way of life. '
        'Afternoon game drive to less-visited areas of the reserve. Sundowner cocktails on the plains.\n\n'
        'Day 4: Full Day Game Drive\n'
        'Extended game drive with packed breakfast and lunch. Visit the hippo pools and marsh areas. '
        'Spot rare species like serval cats and bat-eared foxes. Final sunset celebration.\n\n'
        'Day 5: Departure\n'
        'Morning game drive en route to Nairobi. Lunch at a famous Nairobi restaurant. '
        'Transfer to JKIA for departure.'
    ),
    'Mombasa Beach Getaway': (
        'Day 1: Arrival in Mombasa\n'
        'Airport pickup, transfer to beach resort. Welcome drink and orientation. '
        'Evening beach stroll and sunset dinner at the resort.\n\n'
        'Day 2: Snorkeling & Dhow Cruise\n'
        'Morning snorkeling at the marine park. See colorful coral reefs and tropical fish. '
        'Afternoon traditional dhow cruise along the coast with fresh seafood lunch. '
        'Evening at leisure.\n\n'
        'Day 3: Deep Sea Fishing\n'
        'Full day deep-sea fishing expedition. Catch marlin, tuna, and sailfish. '
        'Your catch prepared for dinner by the resort chef.\n\n'
        'Day 4: Departure\n'
        'Morning at leisure. Shopping at the local markets. Transfer to airport.'
    ),
    'Mount Kenya Trek': (
        'Day 1: Nairobi to Mount Kenya Base\n'
        'Depart Nairobi for Mount Kenya National Park. Register at the gate. '
        'Trek through rainforest to the first camp. Dinner and overnight.\n\n'
        'Day 2: Rainforest to Moorland\n'
        'Ascend through bamboo and podocarpus forests. Break at the moorland zone with panoramic views. '
        'Camp at 3,600m. Acclimatization walk before dinner.\n\n'
        'Day 3: Moorland to Liki North\n'
        'Trek through alpine meadows and rocky terrain. Cross streams and valleys. '
        'Arrive at Liki North camp (3,900m). Early dinner and rest.\n\n'
        'Day 4: Summit Attempt!\n'
        'Start at midnight for the summit push. Reach Point Lenana (4,985m) at sunrise. '
        'Descend to camp for brunch. Continue descent to the park gate. '
        'Transfer back to Nairobi.\n\n'
        'Day 5-7: Buffer and flexibility days for acclimatization and weather.'
    ),
    'Lake Nakuru Bird Watching': (
        'Day 1: Nairobi to Lake Nakuru\n'
        'Morning drive through the Rift Valley. Arrive at Lake Nakuru National Park. '
        'Afternoon game drive to see flamingos, pelicans, and other water birds. '
        'Also spot rhinos, lions, and waterbucks. Overnight at lodge.\n\n'
        'Day 2: Full Day Birding & Safari\n'
        'Early morning bird walk with a specialist guide. '
        'Visit the baboon cliff for stunning views of the lake. '
        'Afternoon game drive to explore the woodlands and grasslands.\n\n'
        'Day 3: Morning Safari & Return\n'
        'Final morning game drive. Breakfast at the lodge. '
        'Return to Nairobi with a stop at the Equator for photos.'
    ),
    'Amboseli National Park': (
        'Day 1: Nairobi to Amboseli\n'
        'Morning drive to Amboseli National Park with views of Mount Kilimanjaro. '
        'Afternoon game drive focusing on the elephant herds. Overnight at camp.\n\n'
        'Day 2: Full Day Amboseli\n'
        'Sunrise game drive to observation hill for panoramic park views. '
        'Visit the swamps where elephants, hippos, and buffalo gather. '
        'Evening game drive with Kilimanjaro sunset backdrop.\n\n'
        'Day 3: Maasai Community Visit\n'
        'Morning visit to a Maasai community. Learn about their coexistence with wildlife. '
        'Afternoon game drive to less-visited areas.\n\n'
        'Day 4: Departure\n'
        'Morning game drive en route to Nairobi. Stop at a local curio shop. '
        'Lunch in Nairobi before airport transfer.'
    ),
    'Diani Sea Adventure': (
        'Day 1: Arrival in Diani\n'
        'Transfer from Mombasa or Ukunda airport. Check into beachfront resort. '
        'Evening cocktail and orientation. Dinner at the resort.\n\n'
        'Day 2: Turtle Watching & Shimba Hills\n'
        'Morning visit to the sea turtle conservation center. '
        'Afternoon trip to Shimba Hills Reserve to see sable antelopes and elephants. '
        'Evening beach barbecue.\n\n'
        'Day 3: Wasini Island & Coral Garden\n'
        'Full day trip to Wasini Island. Snorkeling at the coral gardens. '
        'Fresh seafood lunch on the island. Dolphin spotting on the return.\n\n'
        'Day 4: Water Sports\n'
        'Choice of kite-surfing, jet-skiing, or paddle-boarding. '
        'Afternoon spa treatments at the resort. Farewell dinner.\n\n'
        'Day 5: Departure\n'
        'Morning at leisure. Transfer to the airport.'
    ),
}

INCLUDED = (
    'Professional English-speaking guide\n'
    'All park entry fees\n'
    'Accommodation as specified\n'
    'All meals during the tour\n'
    'Transport in a safari vehicle\n'
    'Bottled water\n'
    'Emergency evacuation cover'
)

EXCLUDED = (
    'International flights\n'
    'Travel insurance\n'
    'Personal expenses (souvenirs, tips, extra drinks)\n'
    'Optional activities not mentioned\n'
    'Visa fees'
)

TOURS_EXTRA = [
    {
        'title': 'Maasai Mara Safari',
        'activity_type': 'safari',
        'latitude': -1.4833, 'longitude': 35.0,
    },
    {
        'title': 'Mombasa Beach Getaway',
        'activity_type': 'beach',
        'latitude': -4.0435, 'longitude': 39.6682,
    },
    {
        'title': 'Mount Kenya Trek',
        'activity_type': 'trekking',
        'latitude': -0.15, 'longitude': 37.3,
    },
    {
        'title': 'Lake Nakuru Bird Watching',
        'activity_type': 'birding',
        'latitude': -0.3667, 'longitude': 36.0833,
    },
    {
        'title': 'Amboseli National Park',
        'activity_type': 'safari',
        'latitude': -2.65, 'longitude': 37.25,
    },
    {
        'title': 'Diani Sea Adventure',
        'activity_type': 'beach',
        'latitude': -4.3, 'longitude': 39.5833,
    },
]

HOTELS_EXTRA = [
    {'name': 'Mara Serena Safari Lodge', 'latitude': -1.485, 'longitude': 34.95},
    {'name': 'Sarova Whitesands Beach Resort', 'latitude': -4.035, 'longitude': 39.675},
    {'name': 'The Ark Lodge', 'latitude': -0.434, 'longitude': 36.756},
    {'name': 'Lake Naivasha Sopa Resort', 'latitude': -0.767, 'longitude': 36.35},
]


def seed_database():
    admin = User.query.filter_by(email='admin@kaburaadventures.com').first()
    if not admin:
        admin = User(
            name='Admin',
            email='admin@kaburaadventures.com',
            role='admin',
            phone='+254700000000'
        )
        admin.set_password('admin123')
        db.session.add(admin)

    if Tour.query.count() == 0:
        tours_data = [
            {
                'title': 'Maasai Mara Safari',
                'description': 'Experience the breathtaking Maasai Mara National Reserve. Witness the Great Migration, spot the Big Five, and immerse yourself in Maasai culture. Includes game drives, accommodation, and meals.',
                'price': 45000,
                'duration_days': 5,
                'location': 'Maasai Mara, Kenya',
                'max_people': 15,
                'featured': True,
                'activity_type': 'safari',
                'latitude': -1.4833,
                'longitude': 35.0,
                'itinerary': ITINERARIES['Maasai Mara Safari'],
                'included': INCLUDED,
                'excluded': EXCLUDED,
            },
            {
                'title': 'Mombasa Beach Getaway',
                'description': 'Relax on the pristine white sandy beaches of Mombasa. Enjoy snorkeling, deep-sea fishing, and fresh seafood. Stay at a luxury beachfront resort with all amenities included.',
                'price': 35000,
                'duration_days': 4,
                'location': 'Mombasa, Kenya',
                'max_people': 20,
                'featured': True,
                'activity_type': 'beach',
                'latitude': -4.0435,
                'longitude': 39.6682,
                'itinerary': ITINERARIES['Mombasa Beach Getaway'],
                'included': INCLUDED,
                'excluded': EXCLUDED,
            },
            {
                'title': 'Mount Kenya Trek',
                'description': 'Conquer the second-highest peak in Africa. A guided trek through diverse ecosystems from rainforest to alpine desert. Professional guides, equipment, and porters included.',
                'price': 55000,
                'duration_days': 7,
                'location': 'Mount Kenya, Kenya',
                'max_people': 10,
                'featured': True,
                'activity_type': 'trekking',
                'latitude': -0.15,
                'longitude': 37.3,
                'itinerary': ITINERARIES['Mount Kenya Trek'],
                'included': INCLUDED,
                'excluded': EXCLUDED,
            },
            {
                'title': 'Lake Nakuru Bird Watching',
                'description': 'Explore Lake Nakuru National Park, home to thousands of flamingos and over 400 bird species. Also spot rhinos, lions, and giraffes in this scenic Rift Valley park.',
                'price': 25000,
                'duration_days': 3,
                'location': 'Lake Nakuru, Kenya',
                'max_people': 20,
                'featured': False,
                'activity_type': 'birding',
                'latitude': -0.3667,
                'longitude': 36.0833,
                'itinerary': ITINERARIES['Lake Nakuru Bird Watching'],
                'included': INCLUDED,
                'excluded': EXCLUDED,
            },
            {
                'title': 'Amboseli National Park',
                'description': 'Witness large herds of elephants against the backdrop of Mount Kilimanjaro. This tour offers incredible photography opportunities and close encounters with wildlife.',
                'price': 38000,
                'duration_days': 4,
                'location': 'Amboseli, Kenya',
                'max_people': 15,
                'featured': True,
                'activity_type': 'safari',
                'latitude': -2.65,
                'longitude': 37.25,
                'itinerary': ITINERARIES['Amboseli National Park'],
                'included': INCLUDED,
                'excluded': EXCLUDED,
            },
            {
                'title': 'Diani Sea Adventure',
                'description': 'Enjoy the best of Diani Beach with water sports, turtle watching, and visits to the Shimba Hills Reserve. A perfect mix of adventure and relaxation on the coast.',
                'price': 42000,
                'duration_days': 5,
                'location': 'Diani, Kenya',
                'max_people': 16,
                'featured': False,
                'activity_type': 'beach',
                'latitude': -4.3,
                'longitude': 39.5833,
                'itinerary': ITINERARIES['Diani Sea Adventure'],
                'included': INCLUDED,
                'excluded': EXCLUDED,
            }
        ]

        for tour_data in tours_data:
            tour = Tour(**tour_data)
            db.session.add(tour)
            db.session.flush()
            urls = TOUR_IMAGES.get(tour.title, [])
            for i, url in enumerate(urls):
                db.session.add(TourImage(tour_id=tour.id, image_url=url, is_primary=(i == 0)))

    if Hotel.query.count() == 0:
        hotels_data = [
            {
                'name': 'Mara Serena Safari Lodge',
                'description': 'Luxury safari lodge located in the heart of Maasai Mara. Offers stunning views, swimming pool, and world-class dining.',
                'location': 'Maasai Mara, Kenya',
                'price_per_night': 15000,
                'rating': 4.8,
                'amenities': 'Pool,Restaurant,Free WiFi,Bar,Spa,Game Drives',
                'latitude': -1.485,
                'longitude': 34.95,
            },
            {
                'name': 'Sarova Whitesands Beach Resort',
                'description': 'Beachfront resort in Mombasa with multiple pools, restaurants, and water sports facilities.',
                'location': 'Mombasa, Kenya',
                'price_per_night': 12000,
                'rating': 4.5,
                'amenities': 'Pool,Restaurant,Free WiFi,Bar,Spa,Water Sports,Beach Access',
                'latitude': -4.035,
                'longitude': 39.675,
            },
            {
                'name': 'The Ark Lodge',
                'description': 'Unique tree lodge overlooking a waterhole in Aberdare National Park. Game viewing from the comfort of the lodge.',
                'location': 'Aberdare, Kenya',
                'price_per_night': 18000,
                'rating': 4.3,
                'amenities': 'Restaurant,Bar,Game Viewing Deck,Guided Walks',
                'latitude': -0.434,
                'longitude': 36.756,
            },
            {
                'name': 'Lake Naivasha Sopa Resort',
                'description': 'Beautiful lakeside resort with lush gardens, golf course, and stunning views of the Rift Valley.',
                'location': 'Lake Naivasha, Kenya',
                'price_per_night': 10000,
                'rating': 4.2,
                'amenities': 'Pool,Restaurant,Free WiFi,Bar,Golf Course,Boat Rides',
                'latitude': -0.767,
                'longitude': 36.35,
            }
        ]

        for hotel_data in hotels_data:
            hotel = Hotel(**hotel_data)
            db.session.add(hotel)
            db.session.flush()
            urls = HOTEL_IMAGES.get(hotel.name, [])
            for i, url in enumerate(urls):
                db.session.add(HotelImage(hotel_id=hotel.id, image_url=url, is_primary=(i == 0)))

    for tour in Tour.query.all():
        existing = {img.image_url for img in tour.images.all()}
        urls = TOUR_IMAGES.get(tour.title, [])
        for i, url in enumerate(urls):
            if url not in existing:
                db.session.add(TourImage(tour_id=tour.id, image_url=url, is_primary=(i == 0)))

    for hotel in Hotel.query.all():
        existing = {img.image_url for img in hotel.images.all()}
        urls = HOTEL_IMAGES.get(hotel.name, [])
        for i, url in enumerate(urls):
            if url not in existing:
                db.session.add(HotelImage(hotel_id=hotel.id, image_url=url, is_primary=(i == 0)))

    for extra in TOURS_EXTRA:
        tour = Tour.query.filter_by(title=extra['title']).first()
        if tour:
            if not tour.itinerary:
                tour.itinerary = ITINERARIES.get(tour.title, '')
            if not tour.included:
                tour.included = INCLUDED
            if not tour.excluded:
                tour.excluded = EXCLUDED
            if not tour.activity_type:
                tour.activity_type = extra.get('activity_type', 'safari')
            if not tour.latitude:
                tour.latitude = extra.get('latitude')
                tour.longitude = extra.get('longitude')

    for extra in HOTELS_EXTRA:
        hotel = Hotel.query.filter_by(name=extra['name']).first()
        if hotel:
            if not hotel.latitude:
                hotel.latitude = extra.get('latitude')
                hotel.longitude = extra.get('longitude')

    if ExchangeRate.query.count() == 0:
        for code, rate, sym in [
            ('KES', 1.0, 'KSh'),
            ('USD', 130.0, '$'),
            ('EUR', 142.0, '\u20ac'),
        ]:
            db.session.add(ExchangeRate(currency_code=code, rate_to_kes=rate, symbol=sym))

    if Review.query.count() == 0:
        reviews_data = [
            {'tour_title': 'Maasai Mara Safari', 'rating': 5, 'comment': 'Absolutely incredible experience! The guides were knowledgeable and we saw all the Big Five.'},
            {'tour_title': 'Maasai Mara Safari', 'rating': 4, 'comment': 'Great safari, well organized. The camp was comfortable and food was excellent.'},
            {'tour_title': 'Mombasa Beach Getaway', 'rating': 5, 'comment': 'Paradise on earth! The beach was pristine and the resort was world-class.'},
            {'tour_title': 'Mount Kenya Trek', 'rating': 5, 'comment': 'Challenging but rewarding. The guides were fantastic and safety was top priority.'},
            {'tour_title': 'Amboseli National Park', 'rating': 4, 'comment': 'The views of Kilimanjaro with elephants in the foreground are unforgettable.'},
            {'tour_title': 'Diani Sea Adventure', 'rating': 5, 'comment': 'Best beach holiday ever! The sea turtles and coral reefs were amazing.'},
        ]
        customer = User.query.filter_by(email='admin@kaburaadventures.com').first()
        for r in reviews_data:
            tour = Tour.query.filter_by(title=r['tour_title']).first()
            if tour and customer:
                review = Review(
                    user_id=customer.id,
                    tour_id=tour.id,
                    rating=r['rating'],
                    comment=r['comment']
                )
                db.session.add(review)

    if TourAvailability.query.count() == 0:
        for tour in Tour.query.all():
            start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            for i in range(90):
                day = start + timedelta(days=i)
                existing = TourAvailability.query.filter_by(tour_id=tour.id, date=day).first()
                if not existing:
                    db.session.add(TourAvailability(
                        tour_id=tour.id, date=day,
                        available_slots=tour.max_people, max_people=tour.max_people
                    ))

    if Blog.query.count() == 0:
        blogs_data = [
            {
                'title': 'The Ultimate Guide to Safari in Maasai Mara',
                'content': '<p>The Maasai Mara National Reserve is one of Africa\'s most spectacular wildlife destinations. Located in southwestern Kenya, it offers an unparalleled safari experience with the Great Migration, Big Five sightings, and stunning landscapes.</p><h2>When to Visit</h2><p>The best time for a Maasai Mara safari is from July to October during the dry season when the Great Migration is in full swing. The wildebeest crossing of the Mara River is one of nature\'s most dramatic events.</p><h2>What to Pack</h2><ul><li>Lightweight neutral-colored clothing</li><li>Warm jacket for morning game drives</li><li>Binoculars and camera with zoom lens</li><li>Sunscreen and insect repellent</li><li>Comfortable walking shoes</li></ul><h2>Top Safari Tips</h2><p>Book your safari at least 3 months in advance during peak season. Choose a reputable tour operator like Kabura Adventures for the best experience. Morning game drives (6am-10am) offer the best wildlife viewing opportunities.</p>',
                'excerpt': 'Everything you need to know about planning an unforgettable safari experience in Kenya\'s most famous wildlife reserve.',
                'image_url': 'https://images.pexels.com/photos/259771/pexels-photo-259771.jpeg?auto=compress&cs=tinysrgb&w=800',
                'category': 'safari-guides',
                'tags': 'safari,maasai-mara,wildlife,great-migration'
            },
            {
                'title': 'Kenya\'s Best Beach Destinations: From Diani to Watamu',
                'content': '<p>Kenya\'s coastline stretches over 500 kilometers along the Indian Ocean, offering pristine white-sand beaches, crystal-clear waters, and vibrant coral reefs. Whether you\'re seeking relaxation or adventure, Kenya\'s beaches have something for everyone.</p><h2>Diani Beach</h2><p>Consistently voted one of Africa\'s best beaches, Diani offers powdery white sand, palm trees, and excellent snorkeling. The beach is divided into north and south sections, with the north being more lively.</p><h2>Watamu Marine National Park</h2><p>A paradise for snorkelers and divers, Watamu boasts incredible coral gardens, sea turtles, and over 600 species of fish. The park is part of a UNESCO Biosphere Reserve.</p><h2>Malindi</h2><p>One of Kenya\'s oldest coastal towns, Malindi combines rich Swahili history with beautiful beaches. Visit the Vasco da Gama pillar and the marine park.</p>',
                'excerpt': 'Explore Kenya\'s stunning coastline with our guide to the best beach destinations on the Indian Ocean.',
                'image_url': 'https://images.pexels.com/photos/1005417/pexels-photo-1005417.jpeg?auto=compress&cs=tinysrgb&w=800',
                'category': 'destinations',
                'tags': 'beach,diani,watamu,malindi,coast'
            },
            {
                'title': 'A Complete Guide to Mount Kenya Trekking',
                'content': '<p>Mount Kenya, Africa\'s second-highest mountain, offers one of the continent\'s most scenic treks. With its rugged glacier-covered peaks and diverse ecosystems, climbing Mount Kenya is a bucket-list adventure for trekkers worldwide.</p><h2>Choosing Your Route</h2><p>The most popular routes are the Sirimon and Chogoria routes, both offering stunning scenery and good acclimatization profiles. The Naro Moru route is the shortest but steepest option.</p><h2>Acclimatization Tips</h2><ul><li>Spend at least 5-6 days on the mountain</li><li>Walk slowly - pole pole is the Kenyan way</li><li>Stay well hydrated</li><li>Consider taking Diamox for altitude sickness prevention</li></ul><h2>Best Time to Climb</h2><p>The dry seasons (January-February and July-October) offer the best conditions. Avoid the long rains (March-May) and short rains (November-December).</p>',
                'excerpt': 'Everything you need to plan your Mount Kenya trek, from route selection to gear recommendations and safety tips.',
                'image_url': 'https://images.pexels.com/photos/750540/pexels-photo-750540.jpeg?auto=compress&cs=tinysrgb&w=800',
                'category': 'trekking',
                'tags': 'mount-kenya,trekking,hiking,adventure'
            },
        ]
        now = datetime.utcnow()
        for i, bd in enumerate(blogs_data):
            blog = Blog(
                title=bd['title'],
                slug=slugify(bd['title']),
                content=bd['content'],
                excerpt=bd['excerpt'],
                image_url=bd['image_url'],
                author='Kabura Adventures',
                category=bd['category'],
                tags=bd['tags'],
                published=True,
                published_at=now - timedelta(days=i * 7)
            )
            db.session.add(blog)

    db.session.commit()
