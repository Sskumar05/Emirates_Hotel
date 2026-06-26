import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Hotel, Sliders, Mail, CheckCircle, XCircle, Loader2, FlaskConical } from "lucide-react";
import { useState } from "react";
import {
  testBookingConfirmationEmail,
  testInvoiceEmail,
  testCancellationEmail,
  testAdminNotificationEmail,
  runAllEmailTests,
  type EmailTestResult,
} from "@/lib/email/emailTestUtils";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

// ── Email Test Panel ──────────────────────────────────────────────────────────
function EmailTestPanel() {
  const [testEmail, setTestEmail] = useState("");
  const [running, setRunning] = useState<string | null>(null);
  const [results, setResults] = useState<EmailTestResult[]>([]);

  async function run(label: string, fn: () => Promise<EmailTestResult>) {
    setRunning(label);
    try {
      const r = await fn();
      setResults((prev) => {
        const next = prev.filter((x) => x.type !== r.type);
        return [r, ...next];
      });
    } finally {
      setRunning(null);
    }
  }

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(testEmail);

  const tests = [
    {
      label: "Booking Confirmation",
      type: "booking_confirmation",
      fn: () => testBookingConfirmationEmail(testEmail),
    },
    {
      label: "Invoice Email",
      type: "invoice",
      fn: () => testInvoiceEmail(testEmail),
    },
    {
      label: "Cancellation Email",
      type: "cancellation",
      fn: () => testCancellationEmail(testEmail),
    },
    {
      label: "Admin Notification",
      type: "admin_notification",
      fn: () => testAdminNotificationEmail(),
      noEmail: true,
    },
  ];

  return (
    <div className="bg-card border border-border p-8">
      <div className="flex items-center gap-3 mb-6">
        <FlaskConical className="h-5 w-5 text-gold" />
        <h3 className="font-display text-xl">Email Test Suite</h3>
        <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 border border-emerald-400/30 px-2 py-0.5">
          Live
        </span>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Send real test emails through the Resend Edge Function to verify delivery. Enter a destination email for
        customer-facing emails.
      </p>

      <div className="flex gap-3 mb-8">
        <input
          type="email"
          placeholder="test@example.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="flex-1 bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-gold/60"
        />
        <button
          disabled={!isEmailValid || !!running}
          onClick={() =>
            run("all", () =>
              runAllEmailTests(testEmail).then((arr) => arr[arr.length - 1]),
            )
          }
          className="border border-gold/40 text-gold px-5 py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-gold/10 disabled:opacity-40 flex items-center gap-2"
        >
          {running === "all" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
          Run All Tests
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {tests.map((t) => {
          const res = results.find((r) => r.type === t.type);
          const isRunning = running === t.label;
          return (
            <div
              key={t.type}
              className="border border-border p-4 flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{t.label}</div>
                {res && (
                  <div
                    className={`text-xs mt-1 truncate ${res.result.success ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {res.result.success
                      ? `Delivered · ${res.durationMs}ms · ID: ${res.result.id?.slice(0, 8)}…`
                      : res.result.error}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {res && (
                  <>
                    {res.result.success ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-400" />
                    )}
                  </>
                )}
                <button
                  disabled={(!isEmailValid && !t.noEmail) || isRunning || !!running}
                  onClick={() => run(t.label, t.fn)}
                  className="border border-border px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] hover:border-gold hover:text-gold disabled:opacity-40 flex items-center gap-1"
                >
                  {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                  Send
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────────
function Settings() {
  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [],
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <Hotel className="h-5 w-5 text-gold" />
          <h3 className="font-display text-xl">Hotel Settings</h3>
        </div>
        <div className="space-y-3">
          {hotels.map((h: any) => (
            <div
              key={h.id}
              className="flex justify-between py-3 border-b border-border last:border-0"
            >
              <div>
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-muted-foreground">{h.address}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {h.phone}
                <br />
                {h.email}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <Sliders className="h-5 w-5 text-gold" />
          <h3 className="font-display text-xl">General Settings</h3>
        </div>
        <div className="space-y-4 text-sm">
          <Setting label="Currency" value="INR (₹)" />
          <Setting label="Time Zone" value="Asia/Kolkata" />
          <Setting label="Default Check-in" value="14:00" />
          <Setting label="Default Check-out" value="12:00" />
        </div>
      </div>

      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-gold" />
          <h3 className="font-display text-xl">Notifications</h3>
        </div>
        <div className="space-y-3 text-sm">
          <Toggle label="Email confirmations" defaultOn />
          <Toggle label="SMS/WhatsApp confirmations" defaultOn />
          <Toggle label="Daily summary email" defaultOn />
        </div>
      </div>

      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6">
          <Mail className="h-5 w-5 text-gold" />
          <h3 className="font-display text-xl">Integrations</h3>
        </div>
        <ul className="text-sm space-y-2">
          <li className="flex justify-between">
            <span>Razorpay (Payments)</span>
            <span className="text-amber-400">Ready — keys required</span>
          </li>
          <li className="flex justify-between">
            <span>Resend (Email)</span>
            <span className="text-emerald-400">Active — Edge Function deployed</span>
          </li>
          <li className="flex justify-between">
            <span>Cloudinary (Media)</span>
            <span className="text-amber-400">Ready — keys required</span>
          </li>
          <li className="flex justify-between">
            <span>pdf-lib (Invoices)</span>
            <span className="text-emerald-400">Active</span>
          </li>
        </ul>
      </div>

      <EmailTestPanel />
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2 border-b border-border last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span>{label}</span>
      <input
        type="checkbox"
        defaultChecked={defaultOn}
        className="accent-[var(--color-gold)] w-5 h-5"
      />
    </label>
  );
}
