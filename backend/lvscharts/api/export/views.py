from flask_restplus import Resource
from flask import Response

from . import api_ns
from ...utils.item import ItemRequest


@api_ns.route('/<string:item_id_list>')
@api_ns.param('item_id_list', 'ID of the Item')
class ExportItemsValues(Resource):

    def get(self, item_id_list):
        """
        Export Data in CSV Format
        :param item_id_list: List of item_id's to be exported, separated by |
        :return:
        """
        item_id_list = [int(x) for x in item_id_list.split('|')]
        req = ItemRequest.instance()
        available_items = req.get_items()['item_id']

        def generate():
            # intersect list of available and requested items
            items = [x for x in available_items if x in item_id_list]
            for item_id in items:
                yield req.get_item_event_values(item_id).to_csv()
        return Response(generate(), mimetype='text/csv')
