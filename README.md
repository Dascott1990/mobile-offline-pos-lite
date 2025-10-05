```markdown
# MobilePOS Lite

**Tagline:** *Offline-first Point-of-Sale app for street vendors and small merchants.*

A lightweight **POS system** built with **Flask (Python)** for the backend and **vanilla JavaScript + Bootstrap 5** for the frontend. Designed to work **fully offline** with automatic sync when connectivity is restored.

---

## ✨ Features

* ✅ **Offline Transaction Logging** – Save sales, products, amounts, and payment types without internet
* ✅ **Auto Sync** – Pending transactions sync to the server when connection is restored
* ✅ **Analytics Dashboard** – Daily and weekly sales summaries with simple charts
* ✅ **Receipt Generation** – PDF receipts for printing or sharing
* ✅ **Local Encryption** – Protects data if device is lost
* ✅ **Service Worker Caching** – Works seamlessly offline (PWA-ready)
* ✅ **Responsive UI** – Bootstrap 5 for mobile & desktop

---

## 🚀 Quick Start

### Prerequisites

* Python **3.7+**
* pip (Python package manager)
* A modern browser with IndexedDB (Chrome, Firefox, Edge, Safari)

---

### 1️⃣ Installation

Clone the repository:

```bash
git clone https://github.com/your-username/mobilepos-lite.git
cd mobilepos-lite
```

Set up a virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows
```

Install backend dependencies:

```bash
cd backend
pip install -r requirements.txt
```

---

### 2️⃣ Running the Backend

From the project root:

```bash
cd backend
python app.py
```

The backend runs by default at:

```
http://127.0.0.1:5000
```

---

### 3️⃣ Running the Frontend

In a **separate terminal**:

```bash
cd frontend
python -m http.server 8000
```

Open in browser:

```
http://127.0.0.1:8000
```

---

### 4️⃣ Accessing on Your Phone (via ngrok)

Expose local servers for mobile testing:

```bash
# Install ngrok first: https://ngrok.com/download
ngrok http 5000   # backend
ngrok http 8000   # frontend
```

Use the ngrok HTTPS URLs on your phone browser. Update `frontend/js/sync.js` with your backend ngrok URL for live testing.

---

## 🎯 Demo: Offline → Online Sync Flow

1. **Start offline** (turn off WiFi)
2. **Record sales** via "New Sale" page:
   - Coffee ×2 @ $3.50 = $7.00 (Cash)
   - Sandwich ×1 @ $8.99 = $8.99 (Card)
   - Cookie ×3 @ $2.25 = $6.75 (Mobile)
3. **Check dashboard** – transactions show "Pending" status
4. **Go online** (turn WiFi back on)
5. **Watch auto-sync** – transactions automatically upload to backend
6. **Verify sync** – dashboard updates to "Synced" status
7. **Generate receipts** – create PDF receipts for any transaction

---

## 📂 Project Structure

```
mobilepos-lite/
│
├── backend/             # Flask backend
│   ├── app.py          # Main Flask application
│   ├── models.py       # SQLAlchemy database models
│   ├── routes.py       # API endpoints (/add, /sync, /transactions)
│   ├── config.py       # App configuration
│   ├── requirements.txt
│   └── transactions.db # SQLite database (auto-created)
│
├── frontend/           # Vanilla JS + Bootstrap frontend
│   ├── index.html      # Dashboard with analytics
│   ├── add.html        # New sale form
│   ├── receipt.html    # PDF receipt generator
│   ├── css/
│   │   └── style.css   # Custom styles
│   ├── js/
│   │   ├── main.js     # App initialization & UI
│   │   ├── db.js       # IndexedDB operations & encryption
│   │   ├── sync.js     # Offline/online sync logic
│   │   └── receipt.js  # PDF generation with jsPDF
│   ├── service-worker.js # Offline caching
│   └── manifest.json   # PWA config
│
└── README.md
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | API status check |
| `POST` | `/add` | Add single or bulk transactions |
| `GET` | `/transactions` | Get all transactions (with date filters) |
| `POST` | `/sync` | Bulk sync offline transactions |
| `GET` | `/stats` | Get daily/weekly sales analytics |

---

## 🛠 Tech Stack

* **Backend:** Python Flask + SQLite + SQLAlchemy
* **Frontend:** HTML5, Vanilla JavaScript, Bootstrap 5, IndexedDB
* **Offline Support:** Service Workers + local caching
* **Security:** Local AES encryption for sensitive data
* **PDF Generation:** jsPDF for client-side receipts
* **Sync:** REST API + automatic retry logic

---

## 🔮 Roadmap

* [ ] Add multi-user login (JWT)
* [ ] Add inventory management
* [ ] Add CSV/Excel export
* [ ] Add cloud sync (Supabase / Firebase)
* [ ] Optional crypto payments (USDC/Solana)
* [ ] Barcode scanning support
* [ ] Multi-currency support
* [ ] Advanced reporting & analytics

---

## 🐛 Troubleshooting

**Backend won't start:**
- Ensure you're in the virtual environment: `source venv/bin/activate`
- Check all dependencies: `pip install -r requirements.txt`
- Port 5000 might be busy: `python app.py --port 5001`

**Frontend sync issues:**
- Verify backend is running on port 5000
- Check browser console for CORS errors
- Update API_BASE in `frontend/js/sync.js` if using ngrok

**Offline functionality not working:**
- Ensure Service Worker is registered (check Application tab in DevTools)
- Verify browser supports IndexedDB

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📜 License

MIT License © 2025 MobilePOS Lite Contributors

---

## 🙏 Acknowledgments

* Bootstrap 5 for the responsive UI components
* jsPDF for client-side PDF generation
* Flask community for the lightweight backend framework
```
