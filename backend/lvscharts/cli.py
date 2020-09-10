import logging
import click


def init_app(app, config, debug):
    from flask_ini import FlaskIni
    from .utils.item import ItemRequest
    app.ini_config = FlaskIni()
    app.ini_config.read(config)
    ItemRequest.initialize(app.ini_config)


@click.group()
@click.option('--debug/--no-debug', default=False)
def cli(debug):
    if debug:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)


@cli.command()
@click.option('-c', '--config', required=True, type=click.Path(exists=True))
@click.option('--debug/--no-debug', default=False)
def start(config, debug):
    """LVS-Charts-API"""

    logging.info("Starting")
    from flask import Flask
    from .utils.proxy import ReverseProxied
    from .api import init_api

    app = Flask(__name__)
    app.wsgi_app = ReverseProxied(app.wsgi_app)

    with app.app_context():
        init_app(app, config, debug)
        init_api(app)
        app.run(debug=debug,
                threaded=False,
                host=app.ini_config.get('server', 'host', fallback='127.0.0.1'),
                port=int(app.ini_config.get('server', 'port', fallback=5000)))


@cli.command()
@click.option('-c', '--config', required=True, type=click.Path(exists=True))
@click.option('--yaml/--json', 'use_yaml', default=False)
def doc(config, use_yaml):
    """Create Swagger documentation"""
    if use_yaml:
        import pyaml
        encoder = pyaml.dump
    else:
        import json

        def json_dump(x):
            return json.dumps(x, sort_keys=True, indent=2, separators=(',', ': '))

        encoder = json_dump

    from flask import Flask
    from .api import init_api
    app = Flask(__name__)
    # TODO: This is still no good
    app.config['SERVER_NAME'] = "localhost"
    with app.app_context():
        init_app(app, config, debug=False)
        api = init_api(app)
        print(encoder(api.__schema__))
