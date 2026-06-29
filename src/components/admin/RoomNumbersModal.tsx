import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS } from "@/lib/hotel";
import { toast } from "sonner";
import { Loader2, Trash2, Plus, Pencil, Check, X } from "lucide-react";

/**
 * RoomNumbersModal
 *
 * Allows the admin to:
 *   • Add a new room number (with validation — no duplicates per hotel)
 *   • Inline-edit a room number
 *   • Change room status (Available / Occupied / Maintenance)
 *   • Delete a room number
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryGroup: any; // the group object from AdminRooms
}

type RoomStatus = "available" | "occupied" | "maintenance";

const STATUS_STYLES: Record<RoomStatus, string> = {
  available:   "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
  occupied:    "bg-red-500/15 text-red-700 border-red-500/25",
  maintenance: "bg-amber-500/15 text-amber-700 border-amber-500/25",
};

export function RoomNumbersModal({ isOpen, onClose, onSuccess, categoryGroup }: Props) {
  const [addNumber, setAddNumber] = useState("");
  const [addStatus, setAddStatus] = useState<RoomStatus>("available");
  const [addLoading, setAddLoading] = useState(false);

  // Inline edit state: roomId → edited number string
  const [editId, setEditId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  if (!categoryGroup) return null;

  const categoryLabel =
    CATEGORY_LABELS[categoryGroup.category as keyof typeof CATEGORY_LABELS] ??
    categoryGroup.category;

  // ── Add room number ───────────────────────────────────────────────────────
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const num = addNumber.trim();
    if (!num) return;

    setAddLoading(true);
    try {
      // Duplicate check — same hotel
      const { data: dup } = await supabase
        .from("rooms")
        .select("id")
        .eq("hotel_id", categoryGroup.hotel_id)
        .eq("room_number", num)
        .limit(1);

      if (dup && dup.length > 0) throw new Error("Room number already exists for this hotel.");

      const tpl = categoryGroup.template;
      const { error } = await supabase.from("rooms").insert([
        {
          hotel_id: tpl.hotel_id,
          category: tpl.category,
          room_number: num,
          status: addStatus,
          room_type: tpl.room_type ?? null,
          floor: tpl.floor ?? null,
          bed_type: tpl.bed_type ?? null,
          max_guests: tpl.max_guests,
          price_per_night: tpl.price_per_night,
          description: tpl.description ?? null,
          amenities: Array.isArray(tpl.amenities) ? tpl.amenities : [],
          images: Array.isArray(tpl.images) ? tpl.images : [],
        },
      ]);

      if (error) throw error;
      toast.success(`Room ${num} added!`);
      setAddNumber("");
      setAddStatus("available");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to add room.");
    } finally {
      setAddLoading(false);
    }
  }

  // ── Status change ─────────────────────────────────────────────────────────
  async function handleStatusChange(id: string, status: RoomStatus) {
    const { error } = await supabase
      .from("rooms")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) toast.error(error.message);
    else { toast.success("Status updated"); onSuccess(); }
  }

  // ── Save inline edit ──────────────────────────────────────────────────────
  async function handleSaveEdit(room: any) {
    const num = editNumber.trim();
    if (!num) { toast.error("Room number cannot be empty."); return; }
    if (num === room.room_number) { setEditId(null); return; }

    setEditLoading(true);
    try {
      // Duplicate check — same hotel, different id
      const { data: dup } = await supabase
        .from("rooms")
        .select("id")
        .eq("hotel_id", categoryGroup.hotel_id)
        .eq("room_number", num)
        .neq("id", room.id)
        .limit(1);

      if (dup && dup.length > 0) throw new Error("Room number already exists for this hotel.");

      const { error } = await supabase
        .from("rooms")
        .update({ room_number: num, updated_at: new Date().toISOString() })
        .eq("id", room.id);

      if (error) throw error;
      toast.success(`Room renamed to ${num}`);
      setEditId(null);
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update room number.");
    } finally {
      setEditLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id: string, num: string) {
    if (!confirm(`Delete Room ${num}? This cannot be undone.`)) return;

    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Room ${num} deleted`);
      onSuccess();
    }
  }

  const rw = "bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Manage Room Numbers</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {categoryGroup.hotel_name} — {categoryLabel}
          </p>
        </DialogHeader>

        <div className="mt-4 space-y-6">

          {/* ── Add room form ─────────────────────────────────────────────── */}
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-end gap-3 bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex-1">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                New Room Number
              </label>
              <input
                required
                type="text"
                value={addNumber}
                onChange={(e) => setAddNumber(e.target.value)}
                placeholder="e.g. 104"
                className={`${rw} w-full`}
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">
                Status
              </label>
              <select value={addStatus} onChange={(e) => setAddStatus(e.target.value as RoomStatus)} className={rw}>
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
            >
              {addLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add Room
            </button>
          </form>

          {/* ── Room list ─────────────────────────────────────────────────── */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-surface text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4">Room Number</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {categoryGroup.rooms.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-muted-foreground text-sm">
                      No rooms yet. Add one above.
                    </td>
                  </tr>
                ) : (
                  categoryGroup.rooms.map((r: any) => (
                    <tr key={r.id} className="hover:bg-muted/20 transition-colors">

                      {/* Room number — inline editable */}
                      <td className="py-3 px-4">
                        {editId === r.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={editNumber}
                              onChange={(e) => setEditNumber(e.target.value)}
                              className={`${rw} w-28`}
                            />
                            <button
                              type="button"
                              disabled={editLoading}
                              onClick={() => handleSaveEdit(r)}
                              className="text-emerald-600 hover:text-emerald-700 transition-colors"
                              title="Save"
                            >
                              {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditId(null)}
                              className="text-muted-foreground hover:text-red-500 transition-colors"
                              title="Cancel"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <span className="font-bold text-primary">{r.room_number}</span>
                        )}
                      </td>

                      {/* Status dropdown */}
                      <td className="py-3 px-4">
                        <select
                          value={r.status}
                          onChange={(e) => handleStatusChange(r.id, e.target.value as RoomStatus)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer focus:outline-none ${STATUS_STYLES[r.status as RoomStatus] ?? ""}`}
                        >
                          <option value="available"  className="text-foreground bg-background">Available</option>
                          <option value="occupied"   className="text-foreground bg-background">Occupied</option>
                          <option value="maintenance" className="text-foreground bg-background">Maintenance</option>
                        </select>
                      </td>

                      {/* Edit / Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => { setEditId(r.id); setEditNumber(r.room_number); }}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Room Number"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r.id, r.room_number)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                            title="Delete Room"
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

          {/* Summary row */}
          {categoryGroup.rooms.length > 0 && (
            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              {(["available", "occupied", "maintenance"] as RoomStatus[]).map((s) => {
                const count = categoryGroup.rooms.filter((r: any) => r.status === s).length;
                if (count === 0) return null;
                return (
                  <span key={s} className={`px-3 py-1 rounded-full border ${STATUS_STYLES[s]}`}>
                    {count} {s.charAt(0).toUpperCase() + s.slice(1)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
