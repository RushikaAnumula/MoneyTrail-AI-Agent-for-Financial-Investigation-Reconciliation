import type { ExceptionStatus, FinException, Severity, Transaction } from "@/lib/mock-data";

const round = (n: number) => Math.round(n * 100) / 100;

export function severityFor(diff: number, gross: number): Severity {
  const ratio = gross > 0 ? Math.abs(diff) / gross : 0;
  if (ratio >= 0.5) return "critical";
  if (ratio >= 0.1) return "high";
  if (ratio >= 0.02) return "medium";
  return "low";
}

export function statusFor(severity: Severity): ExceptionStatus {
  if (severity === "critical" || severity === "high") return "open";
  if (severity === "medium") return "investigating";
  return "resolved";
}

/**
 * Derives exceptions from the reconciliation result of each transaction record.
 * Every value comes from the transaction itself — no invented records.
 */
export function deriveExceptions(transactions: Transaction[]): FinException[] {
  const out: FinException[] = [];

  for (const t of transactions) {
    const settlementVariance = round(t.expectedNet - t.netSettled);
    const ledgerVariance = round(t.ledgerAmount - t.expectedNet);

    if (t.settlement === "unsettled") {
      const severity = severityFor(t.expectedNet, t.amount);
      out.push({
        id: `${t.id}-SETTLEMENT`,
        txnId: t.id,
        type: "Missing Settlement",
        difference: round(t.expectedNet),
        currency: t.currency,
        severity,
        status: statusFor(severity),
        date: t.date,
        owner: "Unassigned",
      });
    } else if (Math.abs(settlementVariance) >= 0.01) {
      const overpaid = settlementVariance < 0;
      const severity = severityFor(settlementVariance, t.amount);
      out.push({
        id: `${t.id}-SETTLEMENT`,
        txnId: t.id,
        type: overpaid ? "Settlement Overpayment" : "Settlement Shortfall",
        difference: Math.abs(settlementVariance),
        currency: t.currency,
        severity,
        status: statusFor(severity),
        date: t.date,
        owner: "Unassigned",
      });
    }

    if (Math.abs(ledgerVariance) >= 0.01) {
      const severity = severityFor(ledgerVariance, t.amount);
      out.push({
        id: `${t.id}-LEDGER`,
        txnId: t.id,
        type: "Ledger Mismatch",
        difference: Math.abs(ledgerVariance),
        currency: t.currency,
        severity,
        status: statusFor(severity),
        date: t.date,
        owner: "Unassigned",
      });
    }
  }

  return out;
}

export function computeMetrics(transactions: Transaction[], exceptions: FinException[]) {
  const total = transactions.length;
  const reconciled = transactions.filter((t) => t.recon === "reconciled").length;
  const unresolved = exceptions.filter((e) => e.status !== "resolved");
  return {
    totalTransactions: total,
    reconciled,
    matchRate: total > 0 ? Math.round((reconciled / total) * 100) : 0,
    openExceptions: unresolved.length,
    totalExceptions: exceptions.length,
    amountAtRisk: round(unresolved.reduce((s, e) => s + Math.abs(e.difference), 0)),
  };
}

export function exceptionCategories(exceptions: FinException[]) {
  return Array.from(new Set(exceptions.map((e) => e.type)))
    .map((type) => ({ type, count: exceptions.filter((e) => e.type === type).length }))
    .sort((a, b) => b.count - a.count);
}
