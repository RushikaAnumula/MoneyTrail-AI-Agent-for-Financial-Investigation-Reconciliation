import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Controller Settings | MoneyTrail" },
      {
        name: "description",
        content:
          "Configure reconciliation tolerances, settlement sources, exception routing rules and notification preferences.",
      },
      { property: "og:title", content: "Controller Settings | MoneyTrail" },
      {
        property: "og:description",
        content: "Reconciliation tolerances, connected settlement sources and exception routing rules.",
      },
    ],
  }),
  component: SettingsPage,
});

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const inputClass =
  "h-9 w-full rounded-md border border-input bg-surface px-3 text-sm outline-none focus:border-ring";

function Toggle({ label, description, defaultOn }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(!!defaultOn);
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => setOn((v) => !v)}
        className={`mt-0.5 h-5 w-9 shrink-0 rounded-full border transition-colors ${
          on ? "border-primary bg-primary" : "border-border-strong bg-secondary"
        }`}
      >
        <span
          className={`block size-4 rounded-full bg-background transition-transform ${on ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

const sources = [
  { name: "Stripe", type: "Gateway", status: "Connected", last: "12 min ago" },
  { name: "Adyen", type: "Gateway", status: "Connected", last: "26 min ago" },
  { name: "First National Bank", type: "Bank statement (MT940)", status: "Connected", last: "4 hours ago" },
  { name: "NetSuite GL", type: "Ledger", status: "Connected", last: "1 hour ago" },
];

function SettingsPage() {
  return (
    <AppShell title="Settings" description="Workspace configuration for reconciliation and exception handling">
      <div className="grid gap-6 xl:grid-cols-2">
        <Section title="Organization" description="Details shown across reports and exports">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Legal entity">
              <input className={inputClass} defaultValue="Meridian Commerce Inc." />
            </Field>
            <Field label="Reporting currency">
              <select className={inputClass} defaultValue="USD">
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>INR</option>
              </select>
            </Field>
            <Field label="Fiscal period">
              <select className={inputClass} defaultValue="Monthly">
                <option>Monthly</option>
                <option>Quarterly</option>
              </select>
            </Field>
            <Field label="Time zone">
              <select className={inputClass} defaultValue="UTC">
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Kolkata</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title="Reconciliation rules" description="Thresholds that decide when a variance becomes an exception">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Amount tolerance" hint="Variance below this is auto-matched.">
              <input className={inputClass} defaultValue="0.50" />
            </Field>
            <Field label="Percentage tolerance" hint="Applied to high-value transactions.">
              <input className={inputClass} defaultValue="0.15%" />
            </Field>
            <Field label="Settlement SLA (days)" hint="Missing settlement is flagged after this window.">
              <input className={inputClass} defaultValue="3" />
            </Field>
            <Field label="Critical severity threshold">
              <input className={inputClass} defaultValue="$1,000.00" />
            </Field>
          </div>
        </Section>

        <Section title="Connected sources" description="Systems feeding the reconciliation engine">
          <ul className="divide-y divide-border">
            {sources.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-success">{s.status}</p>
                  <p className="text-xs text-muted-foreground">Synced {s.last}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title="Notifications & routing" description="Who gets told when an exception appears">
          <div className="divide-y divide-border">
            <Toggle label="Critical exception alerts" description="Email the controller within 5 minutes." defaultOn />
            <Toggle label="Daily reconciliation digest" description="Summary of unresolved variances at 08:00." defaultOn />
            <Toggle label="Auto-assign by merchant" description="Route new exceptions to the merchant's analyst." />
            <Toggle label="Auto-run AI investigation" description="Draft an explanation as soon as an exception opens." />
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button className="h-9 rounded-md border border-border-strong px-4 text-sm font-medium hover:bg-accent">
              Cancel
            </button>
            <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Save changes
            </button>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
