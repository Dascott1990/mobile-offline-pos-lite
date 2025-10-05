from flask import Flask
from flask_cors import CORS
from models import db
from routes import init_routes
import os

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    # Initialize extensions
    db.init_app(app)
    CORS(app)  # Enable CORS for all routes
    
    # Initialize routes
    init_routes(app)
    
    # Create tables
    with app.app_context():
        db.create_all()
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)