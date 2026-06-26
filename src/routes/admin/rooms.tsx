import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { RoomModal } from "@/components/admin/RoomModal";

export const Route = createFileRoute("/admin/rooms")({ component: AdminRooms });

function AdminRooms() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<any>(null);
  
  const [hotelF, setHotelF] = useState("all"); 
  const [catF, setCatF] = useState("all"); 
  const [statusF, setStatusF] = useState("all");

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => (await supabase.from("rooms").select("*, hotels(name, slug)").order("room_number")).data ?? [],
  });
  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"], queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [],
  });

  async function setStatus(id: string, status: "available" | "occupied" | "maintenance") {
    const { error } = await supabase.from("rooms").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { 
      toast.success("Status updated"); 
      qc.invalidateQueries({ queryKey: ["admin-rooms"] }); 
      qc.invalidateQueries({ queryKey: ["rooms"] }); 
    }
  }

  async function deleteRoom(id: string) {
    if (!confirm("Are you sure you want to delete this room?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { 
      toast.success("Room deleted"); 
      qc.invalidateQueries({ queryKey: ["admin-rooms"] }); 
      qc.invalidateQueries({ queryKey: ["rooms"] }); 
    }
  }

  const filtered = rooms.filter((r: any) =>
    (hotelF === "all" || r.hotels?.slug === hotelF) &&
    (catF === "all" || r.category === catF) &&
    (statusF === "all" || r.status === statusF));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <select value={hotelF} onChange={(e) => setHotelF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm rounded-md">
            <option value="all">All Hotels</option>
            {hotels.map((h: any) => <option key={h.id} value={h.slug}>{h.name}</option>)}
          </select>
          <select value={catF} onChange={(e) => setCatF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm rounded-md">
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={statusF} onChange={(e) => setStatusF(e.target.value)} className="bg-card border border-border px-3 py-2 text-sm rounded-md">
            <option value="all">Any Status</option>
            <option value="available">Available</option><option value="occupied">Occupied</option><option value="maintenance">Maintenance</option>
          </select>
        </div>
        <button onClick={() => { setCurrentRoom(null); setIsModalOpen(true); }} className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-semibold rounded-md shadow-sm hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" /> Add Room
        </button>
      </div>

      <div className="bg-card shadow-sm border border-border overflow-x-auto rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>{["Room", "Hotel", "Category", "Price", "Status", "Actions"].map((h) => <th key={h} className="text-left py-4 px-6 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roomsLoading ? (
              <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">Loading rooms...</td></tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">
                  {rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-4 text-base font-medium">No rooms found. The database is empty.</div>
                      <button onClick={() => { setCurrentRoom(null); setIsModalOpen(true); }} className="bg-primary text-white px-6 py-3 text-sm font-semibold rounded-md shadow-sm hover:bg-primary/90 transition-colors">Create Your First Room</button>
                    </div>
                  ) : "No rooms match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((r: any) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6 font-bold text-base text-primary">{r.room_number}</td>
                  <td className="py-4 px-6 font-medium">{r.hotels?.name}</td>
                  <td className="py-4 px-6 font-medium">{CATEGORY_LABELS[r.category]}</td>
                  <td className="py-4 px-6 font-semibold">{formatINR(r.price_per_night)}</td>
                  <td className="py-4 px-6">
                    <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value as any)} className={`px-2 py-1 rounded-md text-xs font-semibold border ${r.status === "available" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : r.status === "occupied" ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-amber-500/10 text-amber-600 border-amber-500/20"} focus:outline-none focus:ring-1 focus:ring-primary`}>
                      <option value="available" className="text-foreground bg-background">Available</option>
                      <option value="occupied" className="text-foreground bg-background">Occupied</option>
                      <option value="maintenance" className="text-foreground bg-background">Maintenance</option>
                    </select>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <button onClick={() => { setCurrentRoom(r); setIsModalOpen(true); }} className="text-muted-foreground hover:text-primary transition-colors" title="Edit Room">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => deleteRoom(r.id)} className="text-muted-foreground hover:text-red-500 transition-colors" title="Delete Room">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RoomModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          qc.invalidateQueries({ queryKey: ["admin-rooms"] });
          qc.invalidateQueries({ queryKey: ["rooms"] });
        }} 
        room={currentRoom} 
        hotels={hotels} 
      />
    </div>
  );
}
