import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Sparkles, Loader2, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusPill } from "@/components/status-pill";
import { useServerFn } from "@tanstack/react-start";
import { exceptions, formatDate, formatMoney } from "@/lib/mock-data";
import { getTransactionById } from "@/lib/transactions.functions";
import { getInvestigation } from "@/lib/investigation.functions";
import type { InvestigationResult } from "@/lib/investigation.server";

export const Route = createFileRoute("/transactions/$transactionId")({
  loader: async ({ params }) => {
    const transaction = await getTransactionById({ data: { transactionId: params.transactionId } });
    if (!transaction) throw notFound();
    return { transaction };
  },
  pendingComponent: () => (
    <AppShell title="Transaction" description="Loading transaction…">
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading transaction…
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell title="Transaction" description="Could not load this transaction">
      <div className="panel p-6 text-sm text-muted-foreground">{error.message}</div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell title="Transaction not found" description="No such transaction in the dataset">
      <div className="panel p-6 text-sm text-muted-foreground">
        This transaction ID does not exist in the MoneyTrail dataset.
      </div>
    </AppShell>
  ),
  head: ({ params }) => ({
    meta: [
      { title: `${params.transactionId} · Investigation | MoneyTrail` },
      {
        name: "description",
        content: `Payment, settlement, fee and refund detail for transaction ${params.transactionId}, with a full reconciliation timeline.`,
      },
      { property: "og:title", content: `${params.transactionId} · Investigation | MoneyTrail` },
      {
        property: "og:description",
        content: "Full payment, settlement and reconciliation breakdown for a single transaction.",
      },
    ],
  }),
  component: TransactionDetail,
});

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

