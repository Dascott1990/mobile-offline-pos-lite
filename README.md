MobilePOS Lite
Tagline: Offline-first Point-of-Sale app for street vendors and small merchants.

A lightweight POS system built with Flask (Python) for the backend and vanilla JavaScript + Bootstrap 5 for the frontend. Designed to work fully offline with automatic sync when connectivity is restored.

📱 Live Application Demo
Dashboard & Analytics
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/image.png

Sales Interface
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/image1.png

Transaction History
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/image2.png

Receipt Generation
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/image3.png

Mobile Responsive Views
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6173.PNG
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6174.PNG
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6175.PNG

Application Features
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6176.PNG
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6177.PNG
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6178.PNG
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6179.PNG
https://github.com/Dascott1990/mobile-offline-pos-lite/raw/main/images/IMG_6180.PNG

✨ Features
✅ Offline Transaction Logging – Save sales, products, amounts, and payment types without internet

✅ Auto Sync – Pending transactions sync to the server when connection is restored

✅ Analytics Dashboard – Daily and weekly sales summaries with simple charts

✅ Receipt Generation – PDF receipts for printing or sharing

✅ Local Encryption – Protects data if device is lost

✅ Service Worker Caching – Works seamlessly offline (PWA-ready)

✅ Responsive UI – Bootstrap 5 for mobile & desktop

🚀 Quick Start
Prerequisites
Python 3.7+

pip (Python package manager)

A modern browser with IndexedDB (Chrome, Firefox, Edge, Safari)

1️⃣ Installation
Clone the repository:

bash
git clone https://github.com/Dascott1990/mobile-offline-pos-lite.git
cd mobile-offline-pos-lite
Set up a virtual environment:

bash
python3 -m venv venv
source venv/bin/activate   # Mac/Linux
venv\Scripts\activate      # Windows
Install backend dependencies:

bash
cd backend
pip install -r requirements.txt
2️⃣ Running the Backend
From the project root:

bash
cd backend
python app.py
The backend runs by default at:

text
http://127.0.0.1:5000
3️⃣ Running the Frontend
In a separate terminal:

bash
cd frontend
python -m http.server 8000
Open in browser:

text
http://127.0.0.1:8000
4️⃣ Try the Live Demo
You can also test the application using our temporary demo URL:

text
https://your-ngrok-url.ngrok.io
(Replace with your actual temporary URL when available)

🎯 Demo: Offline → Online Sync Flow
Start offline (turn off WiFi)

Record sales via "New Sale" page

Check dashboard – transactions show "Pending" status

Go online (turn WiFi back on)

Watch auto-sync – transactions automatically upload to backend

Verify sync – dashboard updates to "Synced" status

Generate receipts – create PDF receipts for any transaction

🔌 API Endpoints
Method	Endpoint	Description
GET	/	API status check
POST	/add	Add single or bulk transactions
GET	/transactions	Get all transactions (with date filters)
POST	/sync	Bulk sync offline transactions
GET	/stats	Get daily/weekly sales analytics
🛠 Tech Stack
Backend: Python Flask + SQLite + SQLAlchemy

Frontend: HTML5, Vanilla JavaScript, Bootstrap 5, IndexedDB

Offline Support: Service Workers + local caching

Security: Local AES encryption for sensitive data

PDF Generation: jsPDF for client-side receipts

Sync: REST API + automatic retry logic

🔮 Roadmap
Add multi-user login (JWT)

Add inventory management

Add CSV/Excel export

Add cloud sync (Supabase / Firebase)

Optional crypto payments (USDC/Solana)

Barcode scanning support

Multi-currency support

Advanced reporting & analytics

🐛 Troubleshooting
Backend won't start:

Ensure you're in the virtual environment: source venv/bin/activate

Check all dependencies: pip install -r requirements.txt

Port 5000 might be busy: python app.py --port 5001

Frontend sync issues:

Verify backend is running on port 5000

Check browser console for CORS errors

Update API_BASE in frontend/js/sync.js if using ngrok

Offline functionality not working:

Ensure Service Worker is registered (check Application tab in DevTools)

Verify browser supports IndexedDB

🤝 Contributing
Fork the repository

Create a feature branch: git checkout -b feature/amazing-feature

Commit your changes: git commit -m 'Add amazing feature'

Push to the branch: git push origin feature/amazing-feature

Open a Pull Request

📜 License
MIT License © 2025 MobilePOS Lite Contributors

🙏 Acknowledgments
Bootstrap 5 for the responsive UI components

jsPDF for client-side PDF generation

Flask community for the lightweight backend framework