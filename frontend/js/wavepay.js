// WavePay Quantum JavaScript SDK
class WavePaySDK {
    constructor() {
        this.apiBase = 'http://localhost:5000';
        this.sellerWalletId = null;
        this.sellerPrivateKey = null;
    }

    // Initialize seller wallet
    async initializeSellerWallet(initialBalance = 0) {
        try {
            const response = await fetch(`${this.apiBase}/wavepay/create_wallet`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ initial_balance: initialBalance })
            });

            const data = await response.json();
            
            if (data.success) {
                this.sellerWalletId = data.wallet.wallet_id;
                this.sellerPrivateKey = data.private_key;
                
                // Store in localStorage for persistence
                localStorage.setItem('wavepay_seller_wallet_id', this.sellerWalletId);
                localStorage.setItem('wavepay_seller_private_key', this.sellerPrivateKey);
                
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error initializing seller wallet:', error);
            throw error;
        }
    }

    // Get seller wallet from localStorage or create new one
    async getSellerWallet() {
        const storedWalletId = localStorage.getItem('wavepay_seller_wallet_id');
        const storedPrivateKey = localStorage.getItem('wavepay_seller_private_key');

        if (storedWalletId && storedPrivateKey) {
            this.sellerWalletId = storedWalletId;
            this.sellerPrivateKey = storedPrivateKey;
            
            // Verify wallet exists on backend
            try {
                const response = await fetch(`${this.apiBase}/wavepay/get_wallet/${this.sellerWalletId}`);
                const data = await response.json();
                
                if (data.success) {
                    return data.wallet;
                }
            } catch (error) {
                console.warn('Stored wallet not found on backend, creating new one');
            }
        }

        // Create new wallet if none exists
        return await this.initializeSellerWallet(0);
    }

    // FIXED: Get seller wallet ID - this was missing!
    async getSellerWalletId() {
        if (!this.sellerWalletId) {
            await this.getSellerWallet();
        }
        return this.sellerWalletId;
    }

    // Create WavePay transaction
    async createTransaction(receiverWalletId, amount, currency = 'CAD') {
        try {
            // Make sure we have seller wallet loaded
            if (!this.sellerWalletId || !this.sellerPrivateKey) {
                await this.getSellerWallet();
            }

            const response = await fetch(`${this.apiBase}/wavepay/create_transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_wallet_id: this.sellerWalletId,
                    receiver_wallet_id: receiverWalletId,
                    amount: amount,
                    currency: currency,
                    private_key: this.sellerPrivateKey
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Store pending transaction locally
                this.storePendingTransaction(data.transaction);
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error creating WavePay transaction:', error);
            throw error;
        }
    }

    // ... rest of your existing methods remain the same ...
    // Process received WavePay transaction (from QR scan)
    async processReceivedTransaction(transactionData) {
        try {
            // Verify transaction first
            const verifyResponse = await fetch(`${this.apiBase}/wavepay/verify_transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transaction: transactionData })
            });

            const verifyData = await verifyResponse.json();
            
            if (!verifyData.success) {
                throw new Error('Transaction verification failed: ' + verifyData.error);
            }

            // Process transaction
            const processResponse = await fetch(`${this.apiBase}/wavepay/process_transaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transaction: transactionData })
            });

            const processData = await processResponse.json();
            
            if (processData.success) {
                // Remove from pending if it was stored
                this.removePendingTransaction(transactionData.transaction_id);
                return processData;
            } else {
                throw new Error(processData.error);
            }
        } catch (error) {
            console.error('Error processing WavePay transaction:', error);
            throw error;
        }
    }

    // Store pending transaction in localStorage
    storePendingTransaction(transaction) {
        const pending = this.getPendingTransactions();
        pending[transaction.transaction_id] = {
            ...transaction,
            stored_at: new Date().toISOString()
        };
        localStorage.setItem('wavepay_pending_transactions', JSON.stringify(pending));
    }

    // Get pending transactions from localStorage
    getPendingTransactions() {
        const pending = localStorage.getItem('wavepay_pending_transactions');
        return pending ? JSON.parse(pending) : {};
    }

    // Remove pending transaction
    removePendingTransaction(transactionId) {
        const pending = this.getPendingTransactions();
        delete pending[transactionId];
        localStorage.setItem('wavepay_pending_transactions', JSON.stringify(pending));
    }

    // Sync pending transactions when online
    async syncPendingTransactions() {
        const pending = this.getPendingTransactions();
        const transactions = Object.values(pending);

        if (transactions.length === 0) return;

        try {
            const response = await fetch(`${this.apiBase}/wavepay/sync_transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactions: transactions })
            });

            const data = await response.json();
            
            if (data.success) {
                // Remove synced transactions
                data.synced_ids.forEach(id => {
                    this.removePendingTransaction(id);
                });
                
                console.log(`Synced ${data.synced_ids.length} WavePay transactions`);
            }
        } catch (error) {
            console.error('Error syncing WavePay transactions:', error);
        }
    }

    // Get wallet balance
    async getWalletBalance(walletId) {
        try {
            const response = await fetch(`${this.apiBase}/wavepay/get_wallet/${walletId}`);
            const data = await response.json();
            
            if (data.success) {
                return data.wallet.balance;
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error getting wallet balance:', error);
            return 0;
        }
    }

    // Generate demo wallets for testing
    async generateDemoWallets() {
        // Create buyer wallet with 10000 CAD
        const buyerResponse = await fetch(`${this.apiBase}/wavepay/create_wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initial_balance: 10000.0 })
        });

        const buyerData = await buyerResponse.json();

        // Create seller wallet with 0 CAD
        const sellerResponse = await fetch(`${this.apiBase}/wavepay/create_wallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ initial_balance: 0.0 })
        });

        const sellerData = await sellerResponse.json();

        return {
            buyer: buyerData,
            seller: sellerData
        };
    }
}

// Global WavePay instance
const wavePaySDK = new WavePaySDK();

// Export functions for global use
async function createWavePayTransaction(sellerWalletId, buyerWalletId, amount) {
    return await wavePaySDK.createTransaction(buyerWalletId, amount);
}

async function processWavePayTransaction(transactionData) {
    return await wavePaySDK.processReceivedTransaction(transactionData);
}

// FIXED: This function now properly returns the seller wallet ID
async function getSellerWalletId() {
    return await wavePaySDK.getSellerWalletId();
}

async function initializeDemoWallets() {
    return await wavePaySDK.generateDemoWallets();
}

async function syncWavePayTransactions() {
    return await wavePaySDK.syncPendingTransactions();
}