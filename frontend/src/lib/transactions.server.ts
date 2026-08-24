import type { Transaction } from "@/lib/mock-data";

export interface BackendTransaction {
  transaction_id: string;
  merchant: string;
  gateway: string;
  created_at: string;
  currency: string;
  payment_method: string;
  payment_status: string;
  gross_amount: string | number;
  processing_fee: string | number;
  tax_withheld: string | number;
  refund_amount: string | number;
  settlement_id: string;
  settlement_status: string;
  expected_net: string | number;
  received_net: string | number;
  settlement_date: string;
  ledger_amount: string | number;
}

function toIso(value: string): string {
  const [datePart, timePart] = value.split(" ");
  const [dd, mm, yyyy] = (datePart ?? "").split("-");
  const time = timePart && timePart.length >= 4 ? timePart : "00:00";
  return `${yyyy}-${mm}-${dd}T${time}:00Z`;
}

function num(value: string | number): number {
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}

function paymentStatus(raw: string, refunded: number): Transaction["payment"] {
  if (refunded > 0) return "refunded";
  if (raw.includes("failed")) return "failed";
  if (raw.includes("authorized")) return "authorized";
  return "captured";
}

function settlementStatus(raw: string, expected: number, received: number): Transaction["settlement"] {
  if (!raw || raw === "missing") return "unsettled";
  if (raw === "pending") return "pending";
  if (received <= 0) return "unsettled";
  if (received + 0.01 < expected) return "partial";
  return "settled";
}

export async function fetchTransactionsFromBackend(): Promise<Transaction[]> {
  const res = await fetch("https://moneytrail-ai-agent-for-financial.onrender.com/api/transactions");
  if (!res.ok) {
    throw new Error(`Failed to fetch transactions: ${res.status} ${res.statusText}`);
  }

  const payload = (await res.json()) as BackendTransaction[] | { transactions?: BackendTransaction[] };
  const rows: BackendTransaction[] = Array.isArray(payload) ? payload : (payload.transactions ?? []);

  return rows.map((r) => {
    const amount = num(r.gross_amount);
    const fee = num(r.processing_fee);
    const tax = num(r.tax_withheld);
    const refunded = num(r.refund_amount);
    const expectedNet = num(r.expected_net);
    const receivedNet = num(r.received_net);
    const ledgerAmount = num(r.ledger_amount);
    const settlement = settlementStatus(r.settlement_status, expectedNet, receivedNet);
    const date = toIso(r.created_at);
    const settlementDate = r.settlement_date ? toIso(r.settlement_date).slice(0, 10) : null;
    const batch = r.settlement_id || "—";
    const currency = r.currency || "INR";
    const settlementVariance = round(expectedNet - receivedNet);
    const ledgerVariance = round(ledgerAmount - expectedNet);
    const matched = Math.abs(settlementVariance) < 0.01 && Math.abs(ledgerVariance) < 0.01;
    const recon: Transaction["recon"] = matched ? "reconciled" : settlement === "unsettled" ? "exception" : "in_review";

    return {
      id: r.transaction_id,
      date,
      merchant: r.merchant,
      method: r.payment_method,
      currency,
      amount,
      fee,
      tax,
      expectedNet,
      netSettled: receivedNet,
      ledgerAmount,
      refunded,
      payment: paymentStatus(r.payment_status, refunded),
      settlement,
      recon,
      gateway: r.gateway,
      acquirerRef: batch,
      settlementBatch: batch,
      settlementDate,
      timeline: [
        { at: date, label: "Payment authorized", detail: `${r.gateway} authorization approved for ${r.payment_method}` },
        { at: date, label: "Payment captured", detail: `Captured ${amount.toFixed(2)} ${currency} via ${r.payment_method}` },
        ...(refunded > 0
          ? [{ at: date, label: "Refund issued", detail: `Refund of ${refunded.toFixed(2)} ${currency} processed` }]
          : []),
        settlement === "unsettled"
          ? {
              at: settlementDate ? `${settlementDate}T02:10:00Z` : date,
              label: "Settlement file missing",
              detail: "No settlement record received from the acquirer for this transaction",
            }
          : {
              at: settlementDate ? `${settlementDate}T02:10:00Z` : date,
              label: "Settlement file received",
              detail: `Batch ${batch} ingested · received net ${receivedNet.toFixed(2)} ${currency}`,
            },
        {
          at: settlementDate ? `${settlementDate}T04:35:00Z` : date,
          label: matched ? "Reconciliation matched" : "Reconciliation mismatch detected",
          detail: matched
            ? "Ledger, gateway and bank records agree within tolerance"
            : `Expected net ${expectedNet.toFixed(2)} vs received ${receivedNet.toFixed(2)} ${currency}`,
        },
      ],
    };
  });
}
