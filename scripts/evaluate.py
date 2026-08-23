import csv
import requests
from collections import Counter

CSV_FILE = "transactions_100.csv"
API_URL = "http://localhost:5000/api/transactions/reconcile"


# Load hidden ground truth
with open(CSV_FILE, newline="", encoding="utf-8") as file:
    rows = list(csv.DictReader(file))


ground_truth = {
    row["transaction_id"]: row["ground_truth"]
    for row in rows
}


# Get MoneyTrail's predictions
response = requests.get(API_URL)
data = response.json()

results = data["results"]


correct = 0
total = len(results)

predicted_categories = Counter()
actual_categories = Counter()

errors = []


CATEGORY_MAP = {
    "Reconciled": "RECONCILED",
    "Settlement Shortfall": "Settlement Shortfall",
    "Settlement Overpayment": "Settlement Overpayment",
    "Missing Settlement": "Missing Settlement",
    "Refund Settlement Mismatch": "Refund Settlement Mismatch",
    "Ledger Mismatch": "Ledger Mismatch",
    "Fee Mismatch": "Fee Mismatch",
    "Duplicate Capture": "Duplicate Capture",
    "Unresolvable": "Unresolvable",
}


for result in results:

    transaction_id = result["transaction_id"]

    actual = ground_truth[transaction_id]

    predicted = result["exception_type"]

    if predicted is None:
        predicted = "RECONCILED"

    predicted_categories[predicted] += 1
    actual_categories[actual] += 1

    if predicted == CATEGORY_MAP[actual]:
        correct += 1
    else:
        errors.append({
            "transaction_id": transaction_id,
            "actual": actual,
            "predicted": predicted
        })


accuracy = (correct / total) * 100


print("\n==============================")
print(" MONEYTRAIL EVALUATION")
print("==============================")

print(f"\nTotal records: {total}")
print(f"Correct classifications: {correct}")
print(f"Incorrect classifications: {total - correct}")
print(f"Measured accuracy: {accuracy:.2f}%")

print("\nActual distribution:")
for category, count in actual_categories.items():
    print(f"  {category}: {count}")

print("\nPredicted distribution:")
for category, count in predicted_categories.items():
    print(f"  {category}: {count}")

print("\nClassification errors:")

for error in errors:
    print(
        f"  {error['transaction_id']} | "
        f"Actual: {error['actual']} | "
        f"Predicted: {error['predicted']}"
    )