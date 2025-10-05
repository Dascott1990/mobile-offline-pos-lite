const API_BASE = 'http://localhost:5000';

class SyncManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInProgress = false;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.updateConnectionStatus();
            this.syncPendingTransactions();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.updateConnectionStatus();
        });

        // Initial status check
        this.updateConnectionStatus();
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (statusElement) {
            if (this.isOnline) {
                statusElement.classList.add('d-none');
            } else {
                statusElement.classList.remove('d-none');
                statusElement.innerHTML = '<i class="fas fa-wifi-slash"></i> You are currently offline. Transactions will be saved locally and synced when connection is restored.';
            }
        }
    }

    // Check if backend is accessible
    async checkBackend() {
        try {
            const response = await fetch(`${API_BASE}/`, { 
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Sync single transaction
    async syncTransaction(transaction) {
        try {
            const response = await fetch(`${API_BASE}/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(transaction)
            });

            if (response.ok) {
                const result = await response.json();
                return { success: true, data: result };
            } else {
                return { success: false, error: 'Server error' };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Sync all pending transactions
    async syncPendingTransactions() {
        if (this.syncInProgress || !this.isOnline) return;

        const backendAvailable = await this.checkBackend();
        if (!backendAvailable) return;

        this.syncInProgress = true;
        
        try {
            const unsyncedTransactions = await getUnsyncedTransactions();
            
            if (unsyncedTransactions.length === 0) {
                console.log('No transactions to sync');
                this.syncInProgress = false;
                return;
            }

            console.log(`Syncing ${unsyncedTransactions.length} transactions...`);

            // Try bulk sync first
            const bulkResult = await this.bulkSync(unsyncedTransactions);
            
            if (bulkResult.success) {
                await markAsSynced(bulkResult.syncedIds);
                console.log(`Successfully synced ${bulkResult.syncedIds.length} transactions`);
            } else {
                // Fallback to individual sync
                console.log('Bulk sync failed, trying individual transactions...');
                await this.individualSync(unsyncedTransactions);
            }

            // Update UI if we're on the dashboard
            if (typeof updateDashboard === 'function') {
                updateDashboard();
            }

        } catch (error) {
            console.error('Sync error:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    // Bulk sync transactions
    async bulkSync(transactions) {
        try {
            const response = await fetch(`${API_BASE}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transactions })
            });

            if (response.ok) {
                const result = await response.json();
                return { 
                    success: true, 
                    syncedIds: result.synced_ids || transactions.map(t => t.local_id) 
                };
            } else {
                return { success: false };
            }
        } catch (error) {
            return { success: false };
        }
    }

    // Individual transaction sync
    async individualSync(transactions) {
        const syncedIds = [];

        for (const transaction of transactions) {
            const result = await this.syncTransaction(transaction);
            if (result.success) {
                syncedIds.push(transaction.local_id);
            } else {
                console.warn(`Failed to sync transaction ${transaction.local_id}:`, result.error);
            }
        }

        if (syncedIds.length > 0) {
            await markAsSynced(syncedIds);
        }

        return syncedIds;
    }

    // Manual sync trigger
    async manualSync() {
        const syncBtn = document.getElementById('syncBtn');
        if (syncBtn) {
            const originalHtml = syncBtn.innerHTML;
            syncBtn.innerHTML = '<i class="fas fa-sync fa-spin"></i> Syncing...';
            syncBtn.disabled = true;

            try {
                await this.syncPendingTransactions();
                
                // Show success feedback
                syncBtn.innerHTML = '<i class="fas fa-check"></i> Synced!';
                syncBtn.className = 'btn btn-success btn-lg';
                
                setTimeout(() => {
                    syncBtn.innerHTML = originalHtml;
                    syncBtn.className = 'btn btn-outline-success btn-lg';
                    syncBtn.disabled = false;
                }, 2000);
                
            } catch (error) {
                syncBtn.innerHTML = '<i class="fas fa-times"></i> Sync Failed';
                syncBtn.className = 'btn btn-danger btn-lg';
                
                setTimeout(() => {
                    syncBtn.innerHTML = originalHtml;
                    syncBtn.className = 'btn btn-outline-success btn-lg';
                    syncBtn.disabled = false;
                }, 2000);
            }
        }
    }

    // Fetch transactions from backend
    async fetchBackendTransactions(days = 7) {
        try {
            const response = await fetch(`${API_BASE}/transactions?days=${days}`);
            if (response.ok) {
                const data = await response.json();
                return data.transactions || [];
            }
            return [];
        } catch (error) {
            console.error('Error fetching backend transactions:', error);
            return [];
        }
    }

    // Get combined stats from backend and local
    async getCombinedStats() {
        if (this.isOnline) {
            try {
                const response = await fetch(`${API_BASE}/stats`);
                if (response.ok) {
                    const data = await response.json();
                    return data;
                }
            } catch (error) {
                console.warn('Could not fetch stats from backend, using local data');
            }
        }

        // Fallback to local stats
        return await getStats();
    }
}

// Global sync manager instance
const syncManager = new SyncManager();

// Export functions for global use
async function syncPending() {
    return await syncManager.syncPendingTransactions();
}

async function manualSync() {
    return await syncManager.manualSync();
}

async function fetchBackendTransactions(days = 7) {
    return await syncManager.fetchBackendTransactions(days);
}

async function getCombinedStats() {
    return await syncManager.getCombinedStats();
}