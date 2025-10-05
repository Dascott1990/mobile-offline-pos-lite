import hashlib
import json
import random
import time
from datetime import datetime
import base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.exceptions import InvalidSignature

class WavePayQuantum:
    @staticmethod
    def generate_wallet_id():
        """Generate a unique wallet ID"""
        timestamp = int(time.time() * 1000)
        random_part = random.randint(1000, 9999)
        return f"WPQ{timestamp}{random_part}"
    
    @staticmethod
    def generate_key_pair():
        """Generate Ed25519 key pair for wallet using cryptography library"""
        private_key = ed25519.Ed25519PrivateKey.generate()
        public_key = private_key.public_key()
        
        # Serialize keys to bytes
        private_key_bytes = private_key.private_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PrivateFormat.Raw,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        public_key_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.Raw,
            format=serialization.PublicFormat.Raw
        )
        
        return {
            'private_key': base64.b64encode(private_key_bytes).decode('ascii'),
            'public_key': base64.b64encode(public_key_bytes).decode('ascii')
        }
    
    @staticmethod
    def simulate_physics_data():
        """Simulate physics sensor data (motion, sound, light, pressure)"""
        return {
            'motion': {
                'acceleration_x': round(random.uniform(-2.0, 2.0), 3),
                'acceleration_y': round(random.uniform(-2.0, 2.0), 3),
                'acceleration_z': round(random.uniform(-2.0, 2.0), 3),
                'rotation_alpha': round(random.uniform(0, 360), 2),
                'rotation_beta': round(random.uniform(-180, 180), 2),
                'rotation_gamma': round(random.uniform(-90, 90), 2)
            },
            'sound': {
                'frequency': round(random.uniform(20, 20000), 1),
                'amplitude': round(random.uniform(0, 1), 3),
                'decibels': round(random.uniform(30, 120), 1)
            },
            'light': {
                'lux': round(random.uniform(0, 1000), 1),
                'color_temperature': round(random.uniform(2000, 6500), 0),
                'brightness': round(random.uniform(0, 1), 3)
            },
            'pressure': {
                'hpa': round(random.uniform(900, 1100), 2),
                'altitude': round(random.uniform(0, 5000), 1)
            },
            'timestamp': datetime.utcnow().isoformat(),
            'device_id': f"device_{random.randint(1000, 9999)}"
        }
    
    @staticmethod
    def generate_physics_signature(physics_data):
        """Generate SHA-512 hash from physics data"""
        data_string = json.dumps(physics_data, sort_keys=True)
        return hashlib.sha512(data_string.encode()).hexdigest()
    
    @staticmethod
    def sign_transaction(transaction_data, private_key_b64):
        """Sign transaction data with Ed25519 private key"""
        try:
            private_key_bytes = base64.b64decode(private_key_b64)
            private_key = ed25519.Ed25519PrivateKey.from_private_bytes(private_key_bytes)
            
            transaction_string = json.dumps(transaction_data, sort_keys=True)
            signature = private_key.sign(transaction_string.encode())
            
            return base64.b64encode(signature).decode('ascii')
        except Exception as e:
            raise Exception(f"Signing failed: {str(e)}")
    
    @staticmethod
    def verify_signature(transaction_data, signature_b64, public_key_b64):
        """Verify transaction signature with Ed25519 public key"""
        try:
            public_key_bytes = base64.b64decode(public_key_b64)
            public_key = ed25519.Ed25519PublicKey.from_public_bytes(public_key_bytes)
            
            transaction_string = json.dumps(transaction_data, sort_keys=True)
            signature = base64.b64decode(signature_b64)
            
            public_key.verify(signature, transaction_string.encode())
            return True
        except InvalidSignature:
            return False
        except Exception:
            return False
    
    @staticmethod
    def create_transaction_payload(sender_wallet_id, receiver_wallet_id, amount, currency='CAD'):
        """Create a complete WavePay transaction payload"""
        physics_data = WavePayQuantum.simulate_physics_data()
        physics_signature = WavePayQuantum.generate_physics_signature(physics_data)
        
        transaction_id = f"TX{int(time.time() * 1000)}{random.randint(1000, 9999)}"
        
        transaction_data = {
            'transaction_id': transaction_id,
            'sender_wallet_id': sender_wallet_id,
            'receiver_wallet_id': receiver_wallet_id,
            'amount': amount,
            'currency': currency,
            'physics_data': physics_data,
            'physics_signature': physics_signature,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        return transaction_data