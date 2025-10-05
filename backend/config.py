import os

class Config:
    SECRET_KEY = 'mobilepos-lite-secret-key-2024'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///transactions.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False