# FINMATE: AI-Powered Financial Intelligence Monolith

FINMATE is a high-performance, premium financial intelligence dashboard designed to transform raw bank statements into actionable narratives. Engineered with a "Monolith" aesthetic, it utilizes Isolation Forests for anomaly detection and neural-inspired heuristics for categorization, providing a sovereign experience for financial clarity.

## 🚀 Features

- **Dynamic Data Ingestion:** Robust CSV/Excel parsing for various bank statement formats with automated column mapping.
- **Neural Categorization:** Advanced heuristics that automatically group transactions into sectors like Food & Dining, Investment, Utilities, and more.
- **Anomaly Detection:** Utilizes **Isolation Forests** (Machine Learning) to identify unusual spending patterns and potential financial risks.
- **Bento Grid Dashboard:** A responsive, interactive dashboard featuring monthly trends, sector allocations, and a real-time ledger.
- **Cross-Platform Responsive:** Optimized for mobile, tablet, and desktop with a fluid sidebar and adaptive grid system.
- **Manual Entry Protocol:** Add manual transactions for cash expenses or corrections to keep your records perfectly accurate.
- **Sovereign Security:** Built-in Supabase integration with Row Level Security (RLS) ensuring your data remains under your absolute control.

## 🛠️ Technology Stack

### Backend (Neural Engine)

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **Data Processing:** [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Machine Learning:** [Scikit-learn](https://scikit-learn.org/) (Isolation Forest)
- **Deployment:** [Uvicorn](https://www.uvicorn.org/)

### Frontend (Command Center)

- **Framework:** [Astro](https://astro.build/) + [React](https://react.dev/)
- **Styling:** Premium Vanilla CSS + [Framer Motion](https://www.framer.com/motion/)
- **Charts:** [Recharts](https://recharts.org/)
- **Icons:** Lucide React

## 📦 Deployment

### Docker (Recommended)

The project includes a multi-stage Dockerfile for unified deployment.

1. **Build and Run:**

   ```bash
   docker build \
     --build-arg VITE_SUPABASE_URL=your_url \
     --build-arg VITE_SUPABASE_ANON_KEY=your_key \
     --build-arg VITE_API_URL=/api \
     -t finmate .
   
   docker run -p 8000:8000 finmate
   ```

### Manual Installation

1. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

2. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run build
   ```

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── ml/             # ML Models (Anomalies, Categorization)
│   │   ├── routers/        # API Endpoints (Transactions, Analytics)
│   │   ├── services/       # Core Logic (Parsing, Persistence)
│   │   └── main.py         # FastAPI Entry Point
│   └── Dockerfile          # Backend-only Docker
├── frontend/
│   ├── src/
│   │   ├── components/     # React UI Components
│   │   ├── layouts/        # Astro Layouts
│   │   ├── pages/          # Astro Pages (Routing)
│   │   └── styles/         # Global & Theme Styles
│   └── astro.config.mjs
└── Dockerfile              # Unified Multi-stage Docker
```

## 🛡️ Security & Privacy

FINMATE is designed with privacy in mind. Data is securely stored in your **Supabase** instance, ensuring your sensitive financial data remains under your control through Row Level Security (RLS) policies.

## 📄 License

This project is licensed under the MIT License.
