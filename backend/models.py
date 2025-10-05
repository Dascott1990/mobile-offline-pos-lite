from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
import hashlib

db = SQLAlchemy()

class Transaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    product_name = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    payment_type = db.Column(db.String(50), nullable=False)  # cash, card, mobile, wavepay
    timestamp = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    synced = db.Column(db.Boolean, default=False)
    local_id = db.Column(db.String(100))  # For offline sync matching
    wavepay_transaction_id = db.Column(db.String(100))  # For WavePay transactions
    
    def to_dict(self):
        return {
            'id': self.id,
            'product_name': self.product_name,
            'amount': self.amount,
            'quantity': self.quantity,
            'payment_type': self.payment_type,
            'timestamp': self.timestamp.isoformat(),
            'synced': self.synced,
            'local_id': self.local_id,
            'wavepay_transaction_id': self.wavepay_transaction_id
        }

class WavePayWallet(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    wallet_id = db.Column(db.String(100), unique=True, nullable=False)
    public_key = db.Column(db.Text, nullable=False)
    balance = db.Column(db.Float, default=0.0)
    currency = db.Column(db.String(10), default='CAD')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'wallet_id': self.wallet_id,
            'public_key': self.public_key,
            'balance': self.balance,
            'currency': self.currency,
            'created_at': self.created_at.isoformat(),
            'last_sync': self.last_sync.isoformat()
        }

class WavePayTransaction(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    transaction_id = db.Column(db.String(100), unique=True, nullable=False)
    sender_wallet_id = db.Column(db.String(100), nullable=False)
    receiver_wallet_id = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(10), default='CAD')
    physics_signature = db.Column(db.Text, nullable=False)  # Hash of physics data
    digital_signature = db.Column(db.Text, nullable=False)  # Ed25519 signature
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')  # pending, completed, failed
    synced = db.Column(db.Boolean, default=False)
    
    def to_dict(self):
        return {
            'transaction_id': self.transaction_id,
            'sender_wallet_id': self.sender_wallet_id,
            'receiver_wallet_id': self.receiver_wallet_id,
            'amount': self.amount,
            'currency': self.currency,
            'physics_signature': self.physics_signature,
            'digital_signature': self.digital_signature,
            'timestamp': self.timestamp.isoformat(),
            'status': self.status,
            'synced': self.synced
        }