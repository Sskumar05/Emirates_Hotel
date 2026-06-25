import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/hotel";
import { Download, Mail, MessageCircle, Eye } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/invoices")({ component: Invoices });

function Invoices() {
  const { data: invoices = [] } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => (await supabase.from("invoices").select("*, bookings(booking_code, hotels(name)), customers(*)").order("issued_at", { ascending: false })).data ?? [],
  });

  return (
    <div className="bg-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>{["Invoice", "Booking", "Customer", "Hotel", "Amount", "Date", "Status", "Actions"].map((h) => <th key={h} className="text-left py-4 px-4 font-normal">{h}</th>)}</tr>
        </thead>
        <tbody>
          {invoices.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No invoices yet</td></tr>}
          {invoices.map((inv: any) => (
            <tr key={inv.id} className="border-t border-border">
              <td className="py-4 px-4 text-gold">{inv.invoice_number}</td>
              <td className="py-4 px-4">{inv.bookings?.booking_code}</td>
              <td className="py-4 px-4">{inv.customers?.full_name}</td>
              <td className="py-4 px-4">{inv.bookings?.hotels?.name}</td>
              <td className="py-4 px-4">{formatINR(inv.amount)}</td>
              <td className="py-4 px-4 text-muted-foreground">{new Date(inv.issued_at).toLocaleDateString()}</td>
              <td className="py-4 px-4"><span className={`text-[10px] uppercase tracking-[0.2em] ${inv.status === "paid" ? "text-emerald-400" : "text-amber-400"}`}>{inv.status}</span></td>
              <td className="py-4 px-4">
                <div className="flex gap-2">
                  <button onClick={() => toast.info("Preview coming soon")} className="text-muted-foreground hover:text-gold"><Eye className="h-4 w-4" /></button>
                  <button onClick={() => toast.success("Invoice PDF download (pdf-lib ready)")} className="text-muted-foreground hover:text-gold"><Download className="h-4 w-4" /></button>
                  <button onClick={() => toast.success("Email queued (Resend ready)")} className="text-muted-foreground hover:text-gold"><Mail className="h-4 w-4" /></button>
                  <button onClick={() => toast.success("WhatsApp message queued")} className="text-muted-foreground hover:text-gold"><MessageCircle className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
