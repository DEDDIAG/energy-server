from sqlalchemy import Column, Integer, String, ForeignKey, TIMESTAMP, JSON, Float
from ..base import Base


class AnnotationTable(Base):
    __tablename__ = 'annotations'

    id = Column(Integer, primary_key=True, nullable=False)
    item_id = Column(Integer, ForeignKey('items.id'))
    label_id = Column(Integer, ForeignKey('annotation_labels.id'))
    start_date = Column(TIMESTAMP)
    stop_date = Column(TIMESTAMP)


class AnnotationLabelTable(Base):
    __tablename__ = 'annotation_labels'

    id = Column(Integer, primary_key=True, nullable=False)
    item_id = Column(Integer, ForeignKey('items.id'))
    text = Column(String, nullable=False)
    description = Column(String)


class ItemsTable(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String(length=500), nullable=False)
    house = Column(Integer, nullable=False)
    meta = Column(JSON())


class MeasurementsTable(Base):
    __tablename__ = "measurements"

    item_id = Column(Integer, ForeignKey('items.id'), primary_key=True)
    time = Column(TIMESTAMP, primary_key=True)
    value = Column(Float)
