import uuid
from datetime import datetime
from . import db

class PageSection(db.Model):
    __tablename__ = 'page_sections'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    section_key = db.Column(db.String(100), nullable=False, unique=True)
    title = db.Column(db.String(255), nullable=True)
    subtitle = db.Column(db.String(500), nullable=True)
    heading = db.Column(db.String(500), nullable=True)
    description = db.Column(db.Text, nullable=True)
    grey_heading = db.Column(db.String(255), nullable=True)
    image_url = db.Column(db.String(500), nullable=True)
    cta_text = db.Column(db.String(100), nullable=True)
    cta_url = db.Column(db.String(500), nullable=True)
    stat1_number = db.Column(db.Integer, nullable=True)
    stat1_label = db.Column(db.String(100), nullable=True)
    stat2_number = db.Column(db.Integer, nullable=True)
    stat2_label = db.Column(db.String(100), nullable=True)
    stat3_number = db.Column(db.Integer, nullable=True)
    stat3_label = db.Column(db.String(100), nullable=True)
    extra_json = db.Column(db.Text, nullable=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'section_key': self.section_key,
            'title': self.title or '',
            'subtitle': self.subtitle or '',
            'heading': self.heading or '',
            'description': self.description or '',
            'grey_heading': self.grey_heading or '',
            'image_url': self.image_url or '',
            'cta_text': self.cta_text or '',
            'cta_url': self.cta_url or '',
            'stat1_number': self.stat1_number,
            'stat1_label': self.stat1_label or '',
            'stat2_number': self.stat2_number,
            'stat2_label': self.stat2_label or '',
            'stat3_number': self.stat3_number,
            'stat3_label': self.stat3_label or '',
            'extra_json': self.extra_json or '',
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
