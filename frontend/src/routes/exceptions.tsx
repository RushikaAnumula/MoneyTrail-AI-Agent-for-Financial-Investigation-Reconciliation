import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatMoney } from "@/lib/mock-data";
import { getTransactions } from "@/lib/transactions.functions";
import { deriveExceptions } from "@/lib/reconciliation";

export const Route = createFileRoute("/exceptions")({
  loader: () => getTransactions(),
  pendingComponent: () => (
    <AppShell title="Exceptions" description="Loading exception queue…">
      <div className="panel flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading exceptions…</p>
        </div>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Exceptions" description="Unable to load the exception queue">
      <div className="panel flex h-96 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-destructive">Could not reach the backend API</p>
        <p className="max-w-md text-xs text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Could not load exceptions from the MoneyTrail production API. Please try again."}
        </p>
      </div>
    </AppShell>
  ),
  head: () => ({
    meta: [
      { title: "Financial Exceptions Queue | MoneyTrail" },
      {
        name: "description",
        content:
          "Triage settlement shortfalls, fee mismatches and duplicate captures by severity, owner and amount difference.",
      },
      { property: "og:title", content: "Financial Exceptions Queue | MoneyTrail" },
      {
        property: "og:description",
        content: "Triage reconciliation discrepancies by severity, status and amount difference.",
      },
    ],
  }),
  component: ExceptionsPage,
});

const severities = ["all", "critical", "high", "medium", "low"] as const;

function ExceptionsPage() {
  const transactions = Route.useLoaderData();
  const exceptions = useMemo(() => deriveExceptions(transactions), [transactions]);
  const [severity, setSeverity] = useState<(typeof severities)[number]>("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(
    () =>
      exceptions.filter((e) => {
        const q = query.trim().toLowerCase();
        return (
          (severity === "all" || e.severity === severity) &&
          (!q || e.txnId.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
        );
      }),
    [severity, query, exceptions],
  );

  const totals = {
    open: exceptions.filter((e) => e.status === "open").length,
    investigating: exceptions.filter((e) => e.status === "investigating").length,
    resolved: exceptions.filter((e) => e.status === "resolved").length,
    variance: exceptions.reduce((s, e) => s + Math.abs(e.difference), 0),
  };

  return (
    <AppShell
      title="Exceptions"
      description="Discrepancies detected between ledger, gateway and bank settlement records"
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Open", value: totals.open.toString(), hint: "Not yet triaged" },
          { label: "Investigating", value: totals.investigating.toString(), hint: "Assigned to an analyst" },
          { label: "Resolved", value: totals.resolved.toString(), hint: "Closed this period" },
          { label: "Total variance", value: formatMoney(totals.variance), hint: "Across all exceptions" },
        ].map((s) => (
          <div key={s.label} className="panel p-5">
            <p className="label-caps">{s.label}</p>
            <p className="num mt-3 text-2xl font-semibold">{s.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="panel mt-6">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exception or transaction ID"
              className="h-9 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            {severities.map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`rounded px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                  severity === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/60 text-left">
                {["Exception", "Transaction ID", "Type", "Amount difference", "Severity", "Status", "Owner", "Date"].map(
                  (h) => (
                    <th key={h} className="label-caps px-4 py-3 font-semibold">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-accent/40">
                  <td className="num px-4 py-3 font-medium">{e.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to="/transactions/$transactionId"
                      params={{ transactionId: e.txnId }}
                      className="num text-primary hover:underline"
                    >
                      {e.txnId}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{e.type}</td>
                  <td className="num px-4 py-3 font-semibold text-destructive whitespace-nowrap">
                    -{formatMoney(e.difference)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={e.severity} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={e.status} />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{e.owner}</td>
                  <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(e.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
