
from flask import Flask
from .api import init_api
from .cli import init_app

app = Flask(__name__)

with app.app_context():
    init_app(app, "config/config.ini", False)
    init_api(app)
