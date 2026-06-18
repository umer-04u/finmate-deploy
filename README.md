# FINMATE: AI-Powered Financial Intelligence Monolith

FINMATE is a high-performance, premium financial intelligence dashboard designed to transform raw bank statements into actionable narratives. Engineered with a "Monolith" aesthetic, it utilizes Isolation Forests for anomaly detection and neural-inspired heuristics for categorization, providing a sovereign experience for financial clarity.

## 🚀 Features

- **FinMate AI Assistant:** A direct conversational link to your finances powered by **Groq LPU™** and **Llama 3.1**. Ask complex queries and get instant, markdown-formatted advice.
- **Context-Aware Intelligence:** The AI doesn't just talk; it sees. It has real-time access to your expenditure totals, top sectors, and detected anomalies for personalized insights.
- **Dedicated Intelligence Console:** A distraction-free, fullscreen neural interface for deep financial planning and analysis.
- **Dynamic Data Ingestion:** Highly resilient CSV/Excel parser supporting complex multi-bank formats (including SBI and Bandhan Bank). Automatically skips bank metadata, handles multi-line transaction rows, and corrects non-standard numeric formats.
- **Custom-Trained ML Categorizer:** Utilizes a TF-IDF + Random Forest model trained specifically on your manual corrections for high-precision, personalized transaction labeling.
- **Automated Entity Extraction (NER):** Heuristically extracts **Merchant Name**, **Payment Method** (UPI, Card, Cash), and **Location** from raw transaction narratives.
- **Anomaly Detection:** Utilizes **Isolation Forests** (Machine Learning) to identify unusual spending patterns and potential financial risks, with context-aware thresholds for essential expenses.
- **Bento Grid Dashboard:** A high-fidelity, interactive dashboard with adaptive layouts for mobile, tablet, and desktop.
- **Manual Entry Protocol:** Add manual transactions for cash expenses or corrections to keep your records perfectly accurate.
- **Sovereign Security:** Strictly authenticated sessions with Supabase and Row Level Security (RLS), ensuring data sovereignty.

## 🛠️ Technology Stack

### Backend (Neural Engine)

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI Inference:** [Groq API](https://groq.com/) (Llama-3.1-8b-instant)
- **Networking:** [HTTPX](https://www.python-httpx.org/) (Direct API Integration)
- **Data Processing:** [Pandas](https://pandas.pydata.org/), [NumPy](https://numpy.org/)
- **Machine Learning:** [Scikit-learn](https://scikit-learn.org/) (Isolation Forest)

### Frontend (Command Center)

- **Framework:** [Astro](https://astro.build/) + [React](https://react.dev/)
- **Motion:** [Framer Motion](https://www.framer.com/motion/) (Premium animations & micro-interactions)
- **Charts:** [Recharts](https://recharts.org/)
- **Real-time:** [Supabase](https://supabase.com/) + `ws` (WebSocket support for Node.js builds)
- **Styling:** Premium Vanilla CSS (Monolith Design System)

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
