from flask import request, jsonify
from models import db, Transaction, WavePayWallet, WavePayTransaction
from datetime import datetime, timedelta
import json
from wavepay_utils import WavePayQuantum

def init_routes(app):
    @app.route('/')
    def index():
        return {'message': 'MobilePOS Lite API', 'status': 'online'}
    
    @app.route('/add', methods=['POST'])
    def add_transaction():
        try:
            data = request.get_json()
            
            # Handle both single and bulk transactions
            transactions_data = data if isinstance(data, list) else [data]
            created_transactions = []
            
            for trans_data in transactions_data:
                # Check if transaction already exists (for sync)
                if 'local_id' in trans_data:
                    existing = Transaction.query.filter_by(local_id=trans_data['local_id']).first()
                    if existing:
                        continue
                
                transaction = Transaction(
                    product_name=trans_data['product_name'],
                    amount=float(trans_data['amount']),
                    quantity=int(trans_data['quantity']),
                    payment_type=trans_data['payment_type'],
                    timestamp=datetime.fromisoformat(trans_data['timestamp'].replace('Z', '+00:00')),
                    synced=True,
                    local_id=trans_data.get('local_id')
                )
                
                db.session.add(transaction)
                created_transactions.append(transaction)
            
            db.session.commit()
            
            return jsonify({
                'message': f'Added {len(created_transactions)} transaction(s)',
                'transactions': [t.to_dict() for t in created_transactions]
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    
    @app.route('/transactions', methods=['GET'])
    def get_transactions():
        try:
            # Get date range filters
            days = request.args.get('days', type=int)
            start_date = request.args.get('start_date')
            end_date = request.args.get('end_date')
            
            query = Transaction.query
            
            if days:
                start_date = datetime.utcnow() - timedelta(days=days)
                query = query.filter(Transaction.timestamp >= start_date)
            elif start_date and end_date:
                start = datetime.fromisoformat(start_date)
                end = datetime.fromisoformat(end_date)
                query = query.filter(Transaction.timestamp.between(start, end))
            
            transactions = query.order_by(Transaction.timestamp.desc()).all()
            
            return jsonify({
                'transactions': [t.to_dict() for t in transactions],
                'count': len(transactions)
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    
    @app.route('/sync', methods=['POST'])
    def sync_transactions():
        try:
            data = request.get_json()
            transactions_data = data.get('transactions', [])
            
            if not transactions_data:
                return jsonify({'message': 'No transactions to sync'}), 400
            
            synced_count = 0
            synced_ids = []
            
            for trans_data in transactions_data:
                # Check if already exists
                existing = Transaction.query.filter_by(local_id=trans_data['local_id']).first()
                if not existing:
                    transaction = Transaction(
                        product_name=trans_data['product_name'],
                        amount=float(trans_data['amount']),
                        quantity=int(trans_data['quantity']),
                        payment_type=trans_data['payment_type'],
                        timestamp=datetime.fromisoformat(trans_data['timestamp'].replace('Z', '+00:00')),
                        synced=True,
                        local_id=trans_data['local_id']
                    )
                    db.session.add(transaction)
                    synced_count += 1
                    synced_ids.append(trans_data['local_id'])
            
            db.session.commit()
            
            return jsonify({
                'message': f'Synced {synced_count} transactions',
                'synced_ids': synced_ids
            }), 201
            
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    
    @app.route('/stats', methods=['GET'])
    def get_stats():
        try:
            # Daily stats
            today = datetime.utcnow().date()
            today_start = datetime.combine(today, datetime.min.time())
            
            daily_transactions = Transaction.query.filter(
                Transaction.timestamp >= today_start
            ).all()
            
            daily_total = sum(t.amount * t.quantity for t in daily_transactions)
            daily_count = len(daily_transactions)
            
            # Weekly stats
            week_start = today - timedelta(days=today.weekday())
            week_start_dt = datetime.combine(week_start, datetime.min.time())
            
            weekly_transactions = Transaction.query.filter(
                Transaction.timestamp >= week_start_dt
            ).all()
            
            weekly_total = sum(t.amount * t.quantity for t in weekly_transactions)
            weekly_count = len(weekly_transactions)
            
            return jsonify({
                'daily': {
                    'total': daily_total,
                    'count': daily_count,
                    'transactions': [t.to_dict() for t in daily_transactions]
                },
                'weekly': {
                    'total': weekly_total,
                    'count': weekly_count
                }
            })
            
        except Exception as e:
            return jsonify({'error': str(e)}), 400
    
    # WavePay Quantum Endpoints
    @app.route('/wavepay/test', methods=['GET'])
    def test_wavepay():
        return jsonify({
            'success': True,
            'message': 'WavePay endpoints are working!',
            'endpoints': {
                'create_wallet': 'POST /wavepay/create_wallet',
                'create_transaction': 'POST /wavepay/create_transaction', 
                'process_transaction': 'POST /wavepay/process_transaction'
            }
        })
    
    @app.route('/wavepay/create_wallet', methods=['POST'])
    def create_wavepay_wallet():
        try:
            data = request.get_json()
            initial_balance = data.get('initial_balance', 0.0)
            currency = data.get('currency', 'CAD')
            
            # Generate wallet
            wallet_id = WavePayQuantum.generate_wallet_id()
            key_pair = WavePayQuantum.generate_key_pair()
            
            wallet = WavePayWallet(
                wallet_id=wallet_id,
                public_key=key_pair['public_key'],
                balance=initial_balance,
                currency=currency
            )
            
            db.session.add(wallet)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'wallet': wallet.to_dict(),
                'private_key': key_pair['private_key']  # Only returned once!
            }), 201
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/wavepay/get_wallet/<wallet_id>')
    def get_wavepay_wallet(wallet_id):
        try:
            wallet = WavePayWallet.query.filter_by(wallet_id=wallet_id).first()
            if not wallet:
                return jsonify({'success': False, 'error': 'Wallet not found'}), 404
            
            return jsonify({
                'success': True,
                'wallet': wallet.to_dict()
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/wavepay/create_transaction', methods=['POST'])
    def create_wavepay_transaction():
        try:
            data = request.get_json()
            
            # Validate required fields
            required_fields = ['sender_wallet_id', 'receiver_wallet_id', 'amount', 'private_key']
            for field in required_fields:
                if field not in data:
                    return jsonify({'success': False, 'error': f'Missing field: {field}'}), 400
            
            # Create transaction payload
            transaction_data = WavePayQuantum.create_transaction_payload(
                data['sender_wallet_id'],
                data['receiver_wallet_id'],
                float(data['amount']),
                data.get('currency', 'CAD')
            )
            
            # Sign the transaction
            digital_signature = WavePayQuantum.sign_transaction(
                transaction_data,
                data['private_key']
            )
            
            # Add signature to transaction data
            transaction_data['digital_signature'] = digital_signature
            
            return jsonify({
                'success': True,
                'transaction': transaction_data,
                'qr_data': json.dumps(transaction_data)  # For QR code generation
            }), 201
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/wavepay/verify_transaction', methods=['POST'])
    def verify_wavepay_transaction():
        try:
            data = request.get_json()
            transaction_data = data.get('transaction')
            
            if not transaction_data:
                return jsonify({'success': False, 'error': 'No transaction data provided'}), 400
            
            # Get sender wallet to verify signature
            sender_wallet = WavePayWallet.query.filter_by(
                wallet_id=transaction_data['sender_wallet_id']
            ).first()
            
            if not sender_wallet:
                return jsonify({'success': False, 'error': 'Sender wallet not found'}), 404
            
            # Verify digital signature
            signature_valid = WavePayQuantum.verify_signature(
                {k: v for k, v in transaction_data.items() if k != 'digital_signature'},
                transaction_data['digital_signature'],
                sender_wallet.public_key
            )
            
            if not signature_valid:
                return jsonify({'success': False, 'error': 'Invalid digital signature'}), 400
            
            # Verify physics signature
            physics_signature = WavePayQuantum.generate_physics_signature(
                transaction_data['physics_data']
            )
            
            if physics_signature != transaction_data['physics_signature']:
                return jsonify({'success': False, 'error': 'Invalid physics signature'}), 400
            
            return jsonify({
                'success': True,
                'message': 'Transaction verified successfully'
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/wavepay/process_transaction', methods=['POST'])
    def process_wavepay_transaction():
        try:
            data = request.get_json()
            transaction_data = data.get('transaction')
            
            if not transaction_data:
                return jsonify({'success': False, 'error': 'No transaction data provided'}), 400
            
            # Verify transaction first by checking signature and wallet
            sender_wallet = WavePayWallet.query.filter_by(
                wallet_id=transaction_data['sender_wallet_id']
            ).first()
            
            if not sender_wallet:
                return jsonify({'success': False, 'error': 'Sender wallet not found'}), 404
            
            # Verify digital signature
            signature_valid = WavePayQuantum.verify_signature(
                {k: v for k, v in transaction_data.items() if k != 'digital_signature'},
                transaction_data['digital_signature'],
                sender_wallet.public_key
            )
            
            if not signature_valid:
                return jsonify({'success': False, 'error': 'Invalid digital signature'}), 400
            
            # Verify physics signature
            physics_signature = WavePayQuantum.generate_physics_signature(
                transaction_data['physics_data']
            )
            
            if physics_signature != transaction_data['physics_signature']:
                return jsonify({'success': False, 'error': 'Invalid physics signature'}), 400
            
            # Check if transaction already exists
            existing_tx = WavePayTransaction.query.filter_by(
                transaction_id=transaction_data['transaction_id']
            ).first()
            
            if existing_tx:
                return jsonify({'success': False, 'error': 'Transaction already processed'}), 400
            
            # Get receiver wallet
            receiver_wallet = WavePayWallet.query.filter_by(
                wallet_id=transaction_data['receiver_wallet_id']
            ).first()
            
            if not receiver_wallet:
                return jsonify({'success': False, 'error': 'Receiver wallet not found'}), 404
            
            # Check sender balance
            if sender_wallet.balance < transaction_data['amount']:
                return jsonify({'success': False, 'error': 'Insufficient balance'}), 400
            
            # Create WavePay transaction record
            wavepay_tx = WavePayTransaction(
                transaction_id=transaction_data['transaction_id'],
                sender_wallet_id=transaction_data['sender_wallet_id'],
                receiver_wallet_id=transaction_data['receiver_wallet_id'],
                amount=transaction_data['amount'],
                currency=transaction_data.get('currency', 'CAD'),
                physics_signature=transaction_data['physics_signature'],
                digital_signature=transaction_data['digital_signature'],
                status='completed',
                synced=True
            )
            
            # Update balances
            sender_wallet.balance -= transaction_data['amount']
            receiver_wallet.balance += transaction_data['amount']
            
            db.session.add(wavepay_tx)
            db.session.commit()
            
            # Also create a POS transaction record
            pos_transaction = Transaction(
                product_name="WavePay Payment",
                amount=transaction_data['amount'],
                quantity=1,
                payment_type="wavepay",
                timestamp=datetime.fromisoformat(transaction_data['timestamp'].replace('Z', '+00:00')),
                synced=True,
                local_id=f"wavepay_{transaction_data['transaction_id']}",
                wavepay_transaction_id=transaction_data['transaction_id']
            )
            
            db.session.add(pos_transaction)
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Transaction processed successfully',
                'transaction_id': transaction_data['transaction_id'],
                'new_balances': {
                    'sender': sender_wallet.balance,
                    'receiver': receiver_wallet.balance
                }
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/wavepay/sync_transactions', methods=['POST'])
    def sync_wavepay_transactions():
        try:
            data = request.get_json()
            transactions = data.get('transactions', [])
            
            synced_count = 0
            synced_ids = []
            
            for tx_data in transactions:
                # Check if transaction already exists
                existing = WavePayTransaction.query.filter_by(
                    transaction_id=tx_data['transaction_id']
                ).first()
                
                if not existing:
                    # Process each transaction
                    wavepay_tx = WavePayTransaction(
                        transaction_id=tx_data['transaction_id'],
                        sender_wallet_id=tx_data['sender_wallet_id'],
                        receiver_wallet_id=tx_data['receiver_wallet_id'],
                        amount=tx_data['amount'],
                        currency=tx_data.get('currency', 'CAD'),
                        physics_signature=tx_data['physics_signature'],
                        digital_signature=tx_data['digital_signature'],
                        status='completed',
                        synced=True
                    )
                    
                    db.session.add(wavepay_tx)
                    synced_count += 1
                    synced_ids.append(tx_data['transaction_id'])
            
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': f'Synced {synced_count} WavePay transactions',
                'synced_ids': synced_ids
            }), 201
            
        except Exception as e:
            db.session.rollback()
            return jsonify({'success': False, 'error': str(e)}), 400
    
    @app.route('/wavepay/transactions/<wallet_id>')
    def get_wavepay_transactions(wallet_id):
        try:
            transactions = WavePayTransaction.query.filter(
                (WavePayTransaction.sender_wallet_id == wallet_id) |
                (WavePayTransaction.receiver_wallet_id == wallet_id)
            ).order_by(WavePayTransaction.timestamp.desc()).all()
            
            return jsonify({
                'success': True,
                'transactions': [tx.to_dict() for tx in transactions]
            })
            
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 400