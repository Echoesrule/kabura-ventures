from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt

db = SQLAlchemy()
bcrypt = Bcrypt()

from .user import User
from .tour import Tour, TourImage
from .hotel import Hotel, HotelImage
from .booking import Booking
from .flight import FlightRequest
from .message import Message, Notification
from .payment import Payment
from .media import HeroMedia
from .review import Review
from .wishlist import Wishlist
from .availability import TourAvailability
from .currency import ExchangeRate
from .blog import Blog
from .memory import UserMemory, MemoryImage
