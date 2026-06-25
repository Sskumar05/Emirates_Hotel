import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";

export const Route = createFileRoute("/admin/cancelled")({ component: Cancelled });

function Cancelled() {
  const { data: bookings = [] } = useQuery({
    queryKey: ["cancelled"],
    queryFn: async () => (await supabase.from("bookings").select("*, hotels(name), customers(*)").in("status", ["cancelled", "no_show"]).order("cancelled_at", { ascending: false })).data ?? [],
  });
  return (
    <div className="bg-card border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
          <tr>{["Booking", "Customer", "Hotel", "Category", "Total", "Status", "Cancelled At", "Reason"].map((h) => <th key={h} className="text-left py-4 px-4 font-normal">{h}</th>)}</tr>
        </thead>
        <tbody>
          {bookings.length === 0 && <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">No cancelled bookings</td></tr>}
          {bookings.map((b: any) => (
            <tr key={b.id} className="border-t border-border">
              <td className="py-4 px-4 text-gold">{b.booking_code}</td>
              <td className="py-4 px-4">{b.customers?.full_name}</td>
              <td className="py-4 px-4">{b.hotels?.name}</td>
              <td className="py-4 px-4">{CATEGORY_LABELS[b.category]}</td>
              <td className="py-4 px-4">{formatINR(b.total_amount)}</td>
              <td className="py-4 px-4"><span className={`text-[10px] uppercase tracking-[0.2em] ${b.status === "no_show" ? "text-amber-400" : "text-red-400"}`}>{b.status}</span></td>
              <td className="py-4 px-4 text-muted-foreground">{b.cancelled_at ? new Date(b.cancelled_at).toLocaleString() : "—"}</td>
              <td className="py-4 px-4 text-muted-foreground">{b.cancellation_reason ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
