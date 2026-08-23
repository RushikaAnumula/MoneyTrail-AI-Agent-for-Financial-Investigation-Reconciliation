# MoneyTrail — AI Finance Controller

MoneyTrail is an AI-assisted finance operations system that reconciles payment transactions against settlement and ledger records, detects financial exceptions, and investigates unresolved discrepancies.

The system processes a batch of **100 synthetic financial transactions** and provides transaction-level reconciliation, exception classification, investigation evidence, and recommended resolutions.

## 🚀 Key Features

- **Transaction Reconciliation** — Compares transaction, settlement, and ledger values.
- **Exception Detection** — Identifies settlement shortfalls, overpayments, missing settlements, fee mismatches, refund mismatches, duplicate captures, and ledger mismatches.
- **AI Investigation** — Analyzes financial evidence and produces root-cause explanations with confidence levels.
- **Resolution Recommendations** — Suggests practical next steps for unresolved discrepancies.
- **Finance Dashboard** — Provides reconciliation statistics, exception counts, and amount-at-risk.
- **Transaction-Level Investigation** — Each transaction can be investigated independently using its actual financial data.
- **Production API** — Frontend consumes the deployed backend rather than maintaining a separate mock dataset.

---

## 🧠 How It Works

```text
                          100 Financial Transactions
                       │
                       ▼
              Reconciliation Engine
                       │
                ┌──────┴──────┐
                ▼             ▼
            Reconciled     Exceptions
                                │
                                ▼
                     Investigation Engine
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
                Root Cause             Resolution
                 + Evidence            Recommendation
                               
                       │
                       ▼
                  Production API
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    Transactions   Dashboard    Exceptions
          │
          ▼
 Transaction Detail
 + AI Investigation
📊 Evaluation Results

MoneyTrail was evaluated against all 100 synthetic financial transactions using an offline evaluation script.

Metric	Result
Total Records	100
Correct Classifications	92
Incorrect Classifications	8
Measured Accuracy	92.00%
Ground-Truth Distribution
Category	Records
Reconciled	51
Settlement Shortfall	11
Missing Settlement	8
Refund Settlement Mismatch	7
Duplicate Capture	6
Settlement Overpayment	5
Fee Mismatch	5
Ledger Mismatch	4
Unresolvable	3
Total	100

The evaluation intentionally reports classification failures instead of hiding them.

Classification Errors

The 8 incorrect classifications were:

Transaction	Actual	Predicted
TXN-10007	Settlement Overpayment	Fee Mismatch
TXN-10029	Unresolvable	Fee Mismatch
TXN-10034	Unresolvable	Settlement Shortfall
TXN-10037	Settlement Shortfall	Fee Mismatch
TXN-10049	Settlement Overpayment	Fee Mismatch
TXN-10064	Settlement Shortfall	Fee Mismatch
TXN-10068	Settlement Shortfall	Fee Mismatch
TXN-10087	Unresolvable	Settlement Shortfall
🔍 AI Investigation

For an individual transaction, MoneyTrail correlates:

Gross transaction amount
Processing fee
Tax withheld
Refund amount
Expected settlement
Received settlement
Ledger amount
Settlement variance
Ledger variance

The investigation engine produces:

Root-cause classification
Confidence level
Supporting financial evidence
Recommended resolution

Example investigation:

Settlement Shortfall
Confidence: 94%

Expected Net:  ₹1,346.30
Received Net:  ₹1,125.81
Variance:      ₹220.49

Recommendation:
Review the gateway settlement file and verify
additional fees, adjustments or deductions.
🏗️ Architecture
Backend
Node.js
Express.js
REST API
Reconciliation Engine
Rule-based financial reconciliation
Multi-category exception classification
Settlement and ledger variance analysis
Investigation Engine
Transaction-level evidence analysis
Root-cause classification
Confidence scoring
Resolution recommendations
Frontend
Dashboard
Transaction Ledger
Transaction Detail
Exception Management
AI Investigation Interface
🛠️ Tech Stack
Layer	Technology
Frontend	React
Backend	Node.js, Express.js
Data	CSV / Synthetic Financial Dataset
API	REST
Deployment	Render
Version Control	Git, GitHub
📁 Project Structure
MoneyTrail/
│
├── backend/
│   ├── data/
│   │   ├── transactions.csv
│   │   └── transactions_100.csv
│   │
│   ├── investigator.js
│   ├── reconciliation.js
│   │
│   ├── routes/
│   │   └── transactions.js
│   │
│   ├── server.js
│   └── package.json
│
├── scripts/
│   ├── generate_dataset.py
│   ├── evaluate.py
│   └── transactions_100.csv
│
└── README.md
🌐 Production API

The backend is deployed as a production web service:

MoneyTrail API

https://moneytrail-ai-agent-for-financial.onrender.com

The application frontend consumes the production API so that transaction data and reconciliation results are generated from the same backend dataset.

Note: The free Render instance may take some time to wake up after inactivity.

▶️ Run Locally
1. Clone the repository
git clone https://github.com/RushikaAnumula/MoneyTrail-AI-Agent-for-Financial-Investigation-Reconciliation.git

cd MoneyTrail
2. Install dependencies
cd backend
npm install
3. Start the backend
node server.js

The API will run locally on the configured port.

4. Run evaluation

From the project root:

python scripts/evaluate.py

The evaluation script reports classification accuracy across all 100 transactions.

🎯 Exception Types

MoneyTrail currently identifies:

Settlement Shortfall
Settlement Overpayment
Missing Settlement
Refund Settlement Mismatch
Duplicate Capture
Fee Mismatch
Ledger Mismatch
Unresolvable
💡 Key Design Principle

MoneyTrail evaluates the complete transaction batch rather than cherry-picking successful examples.

The same transaction data and reconciliation logic drive the production application, while the offline evaluation uses ground-truth labels to measure classification performance.

This makes the system's performance measurable and transparent.

📌 Current Result

92.00% measured classification accuracy across 100 synthetic financial transactions.

The remaining classification errors are explicitly reported for further improvement rather than being hidden.
