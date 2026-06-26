import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { Check, Download, Mail, Building } from "lucide-react";
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

  if (!booking) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground font-medium">Loading…</div></WebsiteLayout>;

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20 max-w-2xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}
          className="h-20 w-20 rounded-full bg-primary mx-auto flex items-center justify-center mb-8 shadow-md">
          <Check className="h-10 w-10 text-white" strokeWidth={3} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
          <div className="h-12 w-12 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="h-6 w-6 text-primary" />
          </div>
          <h1 className="font-bold text-4xl mb-4 text-foreground tracking-tight">Reservation Confirmed</h1>
          <p className="text-muted-foreground font-medium">Thank you, {(booking as any).customers?.full_name}. Your stay awaits.</p>
        </motion.div>
        <div className="bg-card shadow-sm border border-border p-8 rounded-lg mb-8">
          <div className="text-center pb-6 border-b border-border mb-6">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booking Reference</div>
            <div className="font-bold text-3xl text-primary mt-2">{booking.booking_code}</div>
          </div>
          <dl className="space-y-4">
            {[
              ["Hotel", (booking as any).hotels?.name],
              ["Category", CATEGORY_LABELS[booking.category]],
              ["Check-In", `${booking.check_in_date} ${booking.check_in_time ?? ""}`],
              ["Check-Out", booking.check_out_date],
              ["Guests", String(booking.num_guests)],
              ["Rooms", String(booking.num_rooms)],
              ["Total Paid", formatINR(booking.total_amount)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm"><dt className="font-semibold text-muted-foreground">{k}</dt><dd className="font-bold text-foreground">{v}</dd></div>
            ))}
          </dl>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <button className="bg-primary/5 text-primary py-3.5 text-sm font-semibold rounded-md border border-primary/20 flex items-center justify-center gap-2 hover:bg-primary/10 transition">
            <Download className="h-4 w-4" /> Download Invoice
          </button>
          <button className="bg-background text-muted-foreground py-3.5 text-sm font-semibold rounded-md border border-border flex items-center justify-center gap-2 hover:text-foreground hover:border-foreground/30 transition">
            <Mail className="h-4 w-4" /> Email Confirmation Sent
          </button>
        </div>
        <Link to="/" className="block text-center mt-10 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">Return Home →</Link>
      </div>
    </WebsiteLayout>
  );
}
