import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR, fmtDateTime, getDurationLabel, CATEGORY_LABELS } from "@/lib/hotel";
import { Lock, CreditCard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useSendEmail } from "@/hooks/useSendEmail";

type Search = { bookingId?: string };

export const Route = createFileRoute("/payment")({
  validateSearch: (s: Record<string, unknown>): Search => ({ bookingId: typeof s.bookingId === "string" ? s.bookingId : undefined }),
  component: Payment,
});

function Payment() {
  const { bookingId } = Route.useSearch();
  const nav = useNavigate();
  const { sendConfirmation } = useSendEmail();

  const { data: booking } = useQuery({
    queryKey: ["booking", bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await supabase.from("bookings").select("*, hotels(name), customers(*)").eq("id", bookingId!).maybeSingle()).data,
  });

  if (!bookingId) return <WebsiteLayout><div className="container-luxe py-32 text-center font-medium">Invalid payment session.</div></WebsiteLayout>;
  if (!booking) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground font-medium">Loading…</div></WebsiteLayout>;

  async function payNow() {
    try {
      const payRef = `RZP_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
      
      const { error } = await supabase.from("bookings").update({
        status: "confirmed", payment_status: "paid", payment_ref: payRef,
      }).eq("id", bookingId!);
      if (error) throw error;
      
      const { error: invError } = await supabase.from("invoices").insert({
        booking_id: bookingId!, customer_id: (booking as any)?.customer_id,
        amount: (booking as any)?.total_amount ?? 0, status: "paid",
      });
      if (invError) throw invError;

      const { data: updatedBooking, error: fetchError } = await supabase
        .from("bookings")
        .select("*, hotels(name), customers(*)")
        .eq("id", bookingId!)
        .maybeSingle();
      
      if (fetchError || !updatedBooking) throw fetchError || new Error("Failed to fetch updated booking");

      const customer = (updatedBooking as any).customers;
      const hotel = (updatedBooking as any).hotels;

      if (customer?.email) {
        try {
          await sendConfirmation(customer.email, {
            customerName: customer.full_name,
            bookingCode: updatedBooking.booking_code,
            hotelName: hotel?.name ?? "Emirates Grand Inn",
            roomType: CATEGORY_LABELS[(updatedBooking as any).category] ?? (updatedBooking as any).category,
            checkIn: fmtDateTime(updatedBooking.check_in_date, updatedBooking.check_in_time),
            checkOut: fmtDateTime(updatedBooking.check_out_date, updatedBooking.stay_type === '12_hours' ? (() => {
                   const d = new Date(`${updatedBooking.check_in_date}T${updatedBooking.check_in_time || "14:00"}:00`);
                   d.setHours(d.getHours() + 12);
                   return d.toTimeString().slice(0, 5);
                })() : '12:00'),
            durationLabel: getDurationLabel(updatedBooking.num_days, updatedBooking.stay_type),
            numGuests: updatedBooking.num_guests,
            numRooms: updatedBooking.num_rooms,
            totalAmount: formatINR(updatedBooking.total_amount),
            paymentStatus: updatedBooking.payment_status ?? "paid",
          });
        } catch (emailErr) {
          console.error("Failed to send confirmation email:", emailErr);
          // Do not throw; allow payment flow to continue
        }
      }

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
          
          <div className="bg-muted/30 border border-border rounded-lg p-5 mb-8 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Check-in</span>
              <span className="font-semibold">{fmtDateTime(booking.check_in_date, booking.check_in_time)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Check-out</span>
              <span className="font-semibold">{fmtDateTime(booking.check_out_date, booking.stay_type === '12_hours' ? (() => {
                 const d = new Date(`${booking.check_in_date}T${booking.check_in_time || "14:00"}:00`);
                 d.setHours(d.getHours() + 12);
                 return d.toTimeString().slice(0, 5);
              })() : '12:00')}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-semibold">{getDurationLabel(booking.num_days, booking.stay_type)}</span>
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
