# MoneyTrail - AI Finance Controller

MoneyTrail is a finance reconciliation system that helps identify differences between payment transactions, settlement records, and ledger records.

It works with a dataset of 100 synthetic financial transactions. For each transaction, the system checks whether the amounts match, identifies exceptions when they do not, and provides an investigation result with supporting financial information and a suggested resolution.

## Features

- Reconciles payment, settlement, and ledger records
- Detects different types of financial exceptions
- Investigates individual transactions
- Shows the financial values used to identify an exception
- Provides a confidence level and suggested resolution
- Dashboard for reconciliation and exception overview
- Transaction ledger with 100 records
- Exception management page
- Production backend API

## How It Works

```text
100 Transactions
       |
       v
Reconciliation Engine
       |
   +---+---+
   |       |
   v       v
Matched  Exceptions
             |
             v
     Investigation Engine
             |
      +------+------+
      |             |
      v             v
   Evidence      Resolution
      |             |
      +------+------+
             |
             v
        Application

The reconciliation engine first compares the transaction, settlement, and ledger values.

If a transaction does not match, it is classified into an exception category. The investigation engine then uses the financial information available for that transaction to explain the difference.

Evaluation

The reconciliation engine was tested against all 100 transactions using the offline evaluation script.

Metric	Result
Total records	100
Correct classifications	92
Incorrect classifications	8
Accuracy	92%
Dataset Distribution
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

The evaluation reports the incorrect classifications as well instead of hiding them.

The 8 incorrect classifications are:

Transaction	Actual	Predicted
TXN-10007	Settlement Overpayment	Fee Mismatch
TXN-10029	Unresolvable	Fee Mismatch
TXN-10034	Unresolvable	Settlement Shortfall
TXN-10037	Settlement Shortfall	Fee Mismatch
TXN-10049	Settlement Overpayment	Fee Mismatch
TXN-10064	Settlement Shortfall	Fee Mismatch
TXN-10068	Settlement Shortfall	Fee Mismatch
TXN-10087	Unresolvable	Settlement Shortfall
Exception Types

The system currently handles:

Settlement Shortfall
Settlement Overpayment
Missing Settlement
Refund Settlement Mismatch
Duplicate Capture
Fee Mismatch
Ledger Mismatch
Unresolvable
Transaction Investigation

Each transaction can be investigated separately.

The investigation uses values such as:

Gross amount
Processing fee
Tax withheld
Refund amount
Expected settlement
Received settlement
Ledger amount
Settlement variance
Ledger variance

The result includes the detected issue, confidence level, supporting values, and a suggested resolution.

For example:

Settlement Shortfall
Confidence: 94%

Expected Net:  ₹1,346.30
Received Net:  ₹1,125.81
Variance:      ₹220.49

Recommendation:
Review the gateway settlement file and verify
additional fees, adjustments or deductions.
Application

The application currently has the following main sections:

Dashboard
Transactions
Transaction Details
Exceptions
AI Investigation

The frontend uses the production backend API instead of keeping a separate set of mock transaction data.

Tech Stack

Frontend

React

Backend

Node.js
Express.js

Data

CSV
Synthetic financial transaction dataset

Deployment

Render

Tools

Git
GitHub
Project Structure
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
Production Backend

The backend is deployed on Render:

https://moneytrail-ai-agent-for-financial.onrender.com

The production API provides the transaction data and reconciliation/investigation results used by the application.

Since it is running on a free Render instance, the first request after a period of inactivity may take some time.

Running Locally

Clone the repository:

git clone https://github.com/RushikaAnumula/MoneyTrail-AI-Agent-for-Financial-Investigation-Reconciliation.git
cd MoneyTrail

Install the backend dependencies:

cd backend
npm install

Start the backend:

node server.js

To run the evaluation:

cd ..
python scripts/evaluate.py

The evaluation script tests all 100 transactions and reports the classification accuracy.

Current Result

MoneyTrail currently achieves 92% classification accuracy on 100 synthetic financial transactions.
