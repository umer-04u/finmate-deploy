# FINMATE: AI-Powered Financial Intelligence Dashboard

FINMATE is a high-performance personal finance dashboard designed to transform raw bank statements into actionable insights. Utilizing Isolation Forests for anomaly detection and NLP-driven heuristics for categorization, FINMATE provides a modern, interactive experience for tracking and analyzing your spending habits.

## 🚀 Features

- **Dynamic Data Ingestion:** Robust CSV parsing for various bank statement formats with automated column mapping.
- **Smart Categorization:** Advanced NLP heuristics that automatically group transactions into categories like Food, Utilities, Shopping, and more.
- **Anomaly Detection:** Utilizes **Isolation Forests** (Machine Learning) to identify unusual spending patterns and potential financial risks.
- **Interactive Visualizations:** Deep-dive into your finances with monthly trends, category breakdowns, and historical expenditure charts.
- **Manual Adjustments:** Add manual transactions for cash expenses or corrections to keep your records perfectly accurate.
- **Real-time Analytics:** Instant KPI updates (Total Income, Expenses, Savings Rate) upon data upload or modification.

## 🛠️ Technology Stack

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Data Processing:** [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Machine Learning:** [Scikit-learn](https://scikit-learn.org/)
- **Forecasting:** Statsmodels (ARIMA)

### Frontend
- **Framework:** [React](https://react.dev/) (Vite)
- **Styling:** Tailwind CSS
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** Lucide React

## 📦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/finmate.git
   cd finmate
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── ml/             # ML Models (Anomalies, Categorization)
│   │   ├── routers/        # API Endpoints
│   │   ├── services/       # Data processing logic
│   │   └── utils/          # Supabase and Auth utilities
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/     # UI Components (Charts, Tables)
│   │   ├── services/       # API integration
│   │   └── App.jsx         # Main Dashboard logic
│   └── tailwind.config.js
└── docs/                   # Detailed architecture & API guides
```

## 🛡️ Security & Privacy
FINMATE is designed with privacy in mind. Data is securely stored in your **Supabase** instance, ensuring your sensitive financial data remains under your control through Row Level Security (RLS) policies.

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.
