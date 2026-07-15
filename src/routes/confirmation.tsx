import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR, fmtDateTime, getDurationLabel, getRateLabel } from "@/lib/hotel";
import { downloadInvoice } from "@/lib/invoicePdf";
import { Check, Download, Calendar, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useCallback, useEffect, useRef } from "react";

import { toast } from "sonner";

type Search = { bookingId?: string };

export const Route = createFileRoute("/confirmation")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    bookingId: typeof s.bookingId === "string" ? s.bookingId : undefined,
  }),
  component: Confirmation,
});

function Confirmation() {
  const { bookingId } = Route.useSearch();
  const [pdfLoading, setPdfLoading] = useState(false);

  const { data: booking } = useQuery({
    queryKey: ["booking", bookingId],
    enabled: !!bookingId,
    queryFn: async () =>
      (await supabase.from("bookings").select("*, hotels(name), customers(*)").eq("id", bookingId!).maybeSingle()).data,
  });

  const handleDownloadInvoice = useCallback(async () => {
    if (!booking) return;
    setPdfLoading(true);
    try {
      downloadInvoice(booking);
      toast.success(`Invoice-${booking.booking_code}.pdf is being downloaded`);
    } catch (e) {
      toast.error("Failed to generate invoice. Please try again.");
    } finally {
      setTimeout(() => setPdfLoading(false), 1200);
    }
  }, [booking]);



  if (!booking)
    return (
      <WebsiteLayout>
        <div className="container-luxe py-32 text-center text-muted-foreground font-medium">Loading…</div>
      </WebsiteLayout>
    );

  const customer = (booking as any).customers ?? {};

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20 max-w-xl mx-auto text-center">

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 14 }}
          className="h-24 w-24 rounded-full bg-emerald-500 mx-auto flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/20"
        >
          <Check className="h-12 w-12 text-white" strokeWidth={3} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <h1 className="font-bold text-3xl mb-4 text-foreground tracking-tight">Payment Successful</h1>
          <p className="text-muted-foreground text-lg mb-2">
            Thank you for your booking.
          </p>
          <p className="text-muted-foreground font-medium">
            Your reservation has been confirmed successfully.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card shadow-sm border border-border rounded-xl overflow-hidden mb-8 p-8"
        >
          <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Booking Reference</div>
          <div className="font-extrabold text-3xl text-primary tracking-tight mb-8">{booking.booking_code}</div>
          
          <div className="text-sm text-muted-foreground">
            A confirmation email with your invoice has been sent to:<br/>
            <span className="font-semibold text-foreground mt-1 inline-block">{customer.email}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={handleDownloadInvoice}
            disabled={pdfLoading}
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 py-3 px-6 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Invoice
          </button>
          
          {/* <Link
            to="/admin/bookings" 
            className="w-full sm:w-auto bg-card hover:bg-muted text-foreground border border-border py-3 px-6 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all"
          >
            <Calendar className="h-4 w-4" />
            View Booking
          </Link> */}
          
          <Link
            to="/"
            className="w-full sm:w-auto bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground py-3 px-6 text-sm font-semibold rounded-lg flex items-center justify-center transition-all"
          >
            Back to Home
          </Link>
        </motion.div>

      </div>
    </WebsiteLayout>
  );
}
