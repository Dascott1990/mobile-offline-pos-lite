// IndexedDB configuration
const DB_NAME = 'MobilePOSDB';
const DB_VERSION = 1;
const STORE_NAME = 'transactions';

class IndexedDBManager {
    constructor() {
        this.db = null;
        this.encryptionKey = this.getEncryptionKey();
    }

    // Basic encryption key (in production, use proper key management)
    getEncryptionKey() {
        let key = localStorage.getItem('pos_encryption_key');
        if (!key) {
            // Generate a simple key (in real app, use proper key generation)
            key = 'mobilepos_lite_key_2024_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('pos_encryption_key', key);
        }
        return key;
    }

    // Simple XOR encryption (basic obfuscation)
    encrypt(data) {
        const text = JSON.stringify(data);
        let result = '';
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
        }
        return btoa(result);
    }

    decrypt(encryptedData) {
        try {
            const text = atob(encryptedData);
            let result = '';
            for (let i = 0; i < text.length; i++) {
                result += String.fromCharCode(text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
            }
            return JSON.parse(result);
        } catch (e) {
            console.error('Decryption error:', e);
            return null;
        }
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create transactions store
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'local_id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                    store.createIndex('synced', 'synced', { unique: false });
                }
            };
        });
    }

    // Save transaction to IndexedDB
    async saveTransaction(transaction) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            // Encrypt sensitive data before storing
            const encryptedTransaction = {
                ...transaction,
                product_name: this.encrypt(transaction.product_name),
                payment_type: this.encrypt(transaction.payment_type),
                synced: false
            };

            const request = store.add(encryptedTransaction);

            request.onsuccess = () => resolve(transaction.local_id);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all transactions
    async getAllTransactions() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onsuccess = () => {
                const transactions = request.result.map(encrypted => {
                    const decrypted = {
                        ...encrypted,
                        product_name: this.decrypt(encrypted.product_name),
                        payment_type: this.decrypt(encrypted.payment_type)
                    };
                    return decrypted;
                });
                
                // Sort by timestamp descending
                transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                resolve(transactions);
            };

            request.onerror = () => reject(request.error);
        });
    }

    // Get unsynced transactions
async getUnsyncedTransactions() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
        const tx = this.db.transaction([STORE_NAME], 'readonly');
        const store = tx.objectStore(STORE_NAME);
        
        // Get all transactions and filter manually
        const request = store.getAll();
        
        request.onsuccess = () => {
            const allTransactions = request.result;
            const unsynced = allTransactions.filter(t => !t.synced);
            
            const transactions = unsynced.map(encrypted => {
                const decrypted = {
                    ...encrypted,
                    product_name: this.decrypt(encrypted.product_name),
                    payment_type: this.decrypt(encrypted.payment_type)
                };
                return decrypted;
            });
            
            resolve(transactions);
        };

        request.onerror = () => reject(request.error);
    });
}
    // Mark transactions as synced
    async markAsSynced(localIds) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);

            let completed = 0;
            const total = localIds.length;

            if (total === 0) {
                resolve();
                return;
            }

            localIds.forEach(localId => {
                const getRequest = store.get(localId);
                
                getRequest.onsuccess = () => {
                    const transaction = getRequest.result;
                    if (transaction) {
                        transaction.synced = true;
                        const updateRequest = store.put(transaction);
                        
                        updateRequest.onsuccess = () => {
                            completed++;
                            if (completed === total) {
                                resolve();
                            }
                        };
                        
                        updateRequest.onerror = () => reject(updateRequest.error);
                    } else {
                        completed++;
                        if (completed === total) resolve();
                    }
                };
                
                getRequest.onerror = () => reject(getRequest.error);
            });
        });
    }

    // Delete transaction
    async deleteTransaction(localId) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction([STORE_NAME], 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(localId);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get statistics
    async getStats() {
        const transactions = await this.getAllTransactions();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)

        const dailyTransactions = transactions.filter(t => 
            new Date(t.timestamp) >= today
        );
        
        const weeklyTransactions = transactions.filter(t => 
            new Date(t.timestamp) >= weekStart
        );

        const dailyTotal = dailyTransactions.reduce((sum, t) => sum + (t.amount * t.quantity), 0);
        const weeklyTotal = weeklyTransactions.reduce((sum, t) => sum + (t.amount * t.quantity), 0);

        const unsynced = transactions.filter(t => !t.synced);

        return {
            daily: {
                total: dailyTotal,
                count: dailyTransactions.length
            },
            weekly: {
                total: weeklyTotal,
                count: weeklyTransactions.length
            },
            pending: unsynced.length
        };
    }
}

// Global DB instance
const dbManager = new IndexedDBManager();

// Export functions for global use
async function saveTransaction(transaction) {
    return await dbManager.saveTransaction(transaction);
}

async function getAllTransactions() {
    return await dbManager.getAllTransactions();
}

async function getUnsyncedTransactions() {
    return await dbManager.getUnsyncedTransactions();
}

async function markAsSynced(localIds) {
    return await dbManager.markAsSynced(localIds);
}

async function getStats() {
    return await dbManager.getStats();
}