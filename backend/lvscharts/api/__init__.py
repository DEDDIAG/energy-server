from importlib import import_module
import logging

_version = '1.0'
_title = 'LVSS'
_description = 'LVS Data Visualizer'


def init_api(app, url_prefix='/api'):
    global _version, _title, _description

    from flask_restplus import Api
    from flask import Blueprint

    blueprint = Blueprint('api', __name__)
    api = Api(blueprint, version=_version, title=_title, description=_description)

    for module_name in ['.items', '.export']:
        logging.info("Import API module: {}".format(module_name))
        m = import_module("{}".format(module_name), package=__package__)
        import_module("{}.views".format(module_name), package=__package__)
        api.add_namespace(m.api_ns)

    app.register_blueprint(blueprint, url_prefix=url_prefix)

    return api
