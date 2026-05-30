from flask import Blueprint, jsonify

company_bp = Blueprint('company', __name__)

COMPANY_INFO = {
    'name': 'Kabura Ventures',
    'slogan': 'Your journey, our passion',
    'tagline': 'Explore Kenya with Kabura Ventures',
    'mission': 'To provide exceptional travel and tour experiences through professionalism, integrity, personalized service and unforgettable adventures that connect people to the beauty of Kenya and the world.',
    'vision': 'To become a trusted and leading travel & tours company recognized for creating memorable journeys, excellent customer experiences and strong global partnerships.',
    'services': [
        'Tours & Safari packages',
        'Local & International travel planning',
        'Hotel & Accommodation booking',
        'Airport transfers & Transport services',
        'Honeymoon & Couples getaways',
        'Group and Corporate travel arrangements',
    ],
    'unique_selling_point': 'Kabura Ventures delivers personalized travel experiences with authenticity, professionalism and genuine hospitality, connecting people to unforgettable adventures in Kenya and beyond.',
    'countries_served': ['Kenya', 'Uganda', 'Ethiopia', 'Tanzania', 'South Africa'],
    'social_media': {
        'instagram': 'https://instagram.com/kaburaadventures',
        'facebook': 'https://facebook.com/kaburaadventures',
        'tiktok': 'https://tiktok.com/@kabura.adventures',
        'youtube': 'https://youtube.com/@KaburaVentures',
    },
    'contact': {
        'phone': '0716036542',
        'email': 'Kaburaadventures@gmail.com',
        'address': 'Nairobi, Kenya',
    },
}

@company_bp.route('/api/company', methods=['GET'])
def get_company_info():
    return jsonify(COMPANY_INFO)