function Row({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/60 py-2.5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${mono ? "num" : ""} text-right`}>{value}</span>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel">
      <div className="border-b border-border px-5 py-3.5">
        <h2 className="text-sm font-semibold">{title}</h2>
      </div>
      <div className="px-5 py-2">{children}</div>
    </section>
  );
}

function TransactionDetail() {
  const { transaction: t } = Route.useLoaderData();
  const related = exceptions.filter((e) => e.txnId === t.id);
  const [state, setState] = useState<"idle" | "running" | "done" | "error">("idle");
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const runInvestigation = useServerFn(getInvestigation);

  const investigate = async () => {
    setState("running");
    setErrorMessage(null);
    try {
      const data = await runInvestigation({ data: { transactionId: t.id } });
      setResult(data);
      setState("done");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Investigation request failed.");
      setState("error");
    }
  };

  const expectedNet = Math.round((t.amount - t.fee - t.tax - t.refunded) * 100) / 100;
  const variance = Math.round((expectedNet - t.netSettled) * 100) / 100;

  return (
    <AppShell
      title={t.id}
      description={`${t.merchant} · ${t.gateway} · ${formatDate(t.date)}`}
      actions={
        <Link
          to="/transactions"
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border-strong px-3.5 text-sm font-medium hover:bg-accent"
        >
          <ArrowLeft className="size-4" strokeWidth={1.75} />
          Back to ledger
        </Link>
      }
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="grid gap-6 xl:col-span-2">
          <div className="panel flex flex-wrap items-center justify-between gap-4 p-5">
            <div>
              <p className="label-caps">Gross amount</p>
              <p className="num mt-1 text-3xl font-semibold">{formatMoney(t.amount, t.currency)}</p>
            </div>
            <div>
              <p className="label-caps">Net settled</p>
              <p className="num mt-1 text-3xl font-semibold">{formatMoney(t.netSettled, t.currency)}</p>
            </div>
            <div>
              <p className="label-caps">Variance</p>
              <p
                className={`num mt-1 text-3xl font-semibold ${variance > 0.5 ? "text-destructive" : "text-success"}`}
              >
                {variance > 0 ? "-" : ""}
                {formatMoney(Math.abs(variance), t.currency)}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <StatusPill value={t.payment} />
              <StatusPill value={t.settlement} />
              <StatusPill value={t.recon} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Panel title="Transaction information">
              <Row label="Transaction ID" value={t.id} />
              <Row label="Merchant" value={t.merchant} mono={false} />
              <Row label="Created" value={formatDate(t.date)} />
              <Row label="Currency" value={t.currency} />
              <Row label="Gateway" value={t.gateway} mono={false} />
            </Panel>

            <Panel title="Payment details">
              <Row label="Method" value={t.method} />
              <Row label="Payment status" value={cap(t.payment)} mono={false} />
              <Row label="Acquirer reference" value={t.acquirerRef} />
              <Row label="Captured amount" value={formatMoney(t.amount, t.currency)} />
              <Row label="Authorization" value="Approved" mono={false} />
            </Panel>

            <Panel title="Settlement details">
              <Row label="Settlement status" value={cap(t.settlement)} mono={false} />
              <Row label="Batch" value={t.settlementBatch} />
              <Row label="Settlement date" value={t.settlementDate ?? "Not settled"} />
              <Row label="Expected net" value={formatMoney(expectedNet, t.currency)} />
              <Row label="Received net" value={formatMoney(t.netSettled, t.currency)} />
            </Panel>

            <Panel title="Fees & refunds">
              <Row label="Processing fee" value={formatMoney(t.fee, t.currency)} />
              <Row label="Tax withheld" value={formatMoney(t.tax, t.currency)} />
              <Row label="Effective fee rate" value={`${((t.fee / t.amount) * 100).toFixed(2)}%`} />
              <Row label="Refunded amount" value={formatMoney(t.refunded, t.currency)} />
              <Row label="Refund status" value={t.refunded > 0 ? "Processed" : "None"} mono={false} />
            </Panel>
          </div>

          <section className="panel">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Transaction timeline</h2>
            </div>
            <ol className="px-5 py-4">
              {t.timeline.map((step, i) => (
                <li key={step.label} className="relative flex gap-4 pb-5 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span
                      className={`mt-1 size-2.5 rounded-full ${
                        i === t.timeline.length - 1 && t.recon !== "reconciled" ? "bg-destructive" : "bg-primary"
                      }`}
                    />
                    {i < t.timeline.length - 1 && <span className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-1">
                    <p className="text-sm font-medium">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                    <p className="num mt-0.5 text-[11px] text-muted-foreground">{formatDate(step.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="grid content-start gap-6">
          <section className="panel">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">Linked exceptions</h2>
            </div>
            {related.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No exceptions linked to this transaction.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {related.map((e) => (
                  <li key={e.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">{e.type}</p>
                      <StatusPill value={e.severity} dot={false} />
                    </div>
                    <p className="num mt-1 text-xs text-muted-foreground">
                      {e.id} · -{formatMoney(e.difference)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="text-sm font-semibold">AI investigation</h2>
              <p className="text-xs text-muted-foreground">
                Correlates ledger, gateway and bank records to explain the variance.
              </p>
            </div>
            <div className="p-5">
              <button
                onClick={investigate}
                disabled={state === "running"}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-70"
              >
                {state === "running" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Investigating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" strokeWidth={1.75} />
                    Investigate with AI
                  </>
                )}
              </button>

              <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-surface p-4">
                {state === "idle" && (
                  <div className="flex gap-3 text-sm text-muted-foreground">
                    <FileText className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                    <p>
                      Investigation results will appear here: root-cause summary, supporting evidence from each source
                      system, and a recommended resolution.
                    </p>
                  </div>
                )}
                {state === "running" && (
                  <div className="space-y-2">
                    {[90, 75, 60].map((w) => (
                      <div key={w} className="h-3 animate-pulse rounded bg-muted" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                )}
                {state === "error" && (
                  <div className="space-y-2 text-sm">
                    <p className="label-caps text-destructive">Investigation failed</p>
                    <p className="text-muted-foreground">
                      {errorMessage ?? "Could not reach the investigation service. Please try again."}
                    </p>
                  </div>
                )}
                {state === "done" && result && (
                  <div className="space-y-3 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="label-caps">Investigation finding</p>
                      <span className="rounded border border-border-strong px-1.5 py-0.5 text-[11px] font-medium">
                        {result.status}
                      </span>
                      <span className="rounded border border-border-strong px-1.5 py-0.5 text-[11px] font-medium">
                        {result.severity}
                      </span>
                      {result.confidence && (
                        <span className="num text-[11px] text-muted-foreground">
                          confidence {result.confidence}
                        </span>
                      )}
                    </div>
                    <p>
                      <span className="font-medium">{result.exceptionType}</span> — {result.rootCause}
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <span className="text-xs text-muted-foreground">Expected net</span>
                      <span className="num text-right text-xs font-medium">
                        {formatMoney(result.expectedNet, t.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">Received net</span>
                      <span className="num text-right text-xs font-medium">
                        {formatMoney(result.receivedNet, t.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">Variance</span>
                      <span
                        className={`num text-right text-xs font-semibold ${
                          Math.abs(result.variance) < 0.01 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatMoney(result.variance, t.currency)}
                      </span>
                    </div>
                    <div>
                      <p className="label-caps">Supporting evidence</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                        {result.evidence.map((e) => (
                          <li key={e.label}>
                            {e.label}: <span className="num">{e.value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="label-caps">Recommended resolution</p>
                      <p className="mt-1 text-muted-foreground">{result.recommendedAction}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
