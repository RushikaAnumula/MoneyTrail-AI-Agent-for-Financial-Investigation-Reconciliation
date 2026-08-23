import csv
import random
from datetime import datetime, timedelta

random.seed(42)

MERCHANTS = [
    "Northwind Logistics",
    "Brightpath Retail",
    "Kestrel Media Group",
    "Helio Cloud Services",
    "Atlas Foods",
    "Veridian Health",
    "BluePeak Travel",
    "Orion Manufacturing",
    "Silverline Education",
    "Redwood Energy",
    "Maple Finance",
    "Vertex Systems",
]

GATEWAYS = ["Stripe", "Adyen", "Braintree", "Worldpay"]

PAYMENT_METHODS = [
    "Visa",
    "Mastercard",
    "Amex",
    "UPI",
    "ACH",
]

EXCEPTION_TYPES = [
    "Settlement Shortfall",
    "Settlement Overpayment",
    "Missing Settlement",
    "Fee Mismatch",
    "Refund Settlement Mismatch",
    "Ledger Mismatch",
    "Duplicate Capture",
    "Unresolvable",
]


def money(value):
    return round(value, 2)


def create_transaction(index):
    transaction_id = f"TXN-{10000 + index}"

    merchant = random.choice(MERCHANTS)
    gateway = random.choice(GATEWAYS)
    payment_method = random.choice(PAYMENT_METHODS)

    created = datetime(2026, 8, 1) + timedelta(
        days=random.randint(0, 27),
        hours=random.randint(0, 23),
        minutes=random.randint(0, 59)
    )

    gross_amount = money(random.uniform(300, 5000))

    processing_fee = money(gross_amount * random.uniform(0.018, 0.035))
    tax_withheld = money(processing_fee * 0.20)

    refund_amount = 0.0

    expected_net = money(
        gross_amount - processing_fee - tax_withheld
    )

    received_net = expected_net
    ledger_amount = expected_net

    settlement_id = f"SET-{10000 + index}"
    settlement_status = "settled"
    settlement_date = created.strftime("%d-%m-%Y")

    # Decide transaction category.
    # Most records are intentionally clean.
    roll = random.random()

    if roll < 0.55:
        category = "Reconciled"

    elif roll < 0.65:
        category = "Settlement Shortfall"
        received_net = money(
            expected_net - random.uniform(20, 300)
        )

    elif roll < 0.72:
        category = "Settlement Overpayment"
        received_net = money(
            expected_net + random.uniform(20, 250)
        )

    elif roll < 0.78:
        category = "Missing Settlement"
        settlement_id = ""
        settlement_status = "missing"
        received_net = 0.0

    elif roll < 0.84:
        category = "Fee Mismatch"

        # Actual settlement uses an unexpected fee.
        extra_fee = money(random.uniform(10, 100))
        received_net = money(expected_net - extra_fee)

    elif roll < 0.89:
        category = "Refund Settlement Mismatch"

        refund_amount = money(random.uniform(50, 500))

        # Create a mismatch after refund.
        received_net = money(
            expected_net - refund_amount + random.uniform(-100, 100)
        )

    elif roll < 0.94:
        category = "Ledger Mismatch"

        ledger_amount = money(
            expected_net + random.uniform(-250, 250)
        )

    elif roll < 0.97:
        category = "Duplicate Capture"

        # Duplicate capture produces an unexpected
        # additional amount in settlement.
        received_net = money(
            expected_net * 2
        )

    else:
        category = "Unresolvable"

        # Deliberately conflicting records.
        received_net = money(
            expected_net + random.uniform(-300, 300)
        )

        ledger_amount = money(
            expected_net + random.uniform(-300, 300)
        )

    return {
        "transaction_id": transaction_id,
        "merchant": merchant,
        "gateway": gateway,
        "created_at": created.strftime("%d-%m-%Y %H:%M"),
        "currency": "INR",
        "payment_method": payment_method,
        "payment_status": "payment_captured",
        "gross_amount": gross_amount,
        "processing_fee": processing_fee,
        "tax_withheld": tax_withheld,
        "refund_amount": refund_amount,
        "settlement_id": settlement_id,
        "settlement_status": settlement_status,
        "expected_net": expected_net,
        "received_net": received_net,
        "settlement_date": settlement_date,
        "ledger_amount": ledger_amount,

        # This is our ground truth.
        # We will NOT expose this to the AI.
        "ground_truth": category
    }


def main():
    output_file = "transactions_100.csv"

    rows = []

    for i in range(1, 101):
        rows.append(create_transaction(i))

    fieldnames = [
        "transaction_id",
        "merchant",
        "gateway",
        "created_at",
        "currency",
        "payment_method",
        "payment_status",
        "gross_amount",
        "processing_fee",
        "tax_withheld",
        "refund_amount",
        "settlement_id",
        "settlement_status",
        "expected_net",
        "received_net",
        "settlement_date",
        "ledger_amount",
        "ground_truth",
    ]

    with open(output_file, "w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fieldnames)

        writer.writeheader()
        writer.writerows(rows)

    print(f"Generated {len(rows)} transactions.")
    print(f"Saved to: {output_file}")


if __name__ == "__main__":
    main()