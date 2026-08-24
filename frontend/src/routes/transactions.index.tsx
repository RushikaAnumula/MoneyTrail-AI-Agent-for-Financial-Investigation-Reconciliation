import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatMoney } from "@/lib/mock-data";
import { getTransactions } from "@/lib/transactions.functions";

export const Route = createFileRoute("/transactions/")({
  loader: () => getTransactions(),
  pendingComponent: () => (
    <AppShell title="Transactions" description="Loading transaction ledger…">
      <div className="panel flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading transactions…</p>
        </div>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Transactions" description="Unable to load the transaction ledger">
      <div className="panel flex h-96 flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-medium text-destructive">Could not reach the backend API</p>
        <p className="max-w-md text-xs text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "Could not load transactions from the MoneyTrail production API. Please try again."}
        </p>
      </div>
    </AppShell>
  ),
  head: () => ({
    meta: [
      { title: "Transactions Ledger | MoneyTrail" },
      {
        name: "description",
        content:
          "Browse every captured payment with payment, settlement and reconciliation status across gateways and acquirers.",
      },
      { property: "og:title", content: "Transactions Ledger | MoneyTrail" },
      {
        property: "og:description",
        content: "Payment, settlement and reconciliation status for every transaction in the ledger.",
      },
    ],
  }),
  component: TransactionsPage,
});

const filters = ["all", "reconciled", "exception", "in_review"] as const;
const filterLabels: Record<string, string> = {
  all: "All",
  reconciled: "Reconciled",
  exception: "Exceptions",
  in_review: "In review",
};

function TransactionsPage() {
  const transactions = Route.useLoaderData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");

  const rows = useMemo(
    () =>
      transactions.filter((t) => {
        const matchesFilter = filter === "all" || t.recon === filter;
        const q = query.trim().toLowerCase();
        const matchesQuery =
          !q || t.id.toLowerCase().includes(q) || t.merchant.toLowerCase().includes(q) || t.gateway.toLowerCase().includes(q);
        return matchesFilter && matchesQuery;
      }),
    [query, filter, transactions],
  );

  return (
    <AppShell
      title="Transactions"
      description={`${transactions.length} transactions ingested from 4 gateways · settlement period Aug 2026`}
      actions={
        <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong bg-surface px-3.5 text-sm font-medium transition-colors hover:bg-accent">
          <Download className="size-4" strokeWidth={1.75} />
          Export CSV
        </button>
      }
    >
      <div className="panel">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by transaction ID, merchant or gateway"
              className="h-9 w-full rounded-md border border-input bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </div>
          <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-3 py-1.5 text-xs font-medium transition-colors ${
                  filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
          <button className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong px-3 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <SlidersHorizontal className="size-4" strokeWidth={1.75} />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface/60 text-left">
                {["Transaction ID", "Date", "Merchant", "Amount", "Payment", "Settlement", "Reconciliation"].map((h) => (
                  <th key={h} className="label-caps px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((t) => (
                <tr key={t.id} className="transition-colors hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link
                      to="/transactions/$transactionId"
                      params={{ transactionId: t.id }}
                      className="num font-medium text-primary hover:underline"
                    >
                      {t.id}
                    </Link>
                    <div className="text-xs text-muted-foreground">{t.gateway}</div>
                  </td>
                  <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDate(t.date)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{t.merchant}</div>
                    <div className="text-xs text-muted-foreground">{t.method}</div>
                  </td>
                  <td className="num px-4 py-3 font-semibold whitespace-nowrap">{formatMoney(t.amount)}</td>
                  <td className="px-4 py-3">
                    <StatusPill value={t.payment} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={t.settlement} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill value={t.recon} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted-foreground">
          <span>
            Showing <span className="num text-foreground">{rows.length}</span> of{" "}
            <span className="num text-foreground">{transactions.length}</span> transactions
          </span>
          <div className="flex gap-2">
            <button className="rounded border border-border-strong px-2.5 py-1 hover:bg-accent">Previous</button>
            <button className="rounded border border-border-strong px-2.5 py-1 hover:bg-accent">Next</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
