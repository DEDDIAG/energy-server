from flask_restplus import Resource
from flask import request

from . import api_ns
from . import models
from ...utils.item import ItemRequest


@api_ns.route('/')
class Items(Resource):

    @api_ns.marshal_with(models.items, as_list=True)
    def get(self):
        """
        Get item events
        :return: All available items
        :raises ItemNotFoundException: If item is not available
        """
        req = ItemRequest.instance()
        items = req.get_items()
        return items.to_dict(orient='records')


@api_ns.route('/<int:item_id>/events')
@api_ns.param('item_id', 'ID of the Item')
class ItemEvents(Resource):

    @api_ns.marshal_with(models.event_model, as_list=True)
    def get(self, item_id):
        """
        Get item events
        :param item_id: ID of the Item
        :return: All Events of given item
        :raises ItemNotFoundException: If item is not available
        """
        req = ItemRequest.instance()
        items = req.get_item_events(item_id)
        return items.to_dict(orient='records')


@api_ns.route('/<int:item_id>/events/<string:eid>')
@api_ns.param('item_id', 'ID of the Item')
@api_ns.param('eid', 'Event id')
class ItemEventValues(Resource):

    @api_ns.marshal_with(models.event_values_model, as_list=True)
    def get(self, item_id, eid):
        """
        Get item events
        :param item_id: ID of the Item
        :param eid: Event id
        :return: All Events of given item
        :raises ItemNotFoundException: If item is not available
        """
        req = ItemRequest.instance()
        items = req.get_item_event_values(item_id, eid)
        return items.to_dict(orient='records')


@api_ns.route('/<int:item_id>/values/<string:start_date>/<string:stop_date>')
@api_ns.param('item_id', 'ID of the Item')
@api_ns.param('start_date', 'Start date of values')
@api_ns.param('stop_date', 'Stop date of values')
class ItemValues(Resource):

    @api_ns.marshal_with(models.item_values_model, as_list=True)
    def get(self, item_id, start_date, stop_date):
        """
        Get item values in range
        :param item_id: ID of the Item
        :param start_date: Start date of values in iso8601 format
        :param stop_date: Stop date of values in iso8601 format
        :return: All Events of given item
        :raises ItemNotFoundException: If item is not available
        :raises InvalidDateFormat: If given date is not iso8601
        """
        with ItemRequest.instance() as req:
            val = req.get_item_values(item_id, start_date, stop_date)
            return val.to_dict(orient='list')


@api_ns.route('/<int:item_id>/energy/<string:start_date>/<string:stop_date>')
@api_ns.param('item_id', 'ID of the Item')
@api_ns.param('start_date', 'Start date')
@api_ns.param('stop_date', 'Stop date')
class ItemEnergy(Resource):

    @api_ns.marshal_with(models.item_energy_model)
    def get(self, item_id, start_date, stop_date):
        """
        Get energy in range in kwh
        :param item_id: ID of the Item
        :param start_date: Start date of values in iso8601 format
        :param stop_date: Stop date of values in iso8601 format
        :return: Energy in given range
        :raises ItemNotFoundException: If item is not available
        :raises InvalidDateFormat: If given date is not iso8601
        """
        with ItemRequest.instance() as req:
            val = req.get_item_energy(item_id, start_date, stop_date)
            return val.to_dict(orient='record')[0]


@api_ns.route('/<int:item_id>/annotation/<string:start_date>/<string:stop_date>')
@api_ns.param('item_id', 'ID of the Item')
@api_ns.param('start_date', 'Start date')
@api_ns.param('stop_date', 'Stop date')
class ItemAnnotation(Resource):

    @api_ns.marshal_with(models.annotation_model, as_list=True)
    def get(self, item_id, start_date, stop_date):
        with ItemRequest.instance() as req:
            val = req.get_annotations(item_id, start_date, stop_date)
            return val


@api_ns.route('/<int:item_id>/annotation')
@api_ns.param('item_id', 'ID of the Item')
class ItemAnnotationPut(Resource):

    @api_ns.expect(models.annotation_put_model)
    @api_ns.marshal_with(models.annotation_model)
    def put(self, item_id):
        label_id = api_ns.payload['label_id']
        start_date = api_ns.payload['start_date']
        stop_date = api_ns.payload['stop_date']
        with ItemRequest.instance() as req:
            val = req.create_annotation(item_id, label_id, start_date, stop_date)
            return val.__dict__


@api_ns.route('/<int:item_id>/annotation/<int:annotation_id>')
@api_ns.param('item_id', 'ID of the Item')
class ItemAnnotationAlter(Resource):

    def delete(self, item_id, annotation_id):
        with ItemRequest.instance() as req:
            _ = req.delete_annotation(annotation_id)

    @api_ns.expect(models.annotation_put_model)
    @api_ns.marshal_with(models.annotation_model)
    def post(self, item_id, annotation_id):

        label_id = api_ns.payload.get('label_id')
        start_date = api_ns.payload.get('start_date')
        stop_date = api_ns.payload.get('stop_date')
        with ItemRequest.instance() as req:
            val = req.update_annotation(annotation_id, label_id, start_date, stop_date)
            return val.__dict__


@api_ns.route('/<int:item_id>/annotation/label/')
@api_ns.param('item_id', 'ID of the Item')
class ItemAnnotationLabel(Resource):

    @api_ns.marshal_with(models.annotation_label_model, as_list=True)
    def get(self, item_id):
        with ItemRequest.instance() as req:
            val = req.get_annotation_labels(item_id)
            return val

    @api_ns.expect(models.annotation_label_put_model)
    @api_ns.marshal_with(models.annotation_label_model)
    def put(self, item_id):
        text = api_ns.payload['text']
        description = api_ns.payload['description']
        with ItemRequest.instance() as req:
            val = req.create_annotation_label(item_id, text, description)
            return val.__dict__


@api_ns.route('/<int:item_id>/annotation/label/<int:label_id>')
@api_ns.param('item_id', 'ID of the Item')
@api_ns.param('label_id', 'ID of the Item')
class ItemAnnotationLabelAlter(Resource):

    def delete(self, item_id, label_id):
        with ItemRequest.instance() as req:
            _ = req.delete_annotation_label(label_id)
            return True

    @api_ns.expect(models.annotation_label_put_model)
    @api_ns.marshal_with(models.annotation_label_model)
    def post(self, item_id, label_id):

        text = api_ns.payload['text']
        description = api_ns.payload['description']
        with ItemRequest.instance() as req:
            val = req.update_annotation_label(label_id, text, description)
            return val.__dict__
