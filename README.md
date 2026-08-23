# MoneyTrail - AI Finance Controller

MoneyTrail is a finance reconciliation and investigation system built to identify differences between payment transactions, settlement records, and ledger records.

The system works with a batch of 100 synthetic financial transactions. It checks each transaction, identifies whether it can be reconciled, classifies exceptions when there is a discrepancy, and provides an investigation result with supporting financial information and a suggested resolution.

## What it does

- Reconciles payment, settlement, and ledger records
- Detects financial exceptions and classifies them
- Investigates individual transactions
- Shows the financial values behind an exception
- Provides a confidence level for the investigation
- Suggests a resolution for unresolved discrepancies
- Provides a dashboard for reconciliation and exception status
- Provides a transaction ledger containing all 100 records
- Provides an exception management page
- Uses a production backend API for the application

## How it works

```text
100 Financial Transactions
          |
          v
  Reconciliation Engine
          |
      +---+---+
      |       |
      v       v
 Reconciled Exceptions
              |
              v
    Investigation Engine
              |
       +------+------+
       |             |
       v             v
    Evidence     Resolution
       |             |
       +------+------+
              |
              v
        Production API
              |
      +-------+--------+
      |       |        |
      v       v        v
 Transactions Dashboard Exceptions
      |
      v
Transaction Details
+ AI Investigation

The reconciliation engine first compares the transaction, settlement, and ledger values.

When the values do not match, the transaction is classified into an exception category. The investigation engine then looks at the available financial information for that transaction and explains the likely reason for the discrepancy.

The same backend transaction data and reconciliation logic are used by the application.

Evaluation

The reconciliation engine was evaluated against all 100 transactions using an offline evaluation script.

Metric	Result
Total records	100
Correct classifications	92
Incorrect classifications	8
Classification accuracy	92.00%
Dataset distribution

The 100 records contain the following ground-truth categories:

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

The evaluation is run across the complete dataset rather than selected successful transactions.

The system currently classifies 92 out of 100 records correctly.

The remaining 8 classification errors are kept in the evaluation output so that the measured result is not presented as a perfect system.

Exception types

MoneyTrail currently handles the following exception categories:

Settlement Shortfall
Settlement Overpayment
Missing Settlement
Refund Settlement Mismatch
Duplicate Capture
Fee Mismatch
Ledger Mismatch
Unresolvable
Transaction investigation

Each transaction can be investigated independently.

The investigation uses financial information such as:

Gross amount
Processing fee
Tax withheld
Refund amount
Expected settlement
Received settlement
Ledger amount
Settlement variance
Ledger variance

The result contains:

Detected issue
Confidence level
Supporting financial evidence
Suggested resolution

For example, a settlement shortfall may be reported as:

Settlement Shortfall
Confidence: 94%

Expected Net:  ₹1,346.30
Received Net:  ₹1,125.81
Variance:      ₹220.49

Recommendation:
Review the gateway settlement file and verify
additional fees, adjustments or deductions.

The investigation is performed using the selected transaction's actual data rather than a fixed example.

Application

The application has five main areas:

Dashboard

Shows the reconciliation status for the transaction batch, including:

Total transactions
Reconciled transactions
Open exceptions
Amount at risk
Exception category distribution
Recent exceptions
Transactions

Shows the complete transaction ledger.

Transaction Details

Shows the payment, settlement, fee, refund, and reconciliation information for an individual transaction.

Exceptions

Shows detected discrepancies and their:

Transaction ID
Exception type
Amount difference
Severity
Status
Owner
Date
AI Investigation

Provides transaction-level investigation results, supporting evidence, confidence, and a suggested resolution.

Data consistency

The application uses the production backend as the source of transaction and reconciliation data.

The Transactions, Dashboard, Exceptions, Transaction Detail, and AI Investigation views are designed to work from the same underlying transaction dataset and reconciliation results.

There is no separate set of manually entered transaction records for the application.

Tech Stack
Area	Technology
Frontend	React
Backend	Node.js, Express.js
Data	CSV, synthetic financial dataset
API	REST
Deployment	Render
Version Control	Git, GitHub
Project structure
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
Production backend

The backend is deployed on Render:

https://moneytrail-ai-agent-for-financial.onrender.com

The production API provides the transaction data and reconciliation/investigation results used by the application.

The backend is hosted on a free Render instance, so the first request after a period of inactivity may take some time while the service starts.

Running locally

Clone the repository:

git clone https://github.com/RushikaAnumula/MoneyTrail-AI-Agent-for-Financial-Investigation-Reconciliation.git
cd MoneyTrail

Install the backend dependencies:

cd backend
npm install

Start the backend:

node server.js

To run the evaluation from the project root:

cd ..
python scripts/evaluate.py

The evaluation script tests all 100 transactions and reports the classification accuracy and classification errors.

Current result

MoneyTrail currently achieves:

92.00% classification accuracy across 100 synthetic financial transactions.

The system reports the remaining classification errors instead of hiding them.

The goal is not to show a single successful reconciliation, but to measure how the reconciliation engine performs across the complete transaction batch.

Track alignment

MoneyTrail is built for the AI Finance Controller track.

The project closes one finance-operations loop across a batch of synthetic financial data:

Transactions
     |
     v
Reconciliation
     |
     v
Exception Detection
     |
     v
Investigation
     |
     v
Resolution Recommendation

The project reports:

Batch-level reconciliation results
Measured classification accuracy
Exception categories
Unresolved and unresolvable cases
Transaction-level investigation
Supporting financial evidence
Recommended resolutions

The evaluation is performed across all 100 records rather than relying on a cherry-picked successful example.


### And yes — this fits the challenge very well

Let's compare it directly with their **"the bar"**:

| Challenge requirement | MoneyTrail |
|---|---|
| 50+ synthetic records | **100 records** ✅ |
| One finance-ops loop | **Reconciliation → exception → investigation → resolution** ✅ |
| Throughput | **Evaluated across all 100 records** ✅ |
| Measured accuracy | **92%** ✅ |
| Honest exception list | **8 incorrect classifications + 3 unresolvable ground-truth cases** ✅ |
| No cherry-picking | **Full 100-record evaluation** ✅ |
| Multi-source reconciliation | **Payment + settlement + ledger** ✅ |

So **don't try to make it sound more "AI" than it is**. That's actually worse for this project.

Your strongest pitch is:

> **"We built a reconciliation system that processes 100 transactions, measures its classification accuracy, and explicitly reports the cases it cannot resolve."**

That's exactly what their brief is asking for.

One important thing though: **don't claim that the system is 92% accurate at "AI investigation"**. Your `evaluate.py` measures **classification accuracy**, so call it *classification accuracy*. That's technically honest and much stronger in front of judges.

And I would **keep the 100-record distribution in the README**. It demonstrates that this isn't a demo with 5 hand-picked tran
