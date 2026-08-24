import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import { ArrowUpRight, Receipt, CheckCircle2, TriangleAlert, Banknote } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { formatDate, formatMoney } from "@/lib/mock-data";
import { getTransactions } from "@/lib/transactions.functions";
import { computeMetrics, deriveExceptions, exceptionCategories } from "@/lib/reconciliation";

export const Route = createFileRoute("/")({
  loader: () => getTransactions(),
  pendingComponent: () => (
    <AppShell title="Reconciliation Dashboard" description="Loading reconciliation overview…">
      <div className="panel flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading reconciliation data…</p>
        </div>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Reconciliation Dashboard" description="Unable to load the reconciliation overview">
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
      { title: "Reconciliation Dashboard | MoneyTrail" },
      {
        name: "description",
        content:
          "Monitor transaction volume, reconciliation coverage, open financial exceptions and amount at risk in one controller dashboard.",
      },
      { property: "og:title", content: "Reconciliation Dashboard | MoneyTrail" },
      {
        property: "og:description",
        content: "Track reconciliation coverage, open exceptions and amount at risk across your payment stack.",
      },
    ],
  }),
  component: Dashboard,
});

const chartColors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-2)",
  "var(--chart-1)",
];

function Metric({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Receipt;
  tone: "primary" | "success" | "destructive" | "warning";
}) {
  const toneClass = {
    primary: "bg-primary/12 text-primary",
    success: "bg-success/12 text-success",
    destructive: "bg-destructive/12 text-destructive",
    warning: "bg-warning/12 text-warning",
  }[tone];

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between">
        <p className="label-caps">{label}</p>
        <span className={`grid size-8 place-items-center rounded-md ${toneClass}`}>
          <Icon className="size-4" strokeWidth={1.75} />
        </span>
      </div>
      <p className="num mt-4 text-3xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Dashboard() {
  const transactions = Route.useLoaderData();
  const exceptions = useMemo(() => deriveExceptions(transactions), [transactions]);
  const metrics = useMemo(() => computeMetrics(transactions, exceptions), [transactions, exceptions]);
  const exceptionsByCategory = useMemo(() => exceptionCategories(exceptions), [exceptions]);
  const reconRate = metrics.matchRate;
  const recent = useMemo(
    () => [...exceptions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [exceptions],
  );

  return (
    <AppShell
      title="Reconciliation Dashboard"
      description="Financial control overview for the current settlement period · Aug 2026"
      actions={
        <Link
          to="/exceptions"
          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Review exceptions
          <ArrowUpRight className="size-4" />
        </Link>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Total transactions"
          value={metrics.totalTransactions.toLocaleString()}
          sub="Ingested this period"
          icon={Receipt}
          tone="primary"
        />
        <Metric
          label="Reconciled"
          value={metrics.reconciled.toLocaleString()}
          sub={`${reconRate}% matched within tolerance`}
          icon={CheckCircle2}
          tone="success"
        />
        <Metric
          label="Open exceptions"
          value={metrics.openExceptions.toLocaleString()}
          sub="Awaiting investigation or sign-off"
          icon={TriangleAlert}
          tone="warning"
        />
        <Metric
          label="Amount at risk"
          value={formatMoney(metrics.amountAtRisk)}
          sub="Net unexplained variance"
          icon={Banknote}
          tone="destructive"
        />
      </div>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-5">
        <section className="panel xl:col-span-3">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Exception categories</h2>
              <p className="text-xs text-muted-foreground">Distribution of unresolved discrepancy types</p>
            </div>
          </div>
          <div className="h-[320px] p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={exceptionsByCategory} layout="vertical" margin={{ left: 8, right: 24 }}>
                <CartesianGrid horizontal={false} stroke="var(--border)" />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  type="category"
                  dataKey="type"
                  width={150}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "var(--accent)" }}
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border-strong)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={16}>
                  {exceptionsByCategory.map((entry, i) => (
                    <Cell key={entry.type} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Recent exceptions</h2>
              <p className="text-xs text-muted-foreground">Newest flagged discrepancies</p>
            </div>
            <Link to="/exceptions" className="text-xs font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {recent.map((e) => (
              <li key={e.id}>
                <Link
                  to="/transactions/$transactionId"
                  params={{ transactionId: e.txnId }}
                  className="flex items-start justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{e.type}</p>
                    <p className="num mt-0.5 text-xs text-muted-foreground">
                      {e.txnId} · {formatDate(e.date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="num text-sm font-semibold text-destructive">
                      -{formatMoney(e.difference)}
                    </span>
                    <StatusPill value={e.severity} dot={false} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
