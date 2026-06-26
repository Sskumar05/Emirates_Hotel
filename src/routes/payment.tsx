import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/hotel";
import { Lock, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

type Search = { bookingId?: string };

export const Route = createFileRoute("/payment")({
  validateSearch: (s: Record<string, unknown>): Search => ({ bookingId: typeof s.bookingId === "string" ? s.bookingId : undefined }),
  component: Payment,
});

function Payment() {
  const { bookingId } = Route.useSearch();
  const nav = useNavigate();
  const { data: booking } = useQuery({
    queryKey: ["booking", bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await supabase.from("bookings").select("*, hotels(name), customers(*)").eq("id", bookingId!).maybeSingle()).data,
  });

  if (!bookingId) return <WebsiteLayout><div className="container-luxe py-32 text-center font-medium">Invalid payment session.</div></WebsiteLayout>;
  if (!booking) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground font-medium">Loading…</div></WebsiteLayout>;

  async function payNow() {
    // Razorpay-ready stub. Wire Razorpay key + verification when keys provided.
    try {
      const payRef = `RZP_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const { error } = await supabase.from("bookings").update({
        status: "confirmed", payment_status: "paid", payment_ref: payRef,
      }).eq("id", bookingId!);
      if (error) throw error;
      await supabase.from("invoices").insert({
        booking_id: bookingId!, customer_id: (booking as any)?.customer_id,
        amount: (booking as any)?.total_amount ?? 0, status: "paid",
      });
      toast.success("Payment successful");
      nav({ to: "/confirmation", search: { bookingId } as any });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20 max-w-2xl">
        <div className="text-center mb-10">
          <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-bold text-4xl text-foreground tracking-tight">Secure Payment</h1>
          <p className="text-sm font-medium text-muted-foreground mt-3">Powered by Razorpay (integration-ready)</p>
        </div>
        <div className="bg-card shadow-sm border border-border p-8 rounded-lg">
          <div className="flex justify-between mb-8">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-gold">{(booking as any).hotels?.name}</div>
              <div className="text-sm font-medium text-foreground mt-2">Booking {booking.booking_code}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Amount Due</div>
              <div className="font-bold text-3xl text-primary">{formatINR(booking.total_amount)}</div>
            </div>
          </div>
          <div className="bg-background border border-dashed border-border rounded-md p-6 mb-8 text-center text-sm font-medium text-muted-foreground">
            <CreditCard className="h-6 w-6 mx-auto text-primary mb-3" />
            Razorpay checkout will open here once API keys are configured. For now, click below to simulate a successful payment.
          </div>
          <button onClick={payNow} className="w-full bg-gold text-white font-semibold py-4 text-sm rounded-md shadow-md hover:bg-gold-hover transition">
            Pay {formatINR(booking.total_amount)} Securely
          </button>
          <div className="flex items-center justify-center gap-2 mt-6 text-xs font-semibold text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-primary" /> 256-bit SSL secured
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
