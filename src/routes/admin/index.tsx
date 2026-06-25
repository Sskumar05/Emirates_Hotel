import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { BedDouble, CheckCircle2, Users, XCircle, TrendingUp } from "lucide-react";
import { formatINR, CATEGORY_LABELS } from "@/lib/hotel";
import { motion } from "framer-motion";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const [hotelFilter, setHotelFilter] = useState<string>("all");
  const today = new Date().toISOString().slice(0, 10);

  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"], queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [],
  });
  const { data: rooms = [] } = useQuery({
    queryKey: ["rooms-all"], queryFn: async () => (await supabase.from("rooms").select("*, hotels(slug)")).data ?? [],
  });
  const { data: bookings = [], refetch } = useQuery({
    queryKey: ["bookings-all"], queryFn: async () => (await supabase.from("bookings").select("*, hotels(name, slug), customers(*)").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: customers = [] } = useQuery({
    queryKey: ["customers-count"], queryFn: async () => (await supabase.from("customers").select("id", { count: "exact" })).data ?? [],
  });

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("admin-dash")
      .on("postgres_changes", { event: "*", schema: "public", table: "bookings" }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [refetch]);

  const filteredRooms = rooms.filter((r: any) => hotelFilter === "all" || r.hotels?.slug === hotelFilter);
  const occupied = filteredRooms.filter((r: any) => r.status === "occupied").length;
  const available = filteredRooms.filter((r: any) => r.status === "available").length;
  const cancelledToday = bookings.filter((b: any) =>
    (b.status === "cancelled" || b.status === "no_show") && b.cancelled_at?.slice(0, 10) === today
  ).length;

  const checkInsToday = bookings.filter((b: any) => b.check_in_date === today && (hotelFilter === "all" || b.hotels?.slug === hotelFilter));
  const checkOutsToday = bookings.filter((b: any) => b.check_out_date === today && (hotelFilter === "all" || b.hotels?.slug === hotelFilter));
  const upcoming = bookings.filter((b: any) => b.check_in_date > today && b.status !== "cancelled").slice(0, 5);

  const stats = [
    { I: BedDouble, label: "Occupied Rooms", value: occupied, accent: true },
    { I: CheckCircle2, label: "Available Rooms", value: available },
    { I: Users, label: "Total Customers", value: customers.length },
    { I: XCircle, label: "Cancelled Today", value: cancelledToday },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1">Live operations overview</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setHotelFilter("all")} className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${hotelFilter === "all" ? "border-gold text-gold bg-gold/5" : "border-border text-muted-foreground"}`}>All Hotels</button>
          {hotels.map((h: any) => (
            <button key={h.id} onClick={() => setHotelFilter(h.slug)} className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${hotelFilter === h.slug ? "border-gold text-gold bg-gold/5" : "border-border text-muted-foreground"}`}>{h.name}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className={`p-6 border bg-card ${s.accent ? "border-gold/40" : "border-border"}`}>
            <s.I className={`h-6 w-6 mb-3 ${s.accent ? "text-gold" : "text-muted-foreground"}`} />
            <div className="font-display text-4xl">{s.value}</div>
            <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-2">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Today's Check-Ins" empty="No check-ins today">
          {checkInsToday.map((b: any) => <BookingRow key={b.id} b={b} />)}
        </Panel>
        <Panel title="Today's Check-Outs" empty="No check-outs today">
          {checkOutsToday.map((b: any) => <BookingRow key={b.id} b={b} />)}
        </Panel>
      </div>

      <Panel title="Upcoming Bookings" empty="No upcoming bookings">
        {upcoming.map((b: any) => <BookingRow key={b.id} b={b} />)}
      </Panel>

      <Panel title="Recent Activity" empty="No recent activity">
        {bookings.slice(0, 5).map((b: any) => (
          <div key={b.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-4 w-4 text-gold" />
              <div>
                <div className="text-sm">New booking <span className="text-gold">{b.booking_code}</span></div>
                <div className="text-xs text-muted-foreground">{b.customers?.full_name} · {b.hotels?.name}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">{new Date(b.created_at).toLocaleString()}</div>
          </div>
        ))}
      </Panel>
    </div>
  );
}

function Panel({ title, children, empty }: { title: string; children: React.ReactNode; empty: string }) {
  const arr = Array.isArray(children) ? children : [children];
  return (
    <div className="bg-card border border-border">
      <div className="px-6 py-4 border-b border-border flex justify-between items-center">
        <h3 className="font-display text-lg">{title}</h3>
      </div>
      <div className="p-6">
        {arr.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">{empty}</p> : children}
      </div>
    </div>
  );
}

function BookingRow({ b }: { b: any }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <div className="text-sm"><span className="text-gold">{b.booking_code}</span> · {b.customers?.full_name}</div>
        <div className="text-xs text-muted-foreground">{b.hotels?.name} · {CATEGORY_LABELS[b.category]} · {b.num_rooms} room(s)</div>
      </div>
      <div className="text-right">
        <div className="text-sm">{formatINR(b.total_amount)}</div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{b.status}</div>
      </div>
    </div>
  );
}
