import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { Search, Eye, X, Calendar, User, FileText, Activity, MapPin, Hash, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/audit-logs")({ component: AuditLogs });

// ─── Helpers ───────────────────────────────────────────────────────────────────

const formatDateTime = (iso?: string) => {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  return { date, time };
};

const getModule = (entityType: string): string => {
  const map: Record<string, string> = {
    booking: "Booking",
    room: "Room",
    customer: "Customer",
    payment: "Payment",
    email: "Email",
    invoice: "Invoice",
    system: "System",
  };
  return map[entityType?.toLowerCase()] ?? entityType ?? "System";
};

const getActionLabel = (action: string): string => {
  const map: Record<string, string> = {
    booking_created: "Booking Created",
    booking_updated: "Booking Updated",
    booking_confirmed: "Booking Confirmed",
    booking_cancelled: "Booking Cancelled",
    booking_checked_in: "Customer Checked In",
    booking_checked_out: "Customer Checked Out",
    booking_no_show: "No Show",
    booking_rooms_reduced: "Booking Modified",
    room_assigned: "Room Assigned",
    room_changed: "Room Changed",
    room_created: "Room Created",
    room_deleted: "Room Deleted",
    room_status_changed: "Room Updated",
    payment_received: "Payment Received",
    payment_refunded: "Payment Refunded",
    email_sent: "Email Sent",
    confirmation_email_sent: "Booking Confirmation Email Sent",
    cancellation_email_sent: "Cancellation Email Sent",
    invoice_generated: "Invoice Generated",
    invoice_downloaded: "Invoice Downloaded",
    invoice_emailed: "Invoice Emailed",
    login: "User Login",
    logout: "User Logout",
    settings_updated: "Settings Updated",
  };
  return map[action?.toLowerCase()] ?? (action ?? "Unknown Activity").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

const getDescription = (log: any): string => {
  const action = (log.action ?? "").toLowerCase();
  const nv = log.new_value ?? {};
  const entityId = log.entity_id ?? "";

  if (action === "booking_created") {
    const name = nv.customer_name || "customer";
    const code = nv.booking_code || entityId;
    return `Booking ${code} created for ${name}.`;
  }
  if (action === "booking_checked_in") {
    return `Customer checked into Room ${nv.room_number || "assigned room"}.`;
  }
  if (action === "invoice_generated") {
    return `Invoice ${nv.invoice_number || entityId} generated.`;
  }
  if (action === "payment_received") {
    return `Payment of ₹${nv.amount?.toLocaleString() || ""} received.`;
  }
  if (action.includes("cancel")) {
    const by = log.actor_email ? "Admin" : "System";
    return `Booking cancelled by ${by}.`;
  }
  if (action.includes("room_status_changed") || action.includes("maintenance")) {
    const status = nv.status || "Updated";
    return `Room ${nv.room_number || entityId} marked as ${status}.`;
  }
  if (action === "login") return `User ${log.actor_email ?? ""} logged in.`;
  if (action === "logout") return `User ${log.actor_email ?? ""} logged out.`;
  
  if (log.notes) return log.notes;
  return `${getActionLabel(action)} (ID: ${entityId}).`;
};

const getStatus = (log: any): "success" | "failed" | "warning" | "info" => {
  const action = (log.action ?? "").toLowerCase();
  if (action.includes("failed") || action.includes("error")) return "failed";
  if (action.includes("cancel") || action.includes("no_show") || action.includes("refund") || action.includes("deleted")) return "warning";
  if (action.includes("email") || action.includes("login") || action.includes("logout") || action.includes("invoice") || action.includes("system")) return "info";
  return "success";
};

const STATUS_CONFIG = {
  success: {
    color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
    icon: CheckCircle,
    label: "Success",
  },
  failed: {
    color: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/30",
    icon: XCircle,
    label: "Failed",
  },
  warning: {
    color: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30",
    icon: AlertTriangle,
    label: "Warning",
  },
  info: {
    color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30",
    icon: Info,
    label: "Info",
  },
};

const MODULE_ICONS: Record<string, any> = {
  Booking: Calendar,
  Room: MapPin,
  Customer: User,
  Payment: Hash,
  Email: Info,
  Invoice: FileText,
  System: Activity,
};

const MODULE_OPTIONS = ["Booking", "Room", "Customer", "Payment", "Invoice", "Email", "System", "Authentication"];
const STATUS_OPTIONS = ["success", "failed", "warning", "info"];

// ─── Component ─────────────────────────────────────────────────────────────────

function AuditLogs() {
  const [q, setQ] = useState("");
  const [moduleF, setModuleF] = useState("all");
  const [userF, setUserF] = useState("all");
  const [statusF, setStatusF] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [viewLog, setViewLog] = useState<any | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["audit"],
    queryFn: async () =>
      (await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [],
  });

  const actors = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l: any) => set.add(l.actor_email ?? "System"));
    return Array.from(set).slice(0, 20);
  }, [logs]);

  const enriched = useMemo(() => logs.map((l: any) => {
    const moduleName = getModule(l.entity_type);
    const actionLabel = getActionLabel(l.action);
    const description = getDescription(l);
    const status = getStatus(l);
    
    const nv = l.new_value ?? {};
    const bookingId = nv.booking_code || (l.entity_type === 'booking' ? l.entity_id : null);
    const roomNumber = nv.room_number || (l.entity_type === 'room' ? l.entity_id : null);
    const customer = nv.customer_name || null;
    const invoiceNumber = nv.invoice_number || (l.entity_type === 'invoice' ? l.entity_id : null);
    
    return {
      ...l,
      _module: moduleName,
      _action: actionLabel,
      _description: description,
      _status: status,
      _actor: l.actor_email ?? "System",
      _bookingId: bookingId,
      _roomNumber: roomNumber,
      _customer: customer,
      _invoiceNumber: invoiceNumber,
      _hotel: nv.hotel_name || null,
    };
  }), [logs]);

  const filtered = useMemo(() => {
    setCurrentPage(1); 
    return enriched.filter((l: any) => {
      const searchStr = `${l._action} ${l._description} ${l.entity_id} ${l._actor} ${l._bookingId || ""} ${l._invoiceNumber || ""} ${l._customer || ""} ${l._roomNumber || ""}`.toLowerCase();
      const queryMatch = !q || searchStr.includes(q.toLowerCase());
      const modMatch = moduleF === "all" || l._module === moduleF;
      const userMatch = userF === "all" || l._actor === userF;
      const statusMatch = statusF === "all" || l._status === statusF;
      let dateMatch = true;
      if (dateFrom || dateTo) {
        const d = l.created_at ? l.created_at.slice(0, 10) : "";
        if (dateFrom && d < dateFrom) dateMatch = false;
        if (dateTo && d > dateTo) dateMatch = false;
      }
      return queryMatch && modMatch && userMatch && statusMatch && dateMatch;
    });
  }, [enriched, q, moduleF, userF, statusF, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedLogs = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="flex flex-col space-y-6 h-[calc(100vh-8rem)] lg:h-[calc(100vh-10rem)]">
      {/* ── Header & Filters ── */}
      <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between shrink-0">
        <div className="flex flex-wrap gap-3 w-full xl:w-auto items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID, name, activity..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-64 bg-background border border-input pl-9 pr-4 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
            />
          </div>
          
          <select
            value={moduleF}
            onChange={(e) => setModuleF(e.target.value)}
            className="bg-background border border-input px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            <option value="all">All Modules</option>
            {MODULE_OPTIONS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          
          <select
            value={statusF}
            onChange={(e) => setStatusF(e.target.value)}
            className="bg-background border border-input px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            <option value="all">Any Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s as keyof typeof STATUS_CONFIG].label}</option>)}
          </select>

          <select
            value={userF}
            onChange={(e) => setUserF(e.target.value)}
            className="bg-background border border-input px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
          >
            <option value="all">All Users</option>
            {actors.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          
          <div className="flex items-center gap-2 bg-background border border-input rounded-md px-3 py-1 shadow-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-foreground"
            />
            <span className="text-muted-foreground text-sm">-</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none text-sm focus:outline-none focus:ring-0 text-foreground"
            />
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-card border border-border overflow-hidden rounded-xl shadow-sm flex-1 flex flex-col min-h-0">
        <div className="overflow-auto flex-1 custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead className="sticky top-0 z-10 bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold shadow-sm backdrop-blur-md">
              <tr>
                <th className="py-4 px-6 whitespace-nowrap">Date &amp; Time</th>
                <th className="py-4 px-6 whitespace-nowrap">User</th>
                <th className="py-4 px-6 whitespace-nowrap">Module</th>
                <th className="py-4 px-6 whitespace-nowrap">Activity &amp; Description</th>
                <th className="py-4 px-6 whitespace-nowrap text-center">Status</th>
                <th className="py-4 px-6 whitespace-nowrap text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-24 mb-2"></div><div className="h-3 bg-muted rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-6 bg-muted rounded-full w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-muted rounded w-48 mb-2"></div><div className="h-3 bg-muted rounded w-64"></div></td>
                    <td className="py-4 px-6 text-center"><div className="h-6 bg-muted rounded-full w-24 mx-auto"></div></td>
                    <td className="py-4 px-6 text-right"><div className="h-8 bg-muted rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <Activity className="h-12 w-12 mb-4 opacity-20" />
                      <p className="text-base font-medium">No activity logs found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or search term.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((l: any) => {
                  const { date, time } = formatDateTime(l.created_at);
                  const statusConf = STATUS_CONFIG[l._status as keyof typeof STATUS_CONFIG];
                  const StatusIcon = statusConf.icon;
                  const ModIcon = MODULE_ICONS[l._module] || Activity;
                  
                  return (
                    <tr key={l.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="font-medium text-foreground">{date}</div>
                        <div className="text-xs text-muted-foreground">{time}</div>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-3.5 w-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-medium">{l._actor.split('@')[0]}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-muted text-foreground px-2.5 py-1 rounded-md border border-border">
                          <ModIcon className="h-3.5 w-3.5" />
                          {l._module}
                        </span>
                      </td>
                      <td className="py-3 px-6">
                        <div className="font-semibold text-foreground mb-0.5">{l._action}</div>
                        <div className="text-sm text-muted-foreground line-clamp-1 group-hover:text-foreground transition-colors" title={l._description}>
                          {l._description}
                        </div>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 text-[11px] uppercase tracking-wider font-bold rounded-full ${statusConf.color}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-3 px-6 whitespace-nowrap text-right">
                        <button
                          onClick={() => setViewLog(l)}
                          className="inline-flex items-center justify-center gap-2 bg-background border border-input shadow-sm text-foreground px-3 py-1.5 rounded-md text-xs font-medium hover:bg-muted hover:text-primary transition-all"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border p-4 bg-muted/20 flex items-center justify-between shrink-0">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} entries
            </span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
                className="px-3 py-1.5 text-sm bg-background border border-input rounded-md disabled:opacity-50 hover:bg-muted"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
                className="px-3 py-1.5 text-sm bg-background border border-input rounded-md disabled:opacity-50 hover:bg-muted"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Right-Side Details Drawer ── */}
      {viewLog && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div 
            className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setViewLog(null)}
          />
          
          <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between p-6 border-b border-border bg-muted/30">
              <div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">Activity Details</h2>
                <p className="text-sm text-muted-foreground mt-1 font-medium">{viewLog._action}</p>
              </div>
              <button
                onClick={() => setViewLog(null)}
                className="p-2 bg-background border border-input hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-8">
              {/* Status Header */}
              <div className={`p-4 rounded-xl border flex items-start gap-4 ${STATUS_CONFIG[viewLog._status as keyof typeof STATUS_CONFIG].color.replace('text-', 'text-').replace('bg-', 'bg-').split(' ')[0]} ${STATUS_CONFIG[viewLog._status as keyof typeof STATUS_CONFIG].color.replace('border-', 'border-').split(' ')[2]}`}>
                <div className="mt-0.5">
                  {(() => {
                    const SIcon = STATUS_CONFIG[viewLog._status as keyof typeof STATUS_CONFIG].icon;
                    return <SIcon className="h-6 w-6" />;
                  })()}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{STATUS_CONFIG[viewLog._status as keyof typeof STATUS_CONFIG].label}</h3>
                  <p className="text-sm opacity-90">{viewLog._description}</p>
                </div>
              </div>

              {/* Core Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">General Info</h4>
                <div className="bg-muted/30 border border-border rounded-xl divide-y divide-border">
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-sm text-muted-foreground">Date &amp; Time</span>
                    <span className="text-sm font-medium text-foreground text-right">
                      {formatDateTime(viewLog.created_at).date} at {formatDateTime(viewLog.created_at).time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-sm text-muted-foreground">User</span>
                    <span className="text-sm font-medium text-foreground text-right">{viewLog._actor}</span>
                  </div>
                  <div className="flex items-center justify-between p-3.5">
                    <span className="text-sm text-muted-foreground">Module</span>
                    <span className="text-sm font-medium text-foreground text-right">{viewLog._module}</span>
                  </div>
                </div>
              </div>

              {/* Business Data */}
              {(viewLog._bookingId || viewLog._customer || viewLog._roomNumber || viewLog._invoiceNumber || viewLog._hotel) && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Business Details</h4>
                  <div className="bg-muted/30 border border-border rounded-xl divide-y divide-border">
                    {viewLog._hotel && (
                      <div className="flex items-center justify-between p-3.5">
                        <span className="text-sm text-muted-foreground">Hotel</span>
                        <span className="text-sm font-medium text-foreground text-right">{viewLog._hotel}</span>
                      </div>
                    )}
                    {viewLog._bookingId && (
                      <div className="flex items-center justify-between p-3.5">
                        <span className="text-sm text-muted-foreground">Booking ID</span>
                        <span className="text-sm font-medium text-foreground text-right font-mono">{viewLog._bookingId}</span>
                      </div>
                    )}
                    {viewLog._customer && (
                      <div className="flex items-center justify-between p-3.5">
                        <span className="text-sm text-muted-foreground">Customer</span>
                        <span className="text-sm font-medium text-foreground text-right">{viewLog._customer}</span>
                      </div>
                    )}
                    {viewLog._roomNumber && (
                      <div className="flex items-center justify-between p-3.5">
                        <span className="text-sm text-muted-foreground">Room Number</span>
                        <span className="text-sm font-medium text-foreground text-right">{viewLog._roomNumber}</span>
                      </div>
                    )}
                    {viewLog._invoiceNumber && (
                      <div className="flex items-center justify-between p-3.5">
                        <span className="text-sm text-muted-foreground">Invoice Number</span>
                        <span className="text-sm font-medium text-foreground text-right font-mono">{viewLog._invoiceNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-card">
              <button
                onClick={() => setViewLog(null)}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
