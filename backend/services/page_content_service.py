from models.page_section import PageSection
from models import db
from services.base import ServiceError


def save_section(section_key, content=None):
    if not section_key:
        raise ServiceError('section_key is required')
    section = PageSection.query.filter_by(section_key=section_key).first()
    if section:
        section.content = content or {}
    else:
        section = PageSection(section_key=section_key, content=content or {})
        db.session.add(section)
    db.session.commit()
    return section.to_dict(), 200


def delete_section(section):
    db.session.delete(section)
    db.session.commit()
