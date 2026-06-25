import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

function AdminBookings() {
  const qc = useQueryClient();
  const [hotelF, setHotelF] = useState("all"); const [statusF, setStatusF] = useState("all");

  const { data: hotels = [] } = useQuery({ queryKey: ["hotels"], queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [] });
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => (await supabase.from("bookings").select("*, hotels(name, slug), customers(*)").not("status", "in", "(cancelled,no_show)").order("check_in_date", { ascending: false })).data ?? [],
  });

  async function update(id: string, patch: any, msg: string) {
    const { error } = await supabase.from("bookings").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(msg); qc.invalidateQueries({ queryKey: ["admin-bookings"] }); }
  }

  const filtered = bookings.filter((b: any) =>
    (hotelF === "all" || b.hotels?.slug === hotelF) && (statusF === "all" || b.status === statusF));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select value={hotelF} onChange={(e) => setHotelF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm">
          <option value="all">All Hotels</option>{hotels.map((h: any) => <option key={h.id} value={h.slug}>{h.name}</option>)}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm">
          <option value="all">Any Status</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>{["Booking", "Customer", "Mobile", "Hotel", "Category", "Check-In", "Check-Out", "Total", "Status", "Actions"].map((h) => <th key={h} className="text-left py-4 px-4 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-muted-foreground">No bookings</td></tr>}
            {filtered.map((b: any) => (
              <tr key={b.id} className="border-t border-border">
                <td className="py-4 px-4 text-gold">{b.booking_code}</td>
                <td className="py-4 px-4">{b.customers?.full_name}</td>
                <td className="py-4 px-4 text-muted-foreground">{b.customers?.mobile}</td>
                <td className="py-4 px-4">{b.hotels?.name}</td>
                <td className="py-4 px-4">{CATEGORY_LABELS[b.category]}</td>
                <td className="py-4 px-4">{b.check_in_date}</td>
                <td className="py-4 px-4">{b.check_out_date}</td>
                <td className="py-4 px-4">{formatINR(b.total_amount)}</td>
                <td className="py-4 px-4"><span className="text-[10px] uppercase tracking-[0.2em] text-gold">{b.status}</span></td>
                <td className="py-4 px-4">
                  <div className="flex gap-1 text-[10px] uppercase tracking-[0.15em]">
                    {b.status !== "checked_in" && <button onClick={() => update(b.id, { status: "checked_in" }, "Checked in")} className="border border-border px-2 py-1 hover:border-gold hover:text-gold">Check-in</button>}
                    {b.status !== "checked_out" && <button onClick={() => update(b.id, { status: "checked_out" }, "Checked out")} className="border border-border px-2 py-1 hover:border-gold hover:text-gold">Check-out</button>}
                    <button onClick={() => confirm("Cancel booking?") && update(b.id, { status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "Cancelled by admin" }, "Cancelled")} className="border border-red-500/30 text-red-400 px-2 py-1 hover:bg-red-500/10">Cancel</button>
                    <button onClick={() => update(b.id, { status: "no_show", cancelled_at: new Date().toISOString() }, "Marked no-show")} className="border border-border px-2 py-1 hover:border-gold hover:text-gold">No-show</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
