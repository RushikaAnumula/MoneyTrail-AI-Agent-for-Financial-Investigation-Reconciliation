# MoneyTrail - AI Finance Controller

MoneyTrail is a finance reconciliation system that compares payment, settlement, and ledger records to identify financial discrepancies.

It processes 100 synthetic transactions, classifies reconciliation exceptions, and investigates individual transactions with supporting evidence and recommended resolutions.

## Features

- Reconciles payment, settlement, and ledger records
- Detects and classifies financial exceptions
- Investigates individual transactions
- Provides supporting financial evidence and recommended resolutions
- Dashboard for reconciliation and exception overview
- Transaction ledger and exception management
- Production REST API

## How It Works

```text
100 Transactions
       |
       v
Reconciliation
       |
   +---+---+
   |       |
   v       v
Matched  Exceptions
             |
             v
       Investigation
             |
      +------+------+
      |             |
   Evidence      Resolution

The reconciliation engine compares the financial records for each transaction. Exceptions are classified based on the differences found.

The investigation engine then analyzes the transaction's financial values and provides a likely cause, supporting evidence, confidence, and a suggested resolution.

Evaluation

The system was evaluated against all 100 transactions using an offline evaluation script.

Metric	Result
Total records	100
Correct classifications	92
Incorrect classifications	8
Accuracy	92.00%
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

The evaluation covers the complete dataset rather than selected successful examples. Classification errors are also reported by the evaluation script.

Exception Types
Settlement Shortfall
Settlement Overpayment
Missing Settlement
Refund Settlement Mismatch
Duplicate Capture
Fee Mismatch
Ledger Mismatch
Unresolvable
Transaction Investigation

Each transaction can be investigated using its actual financial data.

The investigation considers:

Gross amount
Processing fee
Tax withheld
Refund amount
Expected settlement
Received settlement
Ledger amount
Settlement variance
Ledger variance

The result includes the detected issue, confidence, supporting evidence, and recommended resolution.

Application

MoneyTrail includes:

Dashboard
Transaction Ledger
Transaction Details
Exceptions
AI Investigation

These views use the production backend as the source of transaction and reconciliation data.

Tech Stack
Component	Technology
Frontend	React
Backend	Node.js, Express.js
Data	Synthetic CSV dataset
API	REST
Deployment	Render
Project Structure
MoneyTrail/
├── backend/
│   ├── data/
│   │   ├── transactions.csv
│   │   └── transactions_100.csv
│   ├── investigator.js
│   ├── reconciliation.js
│   ├── routes/
│   │   └── transactions.js
│   ├── server.js
│   └── package.json
│
├── scripts/
│   ├── generate_dataset.py
│   ├── evaluate.py
│   └── transactions_100.csv
│
└── README.md
Production API

https://moneytrail-ai-agent-for-financial.onrender.com

The frontend uses the deployed backend for transaction, reconciliation, and investigation data.

Run Locally
git clone https://github.com/RushikaAnumula/MoneyTrail-AI-Agent-for-Financial-Investigation-Reconciliation.git
cd MoneyTrail

cd backend
npm install
node server.js

Run the evaluation:

cd ..
python scripts/evaluate.py
Result

92% classification accuracy across 100 synthetic financial transactions.

The remaining classification errors are reported rather than hidden.

MoneyTrail is designed to measure reconciliation performance across an entire transaction batch rather than relying on a single successful example.
