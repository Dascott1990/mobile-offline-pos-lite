// Main application logic
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize database
    try {
        await dbManager.init();
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database:', error);
    }

    // Update current time
    updateCurrentTime();
    setInterval(updateCurrentTime, 60000);

    // Page-specific initialization
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    switch(currentPage) {
        case 'index.html':
            await initDashboard();
            break;
        case 'add.html':
            initSalePage();
            break;
        case 'receipt.html':
            initReceiptPage();
            break;
    }

    // Setup sync button if it exists
    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', manualSync);
    }

    // Initial sync check
    if (syncManager.isOnline) {
        setTimeout(() => syncPending(), 2000);
    }
});

// Update current time display
function updateCurrentTime() {
    const timeElement = document.getElementById('currentTime');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleString();
    }
}

// Dashboard initialization
async function initDashboard() {
    await updateDashboard();
    
    // Set up periodic updates
    setInterval(async () => {
        await updateDashboard();
    }, 30000); // Update every 30 seconds
}

// Update dashboard data
async function updateDashboard() {
    try {
        const stats = await getCombinedStats();
        const transactions = await getAllTransactions();
        
        updateStatsDisplay(stats);
        updateTransactionsTable(transactions);
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
    }
}

// Update statistics display
function updateStatsDisplay(stats) {
    // Daily stats
    const dailyTotal = document.getElementById('dailyTotal');
    const dailyCount = document.getElementById('dailyCount');
    
    if (dailyTotal) {
        dailyTotal.textContent = `$${stats.daily.total.toFixed(2)}`;
        dailyCount.textContent = `${stats.daily.count} transactions`;
    }

    // Weekly stats
    const weeklyTotal = document.getElementById('weeklyTotal');
    const weeklyCount = document.getElementById('weeklyCount');
    
    if (weeklyTotal) {
        weeklyTotal.textContent = `$${stats.weekly.total.toFixed(2)}`;
        weeklyCount.textContent = `${stats.weekly.count} transactions`;
    }

    // Pending sync
    const pendingCount = document.getElementById('pendingCount');
    if (pendingCount) {
        pendingCount.textContent = stats.pending || '0';
    }
}

// Update transactions table
function updateTransactionsTable(transactions) {
    const tbody = document.getElementById('transactionsBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (transactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">
                    <i class="fas fa-inbox"></i> No transactions yet
                </td>
            </tr>
        `;
        return;
    }

    transactions.slice(0, 50).forEach(transaction => { // Limit to 50 most recent
        const row = document.createElement('tr');
        
        const date = new Date(transaction.timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = date.toLocaleDateString();
        
        const total = transaction.amount * transaction.quantity;
        const statusBadge = transaction.synced 
            ? '<span class="badge bg-success status-badge">Synced</span>'
            : '<span class="badge bg-warning status-badge">Pending</span>';

        row.innerHTML = `
            <td>
                <small>${dateString}</small><br>
                <strong>${timeString}</strong>
            </td>
            <td>${escapeHtml(transaction.product_name)}</td>
            <td>${transaction.quantity}</td>
            <td>$${total.toFixed(2)}</td>
            <td>
                <span class="badge bg-secondary">${escapeHtml(transaction.payment_type)}</span>
            </td>
            <td>${statusBadge}</td>
        `;

        tbody.appendChild(row);
    });
}

// Sale page initialization
function initSalePage() {
    console.log('Sale page initialized');
    // Additional sale page logic can go here
}

// Receipt page initialization
function initReceiptPage() {
    console.log('Receipt page initialized');
    // Receipt page logic will be handled in receipt.js
}

// Utility function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export updateDashboard for global access
window.updateDashboard = updateDashboard;