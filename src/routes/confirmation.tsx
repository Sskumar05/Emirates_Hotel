import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { Check, Download, Mail, Crown } from "lucide-react";
import { motion } from "framer-motion";

type Search = { bookingId?: string };

export const Route = createFileRoute("/confirmation")({
  validateSearch: (s: Record<string, unknown>): Search => ({ bookingId: typeof s.bookingId === "string" ? s.bookingId : undefined }),
  component: Confirmation,
});

function Confirmation() {
  const { bookingId } = Route.useSearch();
  const { data: booking } = useQuery({
    queryKey: ["booking", bookingId],
    enabled: !!bookingId,
    queryFn: async () => (await supabase.from("bookings").select("*, hotels(name), customers(*)").eq("id", bookingId!).maybeSingle()).data,
  });

  if (!booking) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground">Loading…</div></WebsiteLayout>;

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20 max-w-2xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="h-20 w-20 rounded-full gradient-gold mx-auto flex items-center justify-center mb-6">
          <Check className="h-10 w-10 text-primary-foreground" strokeWidth={3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <Crown className="h-6 w-6 text-gold mx-auto mb-3" />
          <h1 className="font-display text-5xl mb-3">Reservation Confirmed</h1>
          <p className="text-muted-foreground">Thank you, {(booking as any).customers?.full_name}. Your stay awaits.</p>
        </motion.div>
        <div className="bg-card border border-border p-8 mb-6">
          <div className="text-center pb-6 border-b border-border mb-6">
            <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Booking Reference</div>
            <div className="font-display text-3xl text-gold mt-2">{booking.booking_code}</div>
          </div>
          <dl className="space-y-3">
            {[
              ["Hotel", (booking as any).hotels?.name],
              ["Category", CATEGORY_LABELS[booking.category]],
              ["Check-In", `${booking.check_in_date} ${booking.check_in_time ?? ""}`],
              ["Check-Out", booking.check_out_date],
              ["Guests", String(booking.num_guests)],
              ["Rooms", String(booking.num_rooms)],
              ["Total Paid", formatINR(booking.total_amount)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm"><dt className="text-muted-foreground">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <button className="border border-gold text-gold py-3 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-gold/10">
            <Download className="h-4 w-4" /> Download Invoice
          </button>
          <button className="border border-border text-muted-foreground py-3 text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:text-gold hover:border-gold">
            <Mail className="h-4 w-4" /> Email Confirmation Sent
          </button>
        </div>
        <Link to="/" className="block text-center mt-8 text-sm text-muted-foreground hover:text-gold">Return Home →</Link>
      </div>
    </WebsiteLayout>
  );
}
