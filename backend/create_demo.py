#!/usr/bin/env python3
import requests
import json
import sys

BASE_URL = "http://localhost:5000"

def create_demo_wallets():
    """Create demo buyer and seller wallets"""
    print("Creating demo wallets...")
    
    # Create buyer wallet with 10000 CAD
    buyer_response = requests.post(f"{BASE_URL}/wavepay/create_wallet", 
        json={"initial_balance": 10000.0, "currency": "CAD"})
    
    if buyer_response.status_code != 201:
        print("Error creating buyer wallet")
        return None
    
    buyer_data = buyer_response.json()
    buyer_wallet = buyer_data['wallet']
    buyer_private_key = buyer_data['private_key']
    
    # Create seller wallet with 0 CAD
    seller_response = requests.post(f"{BASE_URL}/wavepay/create_wallet",
        json={"initial_balance": 0.0, "currency": "CAD"})
    
    if seller_response.status_code != 201:
        print("Error creating seller wallet")
        return None
    
    seller_data = seller_response.json()
    seller_wallet = seller_data['wallet']
    seller_private_key = seller_data['private_key']
    
    print("✅ Demo wallets created successfully!")
    print(f"👤 Buyer Wallet: {buyer_wallet['wallet_id']}")
    print(f"   Balance: ${buyer_wallet['balance']} {buyer_wallet['currency']}")
    print(f"   Private Key: {buyer_private_key[:20]}...")
    print()
    print(f"🏪 Seller Wallet: {seller_wallet['wallet_id']}")
    print(f"   Balance: ${seller_wallet['balance']} {seller_wallet['currency']}")
    print(f"   Private Key: {seller_private_key[:20]}...")
    
    return {
        'buyer': {'wallet': buyer_wallet, 'private_key': buyer_private_key},
        'seller': {'wallet': seller_wallet, 'private_key': seller_private_key}
    }

if __name__ == "__main__":
    create_demo_wallets()