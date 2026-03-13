# FINMATE: Viva Presentation Outline

**Slide Formatting Guideline:** Ensure slides have a professional, academic, yet modern design (e.g., dark blue/grey background, clean white/cyan typography). Do not use excessive text; use bullet points and diagrams.

---

### Slide 1: Title Slide
* **Title:** FINMATE — AI-Powered Budget & Expenditure Analysis System
* **Subtitle:** Final Year Engineering Project
* **Presented By:** [Your Name / Team Names]
* **Guided By:** [Professor/Guide Name]

### Slide 2: Problem Statement
* **The Issue:** Traditional budget apps rely on manual data entry and offer static, historic views of spending. 
* **The Gap:** Users struggle to identify *hidden patterns*, seasonal fluctuations (e.g., summer electricity spikes), and recurring anomalous subscriptions.
* **The Pain Point:** Lack of *actionable, predictive, and explainable* financial insights.

### Slide 3: Motivation & Objectives
* **Motivation:** Personal finance management should be proactive, not reactive.
* **Objectives:**
  1. Automate transaction ingestion and categorization.
  2. Implement Machine Learning for anomaly detection in spending.
  3. Forecast upcoming monthly budgets using historical data.
  4. Provide *Explainable* insights (XAI) to build user trust.

### Slide 4: Existing Solutions vs. Proposed System
* **Existing Apps (Mint, YNAB, Splitwise):** 
  - Rigid rule-based categorization.
  - No anomaly detection (often miss silent recurring fees).
  - High friction / paywalled features.
* **FINMATE (Proposed System):**
  - Hybrid ML + Rule-Based system.
  - Uses Isolation Forests for statistical anomaly detection.
  - Predicts user-specific seasonal baselines.
  - fully open, decoupled architecture.

### Slide 5: System Architecture
* *(Insert System Architecture Diagram from architecture_and_diagrams.md)*
* **Key Components:**
  - React/Vite Frontend (Client)
  - FastAPI Python Backend (Server)
  - CSV Data Processor
  - Scikit-Learn/Statsmodels ML Pipeline

### Slide 6: Technology Stack
* **Frontend:** React.js, Tailwind CSS, Recharts, Vite (for performance).
* **Backend:** Python, FastAPI (for high-throughput async processing), Pandas (Data wrangling).
* **Machine Learning:** Scikit-Learn (Isolation Forest), Statsmodels (ARIMA/Linear Trends).
* **Data Storage:** Structured CSV flat-files (Phase 1) designed for PostgreSQL migration (Phase 2).

### Slide 7: Key Features & ML Algorithms
1. **Intelligent Categorization:** TF-IDF + Heuristics mapping (Fallback to ML).
2. **Anomaly Detection:** Utilizes *Isolation Forests* to flag outliers based on historical spending distances.
3. **Seasonal Modeling:** Uses *ARIMA / Linear Regression* to predict budget variations (e.g., identifying localized summer utility spikes).
4. **Explainability Logic:** Deterministic translation of mathematical deviations into English text.

### Slide 8: Data Flow & Processing Pipeline
* *(Insert Sequence Flow Diagram)*
* Briefly walk through: Upload CSV ➔ Clean Data ➔ Extract Features ➔ Predict ➔ JSON Response ➔ UI Render.

### Slide 9: Results & Evaluation
* **Categorization accuracy:** Discuss how the hybrid approach handles ambiguous bank statements.
* **Performance:** High speed of FastAPI (millisecond response times).
* **UI/UX:** Showcase screenshots of the Dark Professional Interface (Dashboard Cards, Anomaly Alerts Panel).

### Slide 10: Demo Flow
* *(Video or Live Demo)*
1. Upload a messy Bank CSV.
2. System auto-parses, handles errors.
3. Dashboard populates with categorized data.
4. "Insights Panel" explains immediately *why* an anomaly was flagged (e.g., "Dining exceeded 3-month average").

### Slide 11: Challenges Faced & Solutions
* **Challenge:** Handling dirty bank CSVs (multiple formats, weird date strings, currency symbols).
  - **Solution:** Wrote robust Python Pandas pre-processors with Regex sanitization.
* **Challenge:** ML models overfitting on small personal finance datasets.
  - **Solution:** Avoided Deep Learning; opted for statistical approaches (Isolation Forest, ARIMA) better suited for small data.
* **Challenge:** Presenting complex AI data meaningfully.
  - **Solution:** Developed an explainability layer to translate stats into natural language.

### Slide 12: Future Scope
* **Phase 2 Migration:** Upgrade flat CSV storage to PostgreSQL relational database using SQLAlchemy.
* **Cloud Sync:** Plaid API integration for live bank syncing.
* **Mobile App:** Converting React dashboard to React Native for iOS/Android.

### Slide 13: Conclusion
* FINMATE successfully bridging the gap between static budget trackers and advanced AI.
* Demonstrates a robust, decoupled, and scalable software architecture utilizing practical and defensible Machine Learning techniques.

### Slide 14: Questions & Answers
* "Thank You."
* Prepare for questions regarding algorithm choice, data privacy, and time-series logic.
