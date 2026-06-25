import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState } from "react";
import { Pencil, Save, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/rooms")({ component: AdminRooms });

function AdminRooms() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [hotelF, setHotelF] = useState("all"); const [catF, setCatF] = useState("all"); const [statusF, setStatusF] = useState("all");

  const { data: rooms = [] } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => (await supabase.from("rooms").select("*, hotels(name, slug)").order("room_number")).data ?? [],
  });
  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"], queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [],
  });

  async function savePrice(id: string) {
    const { error } = await supabase.from("rooms").update({ price_per_night: Number(editPrice) }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Price updated"); setEditingId(null); qc.invalidateQueries({ queryKey: ["admin-rooms"] }); }
  }
  async function setStatus(id: string, status: "available" | "occupied" | "maintenance") {
    const { error } = await supabase.from("rooms").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["admin-rooms"] }); }
  }

  const filtered = rooms.filter((r: any) =>
    (hotelF === "all" || r.hotels?.slug === hotelF) &&
    (catF === "all" || r.category === catF) &&
    (statusF === "all" || r.status === statusF));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select value={hotelF} onChange={(e) => setHotelF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm">
          <option value="all">All Hotels</option>
          {hotels.map((h: any) => <option key={h.id} value={h.slug}>{h.name}</option>)}
        </select>
        <select value={catF} onChange={(e) => setCatF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm">
          <option value="all">All Categories</option>
          {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm">
          <option value="all">Any Status</option>
          <option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option>
        </select>
      </div>

      <div className="bg-card border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <tr>{["Room", "Hotel", "Category", "Price", "Status", "Actions"].map((h) => <th key={h} className="text-left py-4 px-4 font-normal">{h}</th>)}</tr>
          </thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.id} className="border-t border-border">
                <td className="py-4 px-4 font-display text-base text-gold">{r.room_number}</td>
                <td className="py-4 px-4">{r.hotels?.name}</td>
                <td className="py-4 px-4">{CATEGORY_LABELS[r.category]}</td>
                <td className="py-4 px-4">
                  {editingId === r.id ? (
                    <div className="flex gap-1">
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} className="w-24 bg-background border border-gold px-2 py-1 text-sm" />
                      <button onClick={() => savePrice(r.id)} className="text-gold"><Save className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingId(r.id); setEditPrice(String(r.price_per_night)); }} className="flex items-center gap-2 hover:text-gold">
                      {formatINR(r.price_per_night)} <Pencil className="h-3 w-3 opacity-50" />
                    </button>
                  )}
                </td>
                <td className="py-4 px-4">
                  <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] ${r.status === "available" ? "bg-emerald-500/10 text-emerald-400" : r.status === "occupied" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>{r.status}</span>
                </td>
                <td className="py-4 px-4">
                  <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value as any)} className="bg-background border border-border px-2 py-1 text-xs">
                    <option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
