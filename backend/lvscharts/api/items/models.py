from . import api_ns
from flask_restplus import fields
from ...utils.fields import UtcDateTime


items = api_ns.model('Items', {
    'item_id': fields.Integer(),
    'label': fields.String(),
    'item_name': fields.String(),
    'house_id': fields.Integer(),
    'first_date': UtcDateTime(),
    'last_date': UtcDateTime(),
})

event_model = api_ns.model('Event', {
    'eid': fields.String(),
    'start_date': UtcDateTime(),
    'stop_date': UtcDateTime(),
})

event_values_model = api_ns.model('EventValues', {
    'eid': fields.String(),
    'start_date': UtcDateTime(),
    'stop_date': UtcDateTime(),
    'values': fields.List(fields.Float()),
})

item_values_model = api_ns.model('ItemValues', {
    'time': fields.List(UtcDateTime()),
    'value': fields.List(fields.Float()),
})

item_energy_model = api_ns.model('ItemValues', {
    'start_date': UtcDateTime(),
    'stop_date': UtcDateTime(),
    'energy': fields.Float(),
})

annotation_model = api_ns.model('Annotation', {
    'id': fields.Integer(),
    'item_id': fields.Integer(),
    'label_id': fields.Integer(),
    'start_date': UtcDateTime(),
    'stop_date': UtcDateTime(),
})

annotation_put_model = api_ns.model('AnnotationCreate', {
    'label_id': fields.Integer(),
    'start_date': UtcDateTime(),
    'stop_date': UtcDateTime(),
})

annotation_label_model = api_ns.model('AnnotationLabel', {
    'id': fields.Integer(),
    'item_id': fields.Integer(),
    'text': fields.String(),
    'description': fields.String(),
})

annotation_label_put_model = api_ns.model('AnnotationLabelCreate', {
    'text': fields.String(),
    'description': fields.String(),
})

