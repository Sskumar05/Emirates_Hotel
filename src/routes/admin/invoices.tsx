import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/hotel";
import { Download, Mail, Eye } from "lucide-react";
import { toast } from "sonner";
import { useSendEmail } from "@/hooks/useSendEmail";
import { CATEGORY_LABELS } from "@/lib/hotel";

export const Route = createFileRoute("/admin/invoices")({ component: Invoices });

function Invoices() {
  const { sendInvoice, loading } = useSendEmail();

  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () =>
      (
        await supabase
          .from("invoices")
          .select(
            "*, bookings(booking_code, check_in_date, check_out_date, num_days, category, hotels(name)), customers(*)",
          )
          .order("issued_at", { ascending: false })
      ).data ?? [],
  });

  async function handleSendInvoiceEmail(inv: any) {
    if (!inv.customers?.email) {
      toast.error("Customer email not found");
      return;
    }
    const booking = inv.bookings;
    await sendInvoice(inv.customers.email, {
      customerName: inv.customers.full_name,
      invoiceNumber: inv.invoice_number,
      bookingCode: booking?.booking_code ?? "",
      hotelName: booking?.hotels?.name ?? "Emirates Grand Inn",
      roomType: CATEGORY_LABELS[booking?.category ?? ""] ?? booking?.category ?? "",
      checkIn: booking?.check_in_date ?? "",
      checkOut: booking?.check_out_date ?? "",
      numDays: booking?.num_days ?? 1,
      amount: formatINR(inv.amount),
      taxAmount: formatINR(inv.tax_amount ?? 0),
      totalAmount: formatINR((inv.amount ?? 0) + (inv.tax_amount ?? 0)),
      issuedAt: new Date(inv.issued_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      paymentStatus: inv.status,
    });
  }

  return (
    <div className="bg-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>
            {["Invoice", "Booking", "Customer", "Hotel", "Amount", "Date", "Status", "Actions"].map(
              (h) => (
                <th key={h} className="text-left py-4 px-4 font-normal">
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {invoices.length === 0 && (
            <tr>
              <td colSpan={8} className="py-12 text-center text-muted-foreground">
                No invoices yet
              </td>
            </tr>
          )}
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="border-t border-border">
              <td className="py-4 px-4 text-gold">{inv.invoice_number}</td>
              <td className="py-4 px-4">{inv.bookings?.booking_code}</td>
              <td className="py-4 px-4">{inv.customers?.full_name}</td>
              <td className="py-4 px-4">{inv.bookings?.hotels?.name}</td>
              <td className="py-4 px-4">{formatINR(inv.amount)}</td>
              <td className="py-4 px-4 text-muted-foreground">
                {new Date(inv.issued_at).toLocaleDateString()}
              </td>
              <td className="py-4 px-4">
                <span
                  className={`text-[10px] uppercase tracking-[0.2em] ${
                    inv.status === "paid" ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="py-4 px-4">
                <div className="flex gap-2 items-center">
                  <button
                    title="Preview"
                    onClick={() => toast.info("PDF preview coming soon")}
                    className="text-muted-foreground hover:text-gold transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    title="Download PDF"
                    onClick={() => toast.info("PDF download coming soon")}
                    className="text-muted-foreground hover:text-gold transition-colors"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    title="Send Invoice by Email"
                    disabled={loading}
                    onClick={() => handleSendInvoiceEmail(inv)}
                    className="text-muted-foreground hover:text-gold transition-colors disabled:opacity-40"
                  >
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
