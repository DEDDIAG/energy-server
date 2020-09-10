from werkzeug.exceptions import BadRequest, NotFound
from sqlalchemy import or_

from .exception import ItemNotFoundException, NotInitializedException, AnnotationNotFound
from . import query
from ..db import Connection
from pandas.io.sql import DatabaseError
from .model import AnnotationTable, AnnotationLabelTable


_DEFAULT_THRESHOLD = 0.32


class _ItemRequest(object):

    def __init__(self, config):
        self.config = config
        self._connection = Connection(
            db_name=config.get('db', 'db_name'),
            user=config.get('db', 'user'),
            host=config.get('db', 'host'),
            password=config.get('db', 'password'),
            pool_size=int(config.get('db', 'pool_size')),
            max_overflow=int(config.get('db', 'max_overflow'))
        )

    def get_items(self):
        return query.Items().request(self._connection)

    def get_item_events(self, item_id):
        try:
            return query.ItemEvents(item_id).request(self._connection)
        except DatabaseError:
            raise ItemNotFoundException(item_id)

    def get_item_event_values(self, item_id, eid=None):
        try:
            if eid is None:
                return query.ItemEventValuesAll(item_id).request(self._connection)
            return query.ItemEventValues(item_id, eid).request(self._connection)
        except DatabaseError:
            raise ItemNotFoundException(item_id)

    def get_item_values(self, item_id, start_date, stop_date):
        try:
            return query.ItemValues(item_id, start_date, stop_date).request(self._connection)
        except DatabaseError:
            raise ItemNotFoundException(item_id)

    def get_item_energy(self, item_id, start_date, stop_date):
        try:
            return query.ItemEnergy(item_id, start_date, stop_date).request(self._connection)
        except DatabaseError:
            raise ItemNotFoundException(item_id)

    def get_annotations(self, item_id, start_date, stop_date):
        return self._connection.session.query(AnnotationTable).filter_by(item_id=item_id).filter(
            AnnotationTable.start_date.between(start_date, stop_date) |
            (AnnotationTable.start_date <= start_date) & (AnnotationTable.stop_date >= stop_date) |
            (AnnotationTable.start_date >= start_date) & (AnnotationTable.stop_date >= stop_date) & (AnnotationTable.start_date <= stop_date) |
            (AnnotationTable.start_date <= start_date) & (AnnotationTable.stop_date <= stop_date) & (AnnotationTable.stop_date >= start_date)
        ).order_by(AnnotationTable.start_date.asc()).all()

    def delete_annotation(self, annotation_id):
        annotation = self._connection.session.query(AnnotationTable).filter_by(id=annotation_id).first()
        if annotation is not None:
            self._connection.session.delete(annotation)
            self._connection.session.commit()
        else:
            raise AnnotationNotFound("Annotation not found")

    def create_annotation(self, item_id, label_id, start_date, stop_date):
        annotation = AnnotationTable(item_id=item_id, label_id=label_id, start_date=start_date, stop_date=stop_date)
        self._connection.session.add(annotation)
        self._connection.session.commit()
        return annotation

    def update_annotation(self, annotation_id, label_id, start_date, stop_date):
        annotation = self._connection.session.query(AnnotationTable).filter_by(id=annotation_id).first()
        if annotation is not None:
            if label_id is not None:
                annotation.label_id = label_id
            if start_date is not None:
                annotation.start_date = start_date
            if stop_date is not None:
                annotation.stop_date = stop_date
            self._connection.session.commit()
            return annotation
        else:
            raise AnnotationNotFound("Annotation not found")

    def get_annotation_labels(self, item_id):
        return self._connection.session.query(AnnotationLabelTable).filter_by(item_id=item_id).order_by(AnnotationLabelTable.text.asc()).all()

    def delete_annotation_label(self, label_id):
        label = self._connection.session.query(AnnotationLabelTable).filter_by(id=label_id).first()
        if label is not None:
            self._connection.session.delete(label)
            self._connection.session.commit()
        else:
            raise NotFound("Annotation label not found")

    def create_annotation_label(self, item_id, text, description):
        label = AnnotationLabelTable(item_id=item_id, text=text, description=description)
        self._connection.session.add(label)
        self._connection.session.commit()
        return label

    def update_annotation_label(self, label_id, text, description):
        label = self._connection.session.query(AnnotationLabelTable).filter_by(id=label_id).first()
        if label is not None:
            if text is not None:
                label.text = text
            if description is not None:
                label.description = description
            self._connection.session.commit()
            return label
        else:
            raise AnnotationNotFound("Annotation label not found")

    def __enter__(self):
        self._connection.open_session()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self._connection.close_session()


class ItemRequest(object):
    _INSTANCE = None

    @staticmethod
    def instance():
        if not ItemRequest._INSTANCE:
            raise NotInitializedException("ItemRequest must be initialized before.")
        return ItemRequest._INSTANCE

    @staticmethod
    def initialize(config):
        if not ItemRequest._INSTANCE:
            ItemRequest._INSTANCE = _ItemRequest(config)
