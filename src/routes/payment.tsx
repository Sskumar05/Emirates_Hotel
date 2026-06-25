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

  if (!bookingId) return <WebsiteLayout><div className="container-luxe py-32 text-center">Invalid payment session.</div></WebsiteLayout>;
  if (!booking) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground">Loading…</div></WebsiteLayout>;

  async function payNow() {
    // Razorpay-ready stub. Wire Razorpay key + verification when keys provided.
    try {
      const payRef = `RZP_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      const { error } = await supabase.from("bookings").update({
        status: "confirmed", payment_status: "paid", payment_ref: payRef,
      }).eq("id", bookingId!);
      if (error) throw error;
      await supabase.from("invoices").insert({
        booking_id: bookingId!, customer_id: (booking as any).customer_id,
        amount: booking.total_amount, status: "paid",
      });
      toast.success("Payment successful");
      nav({ to: "/confirmation", search: { bookingId } as any });
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20 max-w-2xl">
        <div className="text-center mb-10">
          <Lock className="h-8 w-8 text-gold mx-auto mb-4" />
          <h1 className="font-display text-4xl">Secure Payment</h1>
          <p className="text-sm text-muted-foreground mt-2">Powered by Razorpay (integration-ready)</p>
        </div>
        <div className="bg-card border border-border p-8">
          <div className="flex justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gold">{(booking as any).hotels?.name}</div>
              <div className="text-sm text-muted-foreground mt-1">Booking {booking.booking_code}</div>
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Amount Due</div>
              <div className="font-display text-3xl text-gold">{formatINR(booking.total_amount)}</div>
            </div>
          </div>
          <div className="border border-dashed border-border p-6 mb-6 text-center text-sm text-muted-foreground">
            <CreditCard className="h-6 w-6 mx-auto text-gold mb-2" />
            Razorpay checkout will open here once API keys are configured. For now, click below to simulate a successful payment.
          </div>
          <button onClick={payNow} className="w-full gradient-gold text-primary-foreground py-4 text-xs uppercase tracking-[0.3em] hover:brightness-110 transition">
            Pay {formatINR(booking.total_amount)} Securely
          </button>
          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" /> 256-bit SSL secured
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
