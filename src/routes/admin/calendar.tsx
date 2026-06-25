import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/admin/calendar")({ component: CalendarPage });

function CalendarPage() {
  const [hotelF, setHotelF] = useState("all");
  const [view, setView] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState(new Date());

  const { data: hotels = [] } = useQuery({ queryKey: ["hotels"], queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [] });
  const { data: rooms = [] } = useQuery({ queryKey: ["calendar-rooms"], queryFn: async () => (await supabase.from("rooms").select("*, hotels(slug)")).data ?? [] });
  const { data: bookings = [] } = useQuery({ queryKey: ["calendar-bookings"], queryFn: async () => (await supabase.from("bookings").select("*, hotels(slug)").in("status", ["confirmed", "checked_in"])).data ?? [] });

  const filteredRooms = rooms.filter((r: any) => hotelF === "all" || r.hotels?.slug === hotelF);
  const occupied = (date: string) => {
    return bookings.filter((b: any) =>
      (hotelF === "all" || b.hotels?.slug === hotelF) && b.check_in_date <= date && b.check_out_date > date
    ).reduce((sum: number, b: any) => sum + (b.num_rooms ?? 1), 0);
  };

  const start = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const firstDow = start.getDay();
  const days: { date: string; day: number }[] = [];
  for (let i = 0; i < firstDow; i++) days.push({ date: "", day: 0 });
  for (let d = 1; d <= daysInMonth; d++) {
    const dt = new Date(cursor.getFullYear(), cursor.getMonth(), d);
    days.push({ date: dt.toISOString().slice(0, 10), day: d });
  }
  if (view === "week") {
    const today = new Date();
    const wk: { date: string; day: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const dt = new Date(today); dt.setDate(today.getDate() - today.getDay() + i);
      wk.push({ date: dt.toISOString().slice(0, 10), day: dt.getDate() });
    }
    days.length = 0; days.push(...wk);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <button onClick={() => setHotelF("all")} className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${hotelF === "all" ? "border-gold text-gold bg-gold/5" : "border-border text-muted-foreground"}`}>All</button>
          {hotels.map((h: any) => (
            <button key={h.id} onClick={() => setHotelF(h.slug)} className={`px-4 py-2 text-xs uppercase tracking-[0.2em] border ${hotelF === h.slug ? "border-gold text-gold bg-gold/5" : "border-border text-muted-foreground"}`}>{h.name}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setView("month")} className={`px-3 py-1.5 text-xs uppercase ${view === "month" ? "text-gold" : "text-muted-foreground"}`}>Month</button>
          <button onClick={() => setView("week")} className={`px-3 py-1.5 text-xs uppercase ${view === "week" ? "text-gold" : "text-muted-foreground"}`}>Week</button>
          {view === "month" && (
            <>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="border border-border px-3 py-1.5">‹</button>
              <span className="text-sm">{cursor.toLocaleDateString("en", { month: "long", year: "numeric" })}</span>
              <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="border border-border px-3 py-1.5">›</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="text-center uppercase tracking-[0.2em] text-muted-foreground py-2">{d}</div>)}
        {days.map((d, i) => {
          if (!d.date) return <div key={i} />;
          const occ = occupied(d.date);
          const pct = filteredRooms.length ? Math.min(100, (occ / filteredRooms.length) * 100) : 0;
          const color = pct === 0 ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300" : pct >= 80 ? "bg-red-500/15 border-red-500/30 text-red-300" : "bg-amber-500/15 border-amber-500/30 text-amber-300";
          return (
            <div key={i} className={`min-h-20 border p-2 ${color}`}>
              <div className="text-sm font-display">{d.day}</div>
              <div className="text-[10px] mt-1 uppercase tracking-[0.15em] opacity-80">{occ}/{filteredRooms.length} booked</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-emerald-500/30 border border-emerald-500/50 inline-block" /> Available</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-amber-500/30 border border-amber-500/50 inline-block" /> Partial</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 bg-red-500/30 border border-red-500/50 inline-block" /> Booked</span>
      </div>
    </div>
  );
}
