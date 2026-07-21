import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useSendEmail } from "@/hooks/useSendEmail";
import { Loader2, Search, Eye, X, MoreVertical, XCircle, UserX, MinusSquare, FileSpreadsheet } from "lucide-react";
import { ReduceRoomsModal } from "@/components/admin/ReduceRoomsModal";
import { addDays, isoDate } from "@/lib/hotel";
import { downloadXlsx, fmtExcelDate } from "@/lib/exportExcel";

export const Route = createFileRoute("/admin/bookings")({ component: AdminBookings });

const STATUSES = ["pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
    case 'confirmed': return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    case 'checked_in': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'checked_out': return 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20';
    case 'cancelled': return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
    case 'no_show': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20';
  }
};

const getPaymentBadgeClass = (status: string) => {
  switch (status) {
    case 'paid': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'pending': return 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20';
    case 'partial': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
    case 'refunded': return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
    default: return 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20';
  }
};

const formatBadgeText = (text: string) => (text || '').replace('_', ' ');

function AdminBookings() {
  const qc = useQueryClient();
  const [hotelF, setHotelF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [viewBooking, setViewBooking] = useState<any | null>(null);
  const [reduceRoomsBooking, setReduceRoomsBooking] = useState<any | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { sendConfirmation, sendCancellation } = useSendEmail();

  function exportToExcel(filtered: any[], roomNumberMap: Record<string, string>) {
    if (filtered.length === 0) { toast.error("No data available to export."); return; }
    const resolveRooms = (ids: any) =>
      Array.isArray(ids) && ids.length > 0
        ? ids.map((id: string) => roomNumberMap[id] ?? id).filter(Boolean).join(", ")
        : "-";
    const headers = [
      "Booking ID", "Customer Name", "Mobile", "Hotel", "Room Category",
      "Room Number(s)", "Guests", "Check-In", "Check-Out", "Stay Type",
      "Booking Status", "Payment Status", "Amount", "Created Date",
    ];
    const rows = filtered.map((b: any) => [
      b.booking_code,
      b.customers?.full_name ?? "-",
      b.customers?.mobile ?? "-",
      b.hotels?.name ?? "-",
      CATEGORY_LABELS[b.category as keyof typeof CATEGORY_LABELS] ?? b.category,
      resolveRooms(b.assigned_room_ids),
      b.num_guests,
      fmtExcelDate(b.check_in_date),
      fmtExcelDate(b.check_out_date),
      b.stay_type === "12_hours" ? "12 Hours" : "Standard",
      (b.status ?? "").replace("_", " "),
      (b.payment_status ?? "").replace("_", " "),
      formatINR(b.total_amount),
      fmtExcelDate(b.created_at),
    ]);
    downloadXlsx([headers, ...rows], "Bookings", `Bookings_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast.success("Excel exported successfully.");
  }

  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [],
  });

  const { data: allRooms = [] } = useQuery({
    queryKey: ["all-rooms"],
    queryFn: async () => (await supabase.from("rooms").select("id, room_number")).data ?? [],
  });

  const roomNumberMap = useMemo(() => {
    const map: Record<string, string> = {};
    allRooms.forEach((r: any) => {
      map[r.id] = r.room_number;
    });
    return map;
  }, [allRooms]);

  const resolveRoomNumbers = (roomIds: any, status: string) => {
    if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
      return status === "pending" ? "Not Assigned" : "-";
    }
    const resolved = roomIds
      .map((id: string) => roomNumberMap[id])
      .filter(Boolean); // Only keep strings that successfully resolved
    
    if (resolved.length === 0) {
      return status === "pending" ? "Not Assigned" : "-";
    }
    
    return resolved.join(", ");
  };

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () =>
      (
        await supabase
          .from("bookings")
          .select("*, hotels(name, slug), customers(*)")
          .not("status", "in", "(cancelled,no_show)")
          .order("created_at", { ascending: false })
      ).data ?? [],
  });

  async function update(id: string, patch: Record<string, unknown>, msg: string) {
    setActionLoading(id);
    try {
      console.log("[admin/bookings] BEFORE bookings.update — id:", id, "patch:", patch);
      const { error } = await supabase.from("bookings").update(patch).eq("id", id);
      if (error) {
        console.error("[admin/bookings] AFTER bookings.update — ERROR:", error.message);
        toast.error(error.message);
      } else {
        console.log("[admin/bookings] AFTER bookings.update — SUCCESS:", msg, "patch:", patch);
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
        roomType: CATEGORY_LABELS[b.category as keyof typeof CATEGORY_LABELS] ?? b.category,
        roomNumbers: resolveRoomNumbers(b.assigned_room_ids, b.status),
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
        roomType: CATEGORY_LABELS[b.category as keyof typeof CATEGORY_LABELS] ?? b.category,
        checkIn: b.check_in_date,
        checkOut: b.check_out_date,
        totalAmount: formatINR(b.total_amount),
        reason: "Cancelled by admin",
        cancelledAt: new Date(cancelledAt).toLocaleString("en-IN"),
      });
    }
  }

  const filtered = useMemo(() => {
    return bookings.filter((b: any) => {
      const matchHotel = hotelF === "all" || b.hotels?.slug === hotelF;
      const matchStatus = statusF === "all" || b.status === statusF;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (b.booking_code || "").toLowerCase().includes(q) ||
        (b.customers?.full_name || "").toLowerCase().includes(q) ||
        (b.customers?.mobile || "").toLowerCase().includes(q);

      return matchHotel && matchStatus && matchSearch;
    });
  }, [bookings, hotelF, statusF, searchQuery]);

  return (
    <div className="flex flex-col space-y-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)]">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select
            value={hotelF}
            onChange={(e) => setHotelF(e.target.value)}
            className="bg-card border border-border px-4 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
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
            className="bg-card border border-border px-4 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
          >
            <option value="all">Any Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {formatBadgeText(s).charAt(0).toUpperCase() + formatBadgeText(s).slice(1)}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search ID, Name, Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border pl-9 pr-4 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>
          <button
            onClick={() => exportToExcel(filtered, roomNumberMap)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold rounded-md shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export Excel
          </button>
        </div>
      </div>

      <div className="bg-card border border-border overflow-auto rounded-lg shadow-sm flex-1 min-h-0 custom-scrollbar">
        <table className="w-full text-sm relative">
          <thead className="sticky top-0 z-20 bg-surface text-xs uppercase tracking-wider text-muted-foreground font-semibold shadow-[0_1px_0_0_var(--border)]">
            <tr>
              {[
                "Booking ID",
                "Customer",
                "Mobile",
                "Hotel",
                "Category",
                "Room(s)",
                "Qty",
                "Check-In",
                "Check-Out",
                "Total",
                "Payment",
                "Status",
                "Actions",
              ].map((h) => (
                <th key={h} className="text-left py-4 px-4 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} className="py-12 text-center text-muted-foreground">
                  No bookings found matching your criteria.
                </td>
              </tr>
            )}
            {filtered.map((b: any) => {
              const isLoading = actionLoading === b.id;
              const roomsDisplay = resolveRoomNumbers(b.assigned_room_ids, b.status);

              return (
                <tr key={b.id} className="hover:bg-surface/30 transition-colors">
                  <td className="py-3 px-4 text-gold font-medium whitespace-nowrap">{b.booking_code}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{b.customers?.full_name}</td>
                  <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{b.customers?.mobile}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{b.hotels?.name}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{CATEGORY_LABELS[b.category as keyof typeof CATEGORY_LABELS]}</td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium text-muted-foreground">{roomsDisplay}</td>
                  <td className="py-3 px-4 text-center whitespace-nowrap">{b.num_rooms}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{b.check_in_date}</td>
                  <td className="py-3 px-4 whitespace-nowrap">{b.check_out_date}</td>
                  <td className="py-3 px-4 whitespace-nowrap font-medium">{formatINR(b.total_amount)}</td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full ${getPaymentBadgeClass(b.payment_status)}`}>
                      {formatBadgeText(b.payment_status || "pending")}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold rounded-full ${getStatusBadgeClass(b.status)}`}>
                      {formatBadgeText(b.status)}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex gap-2 text-[11px] uppercase tracking-wider items-center font-semibold">
                      {isLoading && <Loader2 className="h-4 w-4 animate-spin text-gold shrink-0" />}
                      
                      {b.status === "pending" && (
                        <button
                          disabled={isLoading}
                          onClick={() => handleConfirm(b)}
                          className="bg-gold/10 text-gold px-3 py-1.5 rounded hover:bg-gold/20 transition-colors disabled:opacity-40 whitespace-nowrap"
                        >
                          Confirm
                        </button>
                      )}

                      {b.status === "confirmed" && (
                        <button
                          disabled={isLoading}
                          onClick={() => update(b.id, { status: "checked_in" }, "Checked in")}
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded hover:bg-emerald-500/20 transition-colors disabled:opacity-40 whitespace-nowrap"
                        >
                          Check-In
                        </button>
                      )}

                      {b.status === "checked_in" && (
                        <button
                          disabled={isLoading}
                          onClick={() => update(b.id, { status: "checked_out" }, "Checked out")}
                          className="bg-slate-500/10 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded hover:bg-slate-500/20 transition-colors disabled:opacity-40 whitespace-nowrap"
                        >
                          Check-Out
                        </button>
                      )}

                      {(b.status === "checked_out" || b.status === "cancelled" || b.status === "no_show") && (
                        <button
                          onClick={() => setViewBooking(b)}
                          className="flex items-center gap-1.5 bg-surface/50 text-foreground border border-border px-3 py-1.5 rounded hover:border-gold hover:text-gold transition-colors whitespace-nowrap"
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                      )}

                      {(b.status === "pending" || b.status === "confirmed" || b.status === "checked_in") && (
                        <div className="relative">
                          <button
                            onClick={() => setOpenDropdown(openDropdown === b.id ? null : b.id)}
                            className="p-1.5 rounded hover:bg-surface border border-transparent hover:border-border transition-colors text-muted-foreground"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          
                          {openDropdown === b.id && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => setOpenDropdown(null)} />
                              <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-lg shadow-lg z-50 py-1 flex flex-col font-normal normal-case tracking-normal">
                                <button
                                  onClick={() => { setViewBooking(b); setOpenDropdown(null); }}
                                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-surface flex items-center gap-2.5 transition-colors text-foreground"
                                >
                                  <Eye className="h-4 w-4 text-muted-foreground" />
                                  View Details
                                </button>
                                
                                {b.status === "pending" && (
                                  <button
                                    disabled={isLoading}
                                    onClick={() => { handleCancel(b); setOpenDropdown(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 flex items-center gap-2.5 transition-colors text-red-500 disabled:opacity-40"
                                  >
                                    <XCircle className="h-4 w-4 shrink-0" />
                                    Cancel Booking
                                  </button>
                                )}
                                
                                {(b.status === "confirmed" || b.status === "checked_in") && b.num_rooms > 1 && (
                                  <button
                                    onClick={() => { setReduceRoomsBooking(b); setOpenDropdown(null); }}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-orange-500/10 flex items-center gap-2.5 transition-colors text-orange-500"
                                  >
                                    <MinusSquare className="h-4 w-4 shrink-0" />
                                    Reduce Rooms
                                  </button>
                                )}
                                
                                {b.status === "confirmed" && (
                                  <>
                                    <button
                                      disabled={isLoading}
                                      onClick={() => { handleCancel(b); setOpenDropdown(null); }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-red-500/10 flex items-center gap-2.5 transition-colors text-red-500 disabled:opacity-40"
                                    >
                                      <XCircle className="h-4 w-4 shrink-0" />
                                      Cancel Booking
                                    </button>
                                    <button
                                      disabled={isLoading}
                                      onClick={() => {
                                        update(
                                          b.id,
                                          { status: "no_show", cancelled_at: new Date().toISOString() },
                                          "Marked no-show"
                                        );
                                        setOpenDropdown(null);
                                      }}
                                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors text-rose-500 disabled:opacity-40"
                                    >
                                      <UserX className="h-4 w-4 shrink-0" />
                                      Mark as No-Show
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Reduce Rooms Modal */}
      {reduceRoomsBooking && (
        <ReduceRoomsModal
          isOpen={!!reduceRoomsBooking}
          onClose={() => setReduceRoomsBooking(null)}
          onSuccess={() => {
            setReduceRoomsBooking(null);
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
            qc.invalidateQueries({ queryKey: ["all-rooms"] });
            qc.invalidateQueries({ queryKey: ["room-modal-occupancy"] });
          }}
          booking={reduceRoomsBooking}
          roomNumberMap={roomNumberMap}
        />
      )}

      {/* View Booking Modal */}
      {viewBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-3xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-3">
                Booking Details
                <span className="text-sm font-normal text-gold bg-gold/10 px-3 py-1 rounded-full">
                  {viewBooking.booking_code}
                </span>
              </h2>
              <button
                onClick={() => setViewBooking(null)}
                className="p-2 hover:bg-surface rounded-full transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Customer Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="font-medium">{viewBooking.customers?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Mobile:</span>
                      <span className="font-medium">{viewBooking.customers?.mobile}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{viewBooking.customers?.email || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ID Proof:</span>
                      <span className="font-medium">{viewBooking.customers?.id_proof_number || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Reservation Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    Reservation Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hotel:</span>
                      <span className="font-medium text-gold">{viewBooking.hotels?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Room Category:</span>
                      <span className="font-medium">{CATEGORY_LABELS[viewBooking.category as keyof typeof CATEGORY_LABELS] || viewBooking.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full ${getStatusBadgeClass(viewBooking.status)}`}>
                        {formatBadgeText(viewBooking.status)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stay Mode:</span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full ${viewBooking.stay_type === '12_hours' ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20' : 'bg-surface border border-border text-foreground'}`}>
                        {viewBooking.stay_type === '12_hours' ? '12 Hours Stay' : 'Standard Stay'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Booking Date:</span>
                      <span className="font-medium">{new Date(viewBooking.created_at).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Stay Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    Stay Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-In:</span>
                      <span className="font-medium">{viewBooking.check_in_date} {viewBooking.check_in_time ? `· ${viewBooking.check_in_time}` : ''}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Check-Out:</span>
                      <span className="font-medium">
                        {viewBooking.check_out_date}
                        {viewBooking.stay_type === '12_hours' && viewBooking.check_in_time ? (() => {
                           const d = new Date(`${viewBooking.check_in_date}T${viewBooking.check_in_time}:00`);
                           d.setHours(d.getHours() + 12);
                           return ` · ${d.toTimeString().slice(0, 5)}`;
                        })() : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="font-medium">{viewBooking.stay_type === '12_hours' ? '12 Hours' : `${viewBooking.num_days} Night(s)`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Guests:</span>
                      <span className="font-medium">{viewBooking.num_guests} Guest(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rooms Booked:</span>
                      <span className="font-medium">{viewBooking.num_rooms} Room(s)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Assigned Room(s):</span>
                      <span className="font-semibold bg-surface px-2 py-1 rounded">
                        {resolveRoomNumbers(viewBooking.assigned_room_ids, viewBooking.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground border-b border-border pb-2">
                    Payment Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-semibold text-lg">{formatINR(viewBooking.total_amount)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Payment Status:</span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase tracking-wider font-semibold rounded-full ${getPaymentBadgeClass(viewBooking.payment_status)}`}>
                        {formatBadgeText(viewBooking.payment_status || 'pending')}
                      </span>
                    </div>
                    {viewBooking.payment_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction ID:</span>
                        <span className="font-mono text-xs">{viewBooking.payment_id}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setViewBooking(null)}
                className="px-6 py-2 bg-surface hover:bg-surface/80 text-foreground rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
