import uuid
from datetime import datetime
from . import db

class MemoryImage(db.Model):
    __tablename__ = 'memory_images'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    memory_id = db.Column(db.String(36), db.ForeignKey('user_memories.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'memory_id': self.memory_id,
            'image_url': self.image_url,
        }

class UserMemory(db.Model):
    __tablename__ = 'user_memories'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=True)
    title = db.Column(db.String(255), nullable=False)
    location = db.Column(db.String(255))
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.Text)
    email = db.Column(db.String(255))
    approved = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    images = db.relationship('MemoryImage', backref='memory', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'location': self.location,
            'image_url': self.image_url,
            'images': [img.to_dict() for img in self.images.all()],
            'caption': self.caption,
            'email': self.email,
            'approved': self.approved,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
