export interface InvestigationResult {
  transactionId: string;
  status: string;
  exceptionType: string;
  severity: string;
  rootCause: string;
  expectedNet: number;
  receivedNet: number;
  variance: number;
  ledgerAmount: number;
  ledgerVariance: number;
  evidence: { label: string; value: string }[];
  recommendedAction: string;
  confidence: string | null;
}

function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : (value as number);
  return Number.isFinite(n) ? n : 0;
}

interface BackendInvestigation {
  reconciliation?: Record<string, unknown>;
  investigation?: Record<string, unknown>;
}

export async function investigateTransaction(transactionId: string): Promise<InvestigationResult> {
  const res = await fetch(
    `https://moneytrail-ai-agent-for-financial.onrender.com/api/transactions/${encodeURIComponent(
      transactionId,
    )}/investigate`,
  );
  if (res.status === 404) {
    throw new Error(`Transaction ${transactionId} was not found in the dataset.`);
  }
  if (!res.ok) {
    throw new Error(`Investigation failed: ${res.status} ${res.statusText}`);
  }

  const payload = (await res.json()) as BackendInvestigation;
  const rec = payload.reconciliation ?? {};
  const inv = payload.investigation ?? {};
  const ev = (inv["evidence"] ?? {}) as Record<string, unknown>;

  const expectedNet = num(rec["expected_net"] ?? ev["expected_net"]);
  const receivedNet = num(rec["received_net"] ?? ev["received_net"]);
  const ledgerAmount = num(rec["ledger_amount"] ?? ev["ledger_amount"]);
  const variance = num(rec["settlement_variance"] ?? ev["variance"]);
  const ledgerVariance = num(rec["ledger_variance"]);
  const status = String(rec["status"] ?? "UNKNOWN");
  const reconciled = status.toUpperCase() === "RECONCILED" || status.toUpperCase() === "MATCHED";

  const rootCause =
    [inv["finding"], inv["likely_cause"]].filter(Boolean).join(" ") ||
    String(rec["reason"] ?? "") ||
    (reconciled
      ? "No discrepancy found. Gateway, settlement and ledger records agree within tolerance."
      : "No root-cause summary returned by the investigation service.");

  const evidence: { label: string; value: string }[] = [
    { label: "Gross amount", value: String(num(rec["gross_amount"]).toFixed(2)) },
    { label: "Processing fee", value: String(num(rec["processing_fee"]).toFixed(2)) },
    { label: "Tax withheld", value: String(num(rec["tax_withheld"]).toFixed(2)) },
    { label: "Refund amount", value: String(num(rec["refund_amount"]).toFixed(2)) },
    { label: "Expected net", value: expectedNet.toFixed(2) },
    { label: "Received net", value: receivedNet.toFixed(2) },
    { label: "Ledger amount", value: ledgerAmount.toFixed(2) },
    { label: "Settlement variance", value: variance.toFixed(2) },
    { label: "Ledger variance", value: ledgerVariance.toFixed(2) },
  ];

  return {
    transactionId: String(rec["transaction_id"] ?? inv["transaction_id"] ?? transactionId),
    status,
    exceptionType: String(rec["exception_type"] ?? (reconciled ? "None" : "Unclassified")),
    severity: String(rec["severity"] ?? (reconciled ? "None" : "Unknown")),
    rootCause,
    expectedNet,
    receivedNet,
    variance,
    ledgerAmount,
    ledgerVariance,
    evidence,
    recommendedAction: String(
      inv["recommended_action"] ??
        (reconciled ? "No action required — transaction is fully reconciled." : "No recommendation returned."),
    ),
    confidence: inv["confidence"] ? String(inv["confidence"]) : null,
  };
}
