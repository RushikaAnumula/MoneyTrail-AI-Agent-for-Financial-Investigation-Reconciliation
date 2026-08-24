import csvRaw from "@/data/transactions.csv?raw";

export type PaymentStatus = "captured" | "authorized" | "failed" | "refunded";
export type SettlementStatus = "settled" | "pending" | "partial" | "unsettled";
export type ReconStatus = "reconciled" | "exception" | "in_review";
export type Severity = "critical" | "high" | "medium" | "low";
export type ExceptionStatus = "open" | "investigating" | "resolved";

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  method: string;
  currency: string;
  amount: number;
  fee: number;
  tax: number;
  expectedNet: number;
  netSettled: number;
  ledgerAmount: number;
  refunded: number;
  payment: PaymentStatus;
  settlement: SettlementStatus;
  recon: ReconStatus;
  gateway: string;
  acquirerRef: string;
  settlementBatch: string;
  settlementDate: string | null;
  timeline: { at: string; label: string; detail: string }[];
}

export interface FinException {
  id: string;
  txnId: string;
  type: string;
  difference: number;
  currency: string;
  severity: Severity;
  status: ExceptionStatus;
  date: string;
  owner: string;
}

/* ---------- CSV parsing ---------- */

type Raw = Record<string, string>;

function parseCsv(text: string): Raw[] {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  const header = lines[0]!.split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const row: Raw = {};
    header.forEach((h, i) => {
      row[h] = (cells[i] ?? "").trim();
    });
    return row;
  });
}

/** "28-08-2026 06:00" -> ISO UTC string. Also accepts "28-08-2026". */
function toIso(value: string): string {
  const [datePart, timePart] = value.split(" ");
  const [dd, mm, yyyy] = (datePart ?? "").split("-");
  const time = timePart && timePart.length >= 4 ? timePart : "00:00";
  return `${yyyy}-${mm}-${dd}T${time}:00Z`;
}

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const round = (n: number) => Math.round(n * 100) / 100;

function paymentStatus(raw: string, refunded: number): PaymentStatus {
  if (refunded > 0) return "refunded";
  if (raw.includes("failed")) return "failed";
  if (raw.includes("authorized")) return "authorized";
  return "captured";
}

function settlementStatus(raw: string, expected: number, received: number): SettlementStatus {
  if (!raw || raw === "missing") return "unsettled";
  if (raw === "pending") return "pending";
  if (received <= 0) return "unsettled";
  if (received + 0.01 < expected) return "partial";
  return "settled";
}

const owners = ["A. Mehta", "J. Okafor", "L. Bergström", "R. Tanaka", "Unassigned"];

const rows = parseCsv(csvRaw);

export const transactions: Transaction[] = rows.map((r) => {
  const amount = num(r["gross_amount"] ?? "");
  const fee = num(r["processing_fee"] ?? "");
  const tax = num(r["tax_withheld"] ?? "");
  const refunded = num(r["refund_amount"] ?? "");
  const expectedNet = num(r["expected_net"] ?? "");
  const receivedNet = num(r["received_net"] ?? "");
  const ledgerAmount = num(r["ledger_amount"] ?? "");
  const settlement = settlementStatus(r["settlement_status"] ?? "", expectedNet, receivedNet);
  const date = toIso(r["created_at"] ?? "");
  const settlementDate = r["settlement_date"] ? toIso(r["settlement_date"] ?? "").slice(0, 10) : null;
  const batch = r["settlement_id"] || "—";
  const gateway = r["gateway"] ?? "";
  const method = r["payment_method"] ?? "";
  const currency = r["currency"] || "INR";
  const settlementVariance = round(expectedNet - receivedNet);
  const ledgerVariance = round(ledgerAmount - expectedNet);
  const matched = Math.abs(settlementVariance) < 0.01 && Math.abs(ledgerVariance) < 0.01;
  const recon: ReconStatus = matched ? "reconciled" : settlement === "unsettled" ? "exception" : "in_review";

  return {
    id: r["transaction_id"] ?? "",
    date,
    merchant: r["merchant"] ?? "",
    method,
    currency,
    amount,
    fee,
    tax,
    expectedNet,
    netSettled: receivedNet,
    ledgerAmount,
    refunded,
    payment: paymentStatus(r["payment_status"] ?? "", refunded),
    settlement,
    recon,
    gateway,
    acquirerRef: batch,
    settlementBatch: batch,
    settlementDate,
    timeline: [
      { at: date, label: "Payment authorized", detail: `${gateway} authorization approved for ${method}` },
      { at: date, label: "Payment captured", detail: `Captured ${amount.toFixed(2)} ${currency} via ${method}` },
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

/* ---------- Derived exceptions ---------- */

function severityFor(diff: number, gross: number): Severity {
  const ratio = gross > 0 ? Math.abs(diff) / gross : 0;
  if (ratio >= 0.5) return "critical";
  if (ratio >= 0.1) return "high";
  if (ratio >= 0.02) return "medium";
  return "low";
}

function statusFor(severity: Severity): ExceptionStatus {
  if (severity === "critical" || severity === "high") return "open";
  if (severity === "medium") return "investigating";
  return "resolved";
}

const derived: Omit<FinException, "id" | "owner">[] = [];

for (const t of transactions) {
  const settlementVariance = round(t.expectedNet - t.netSettled);
  const ledgerVariance = round(t.ledgerAmount - t.expectedNet);

  if (t.settlement === "unsettled") {
    const severity = severityFor(t.expectedNet, t.amount);
    derived.push({
      txnId: t.id,
      type: "Missing Settlement",
      difference: t.expectedNet,
      currency: t.currency,
      severity,
      status: statusFor(severity),
      date: t.date,
    });
  } else if (Math.abs(settlementVariance) >= 0.01) {
    const overpaid = settlementVariance < 0;
    const severity = severityFor(settlementVariance, t.amount);
    derived.push({
      txnId: t.id,
      type: overpaid ? "Settlement Overpayment" : "Settlement Shortfall",
      difference: Math.abs(settlementVariance),
      currency: t.currency,
      severity,
      status: statusFor(severity),
      date: t.date,
    });
  }

  if (Math.abs(ledgerVariance) >= 0.01) {
    const severity = severityFor(ledgerVariance, t.amount);
    derived.push({
      txnId: t.id,
      type: "Ledger Mismatch",
      difference: Math.abs(ledgerVariance),
      currency: t.currency,
      severity,
      status: statusFor(severity),
      date: t.date,
    });
  }
}

export const exceptions: FinException[] = derived.map((e, i) => ({
  ...e,
  id: `EXC-${String(4100 + i)}`,
  owner: owners[i % owners.length]!,
}));

export const metrics = {
  totalTransactions: transactions.length,
  reconciled: transactions.filter((t) => t.recon === "reconciled").length,
  openExceptions: exceptions.filter((e) => e.status !== "resolved").length,
  amountAtRisk: round(exceptions.filter((e) => e.status !== "resolved").reduce((s, e) => s + e.difference, 0)),
};

export const exceptionsByCategory = Array.from(new Set(exceptions.map((e) => e.type)))
  .map((type) => ({ type, count: exceptions.filter((e) => e.type === type).length }))
  .sort((a, b) => b.count - a.count);

export const baseCurrency = transactions[0]?.currency ?? "INR";

export function getTransaction(id: string) {
  return transactions.find((t) => t.id === id);
}

export function formatMoney(value: number, currency = baseCurrency) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}
