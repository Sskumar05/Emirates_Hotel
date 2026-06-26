import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState } from "react";
import { toast } from "sonner";
import { useSendEmail } from "@/hooks/useSendEmail";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

function AdminBookings() {
  const qc = useQueryClient();
  const [hotelF, setHotelF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { sendConfirmation, sendCancellation } = useSendEmail();

  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [],
  });

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () =>
      (
        await supabase
          .from("bookings")
          .select("*, hotels(name, slug), customers(*)")
          .not("status", "in", "(cancelled,no_show)")
          .order("check_in_date", { ascending: false })
      ).data ?? [],
  });

  async function update(id: string, patch: Record<string, unknown>, msg: string) {
    setActionLoading(id);
    try {
      const { error } = await supabase.from("bookings").update(patch).eq("id", id);
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(msg);
        qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConfirm(b: any) {
    await update(b.id, { status: "confirmed" }, "Booking confirmed");
    if (b.customers?.email) {
      await sendConfirmation(b.customers.email, {
        customerName: b.customers.full_name,
        bookingCode: b.booking_code,
        hotelName: b.hotels?.name ?? "Emirates Grand Inn",
        roomType: CATEGORY_LABELS[b.category] ?? b.category,
        roomNumbers: (b.assigned_room_ids ?? []).join(", "),
        checkIn: b.check_in_date,
        checkOut: b.check_out_date,
        numGuests: b.num_guests,
        numRooms: b.num_rooms,
        numDays: b.num_days,
        totalAmount: formatINR(b.total_amount),
        paymentStatus: b.payment_status,
      });
    }
  }

  async function handleCancel(b: any) {
    if (!confirm(`Cancel booking ${b.booking_code}? This will email the customer.`)) return;
    const cancelledAt = new Date().toISOString();
    await update(
      b.id,
      { status: "cancelled", cancelled_at: cancelledAt, cancellation_reason: "Cancelled by admin" },
      "Booking cancelled",
    );
    if (b.customers?.email) {
      await sendCancellation(b.customers.email, {
        customerName: b.customers.full_name,
        bookingCode: b.booking_code,
        hotelName: b.hotels?.name ?? "Emirates Grand Inn",
        roomType: CATEGORY_LABELS[b.category] ?? b.category,
        checkIn: b.check_in_date,
        checkOut: b.check_out_date,
        totalAmount: formatINR(b.total_amount),
        reason: "Cancelled by admin",
        cancelledAt: new Date(cancelledAt).toLocaleString("en-IN"),
      });
    }
  }

  const filtered = bookings.filter(
    (b: any) =>
      (hotelF === "all" || b.hotels?.slug === hotelF) &&
      (statusF === "all" || b.status === statusF),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select
          value={hotelF}
          onChange={(e) => setHotelF(e.target.value)}
          className="bg-card border border-border px-3 py-2 text-sm"
        >
          <option value="all">All Hotels</option>
          {hotels.map((h: any) => (
            <option key={h.id} value={h.slug}>
              {h.name}
            </option>
          ))}
        </select>
        <select
          value={statusF}
          onChange={(e) => setStatusF(e.target.value)}
          className="bg-card border border-border px-3 py-2 text-sm"
        >
          <option value="all">Any Status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>
              {[
                "Booking",
                "Customer",
                "Mobile",
                "Hotel",
                "Category",
                "Check-In",
                "Check-Out",
                "Total",
                "Status",
                "Actions",
              ].map((h) => (
                <th key={h} className="text-left py-4 px-4 font-normal">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="py-12 text-center text-muted-foreground">
                  No bookings
                </td>
              </tr>
            )}
            {filtered.map((b: any) => {
              const isLoading = actionLoading === b.id;
              return (
                <tr key={b.id} className="border-t border-border">
                  <td className="py-4 px-4 text-gold">{b.booking_code}</td>
                  <td className="py-4 px-4">{b.customers?.full_name}</td>
                  <td className="py-4 px-4 text-muted-foreground">{b.customers?.mobile}</td>
                  <td className="py-4 px-4">{b.hotels?.name}</td>
                  <td className="py-4 px-4">{CATEGORY_LABELS[b.category]}</td>
                  <td className="py-4 px-4">{b.check_in_date}</td>
                  <td className="py-4 px-4">{b.check_out_date}</td>
                  <td className="py-4 px-4">{formatINR(b.total_amount)}</td>
                  <td className="py-4 px-4">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
                      {b.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex gap-1 text-[10px] uppercase tracking-[0.15em] items-center">
                      {isLoading && <Loader2 className="h-3 w-3 animate-spin text-gold" />}
                      {b.status === "pending" && (
                        <button
                          disabled={isLoading}
                          onClick={() => handleConfirm(b)}
                          className="border border-gold/40 text-gold px-2 py-1 hover:bg-gold/10 disabled:opacity-40"
                        >
                          Confirm
                        </button>
                      )}
                      {b.status !== "checked_in" && (
                        <button
                          disabled={isLoading}
                          onClick={() => update(b.id, { status: "checked_in" }, "Checked in")}
                          className="border border-border px-2 py-1 hover:border-gold hover:text-gold disabled:opacity-40"
                        >
                          Check-in
                        </button>
                      )}
                      {b.status !== "checked_out" && (
                        <button
                          disabled={isLoading}
                          onClick={() => update(b.id, { status: "checked_out" }, "Checked out")}
                          className="border border-border px-2 py-1 hover:border-gold hover:text-gold disabled:opacity-40"
                        >
                          Check-out
                        </button>
                      )}
                      <button
                        disabled={isLoading}
                        onClick={() => handleCancel(b)}
                        className="border border-red-500/30 text-red-400 px-2 py-1 hover:bg-red-500/10 disabled:opacity-40"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={isLoading}
                        onClick={() =>
                          update(
                            b.id,
                            { status: "no_show", cancelled_at: new Date().toISOString() },
                            "Marked no-show",
                          )
                        }
                        className="border border-border px-2 py-1 hover:border-gold hover:text-gold disabled:opacity-40"
                      >
                        No-show
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
