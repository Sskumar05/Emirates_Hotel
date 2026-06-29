import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState, useMemo } from "react";
import { Pencil, Trash2, Plus, Users, BedDouble, List } from "lucide-react";
import { toast } from "sonner";
import { CategoryModal } from "@/components/admin/CategoryModal";
import { RoomNumbersModal } from "@/components/admin/RoomNumbersModal";

export const Route = createFileRoute("/admin/rooms")({ component: AdminRooms });

function AdminRooms() {
  const qc = useQueryClient();

  // Modal open state
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRoomNumbersModalOpen, setIsRoomNumbersModalOpen] = useState(false);

  // Separate state per modal — prevents state collision
  const [editGroup, setEditGroup] = useState<any>(null);      // for CategoryModal (edit mode)
  const [numbersGroup, setNumbersGroup] = useState<any>(null); // for RoomNumbersModal

  // Filters
  const [hotelF, setHotelF] = useState("all");
  const [catF, setCatF] = useState("all");

  const { data: rooms = [], isLoading: roomsLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () =>
      (await supabase.from("rooms").select("*, hotels(name, slug)").order("room_number")).data ?? [],
  });

  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [],
  });

  // Group rooms by hotel+category — each group appears exactly once
  const groupedCategories = useMemo(() => {
    const filtered = rooms.filter(
      (r: any) =>
        (hotelF === "all" || r.hotels?.slug === hotelF) &&
        (catF === "all" || r.category === catF)
    );

    const map: Record<string, any> = {};
    for (const r of filtered) {
      const key = `${r.hotel_id}__${r.category}`;
      if (!map[key]) {
        map[key] = {
          hotel_id: r.hotel_id,
          hotel_name: r.hotels?.name ?? "",
          category: r.category,
          price_per_night: r.price_per_night,
          max_guests: r.max_guests,
          bed_type: r.bed_type ?? "",
          template: r, // one room row as the canonical source for category fields
          rooms: [],
        };
      }
      map[key].rooms.push(r);
    }
    return Object.values(map);
  }, [rooms, hotelF, catF]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["admin-rooms"] });
    qc.invalidateQueries({ queryKey: ["rooms"] });
  }

  async function deleteCategory(g: any) {
    const label = CATEGORY_LABELS[g.category as keyof typeof CATEGORY_LABELS] ?? g.category;
    if (!confirm(`Delete ALL ${g.rooms.length} room(s) in "${label}" for ${g.hotel_name}?\n\nThis cannot be undone.`)) return;

    const { error } = await supabase
      .from("rooms")
      .delete()
      .eq("hotel_id", g.hotel_id)
      .eq("category", g.category);

    if (error) toast.error(error.message);
    else { toast.success("Category deleted"); invalidate(); }
  }

  const statusBadge = (rooms: any[]) => {
    const avail = rooms.filter((r) => r.status === "available").length;
    const occ = rooms.filter((r) => r.status === "occupied").length;
    const maint = rooms.filter((r) => r.status === "maintenance").length;
    return (
      <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
        {avail > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
            {avail} Available
          </span>
        )}
        {occ > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-red-500/15 text-red-600 border border-red-500/20">
            {occ} Occupied
          </span>
        )}
        {maint > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 border border-amber-500/20">
            {maint} Maintenance
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={hotelF}
            onChange={(e) => setHotelF(e.target.value)}
            className="bg-card border border-border px-3 py-2 text-sm rounded-md"
          >
            <option value="all">All Hotels</option>
            {hotels.map((h: any) => (
              <option key={h.id} value={h.slug}>{h.name}</option>
            ))}
          </select>

          <select
            value={catF}
            onChange={(e) => setCatF(e.target.value)}
            className="bg-card border border-border px-3 py-2 text-sm rounded-md"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => { setEditGroup(null); setIsCategoryModalOpen(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 text-sm font-semibold rounded-md shadow-sm hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Room Category
        </button>
      </div>

      {/* Category Table */}
      <div className="bg-card shadow-sm border border-border overflow-x-auto rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              {["Hotel", "Category", "Price / Night", "Capacity", "Availability", "Actions"].map((h) => (
                <th key={h} className="text-left py-4 px-6 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {roomsLoading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted-foreground">
                  Loading categories…
                </td>
              </tr>
            ) : groupedCategories.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-16 text-center text-muted-foreground">
                  {rooms.length === 0 ? (
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-base font-medium">No room categories found.</p>
                      <button
                        onClick={() => { setEditGroup(null); setIsCategoryModalOpen(true); }}
                        className="bg-primary text-white px-6 py-2.5 text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors"
                      >
                        Create Your First Category
                      </button>
                    </div>
                  ) : (
                    "No categories match your filters."
                  )}
                </td>
              </tr>
            ) : (
              groupedCategories.map((g: any, idx: number) => (
                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-6 font-medium">{g.hotel_name}</td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-primary">
                      {CATEGORY_LABELS[g.category as keyof typeof CATEGORY_LABELS] ?? g.category}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-semibold">{formatINR(g.price_per_night)}</td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" /> {g.max_guests} Guests
                      </div>
                      {g.bed_type && (
                        <div className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" /> {g.bed_type}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => { setNumbersGroup(g); setIsRoomNumbersModalOpen(true); }}
                      className="text-left hover:opacity-80 transition-opacity"
                      title="Manage Room Numbers"
                    >
                      <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <List className="h-3 w-3" />
                        {g.rooms.length} Room{g.rooms.length !== 1 ? "s" : ""} · Manage →
                      </div>
                      {statusBadge(g.rooms)}
                    </button>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setEditGroup(g); setIsCategoryModalOpen(true); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                        title="Edit Category"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteCategory(g)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                        title="Delete Category & All Rooms"
                      >
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

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={invalidate}
        categoryGroup={editGroup}
        hotels={hotels}
      />

      {/* Room Numbers Modal */}
      <RoomNumbersModal
        isOpen={isRoomNumbersModalOpen}
        onClose={() => setIsRoomNumbersModalOpen(false)}
        onSuccess={invalidate}
        categoryGroup={numbersGroup}
      />
    </div>
  );
}
