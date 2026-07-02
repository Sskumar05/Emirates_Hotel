import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS } from "@/lib/hotel";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * CategoryModal
 *
 * ADD mode  (categoryGroup = null)
 *   – All fields editable
 *   – Requires ONE initial room number + initial status
 *   – Creates N rows in `rooms` (one per category, but spec says single initial room here)
 *   – Prevents duplicate category per hotel
 *
 * EDIT mode (categoryGroup = group object with .template)
 *   – ONLY price_per_night is editable
 *   – All other fields displayed as read-only
 *   – Updates price_per_night across ALL rooms in that hotel+category
 */

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryGroup?: any; // null → Add mode; group object → Edit mode
  hotels: any[];
}

const BLANK_FORM = {
  hotel_id: "",
  category: "ac_double",
  room_type: "",
  floor: "",
  bed_type: "",
  max_guests: 2,
  price_per_night: 5000,
  description: "",
  amenities: "",
  images: [] as string[],
  initial_room_number: "",
  initial_status: "available",
};

export function CategoryModal({ isOpen, onClose, onSuccess, categoryGroup, hotels }: Props) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...BLANK_FORM });

  const isEdit = Boolean(categoryGroup);

  // Populate form when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (categoryGroup) {
      // Edit mode — read data from the template room row
      const tpl = categoryGroup.template ?? categoryGroup;
      setForm({
        hotel_id: tpl.hotel_id ?? "",
        category: tpl.category ?? "ac_double",
        room_type: tpl.room_type ?? "",
        floor: tpl.floor ?? "",
        bed_type: tpl.bed_type ?? "",
        max_guests: tpl.max_guests ?? 2,
        price_per_night: tpl.price_per_night ?? 5000,
        description: tpl.description ?? "",
        amenities: Array.isArray(tpl.amenities) ? tpl.amenities.join(", ") : (tpl.amenities ?? ""),
        images: Array.isArray(tpl.images) ? tpl.images : [],
        initial_room_number: "",
        initial_status: "available",
      });
    } else {
      // Add mode — reset to blank
      setForm({
        ...BLANK_FORM,
        hotel_id: hotels.length > 0 ? hotels[0].id : "",
      });
    }
  }, [isOpen, categoryGroup, hotels]);

  // ── Image upload ──────────────────────────────────────────────────────────
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    const uploaded: string[] = [...form.images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop();
      const path = `rooms/${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("room-images").upload(path, file);
      if (error) { toast.error(`Upload failed: ${error.message}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from("room-images").getPublicUrl(path);
      uploaded.push(publicUrl);
    }

    setForm((prev) => ({ ...prev, images: uploaded }));
    setLoading(false);
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEdit) {
        // ── EDIT: update only price_per_night across all rooms in this category ──
        const hotelId = categoryGroup.hotel_id ?? categoryGroup.template?.hotel_id;
        const category = categoryGroup.category ?? categoryGroup.template?.category;

        const { error } = await supabase
          .from("rooms")
          .update({ price_per_night: form.price_per_night, updated_at: new Date().toISOString() })
          .eq("hotel_id", hotelId)
          .eq("category", category);

        if (error) throw error;
        toast.success("Price updated across all rooms in this category!");
      } else {
        // ── ADD: validate, then insert first room row ──
        if (!form.initial_room_number.trim()) throw new Error("Please enter an initial room number.");

        const trimmedRoomType = form.room_type ? form.room_type.trim() : null;

        // Check category doesn't already exist for this hotel with the same room type
        let query = supabase
          .from("rooms")
          .select("id")
          .eq("hotel_id", form.hotel_id)
          .eq("category", form.category)
          .limit(1);
          
        if (trimmedRoomType) {
          query = query.eq("room_type", trimmedRoomType);
        } else {
          query = query.is("room_type", null);
        }

        const { data: existing } = await query;

        if (existing && existing.length > 0) {
          const typeLabel = trimmedRoomType ? ` with room type "${trimmedRoomType}"` : "";
          throw new Error(
            `A "${CATEGORY_LABELS[form.category as keyof typeof CATEGORY_LABELS]}" category${typeLabel} already exists for this hotel. ` +
            "Edit the existing category, or manage its room numbers instead."
          );
        }

        // Check room number isn't already in use in this hotel
        const { data: dupRoom } = await supabase
          .from("rooms")
          .select("id")
          .eq("hotel_id", form.hotel_id)
          .eq("room_number", form.initial_room_number.trim())
          .limit(1);

        if (dupRoom && dupRoom.length > 0) {
          throw new Error("Room number already exists for this hotel.");
        }

        const amenities = form.amenities.split(",").map((s) => s.trim()).filter(Boolean);

        const { error } = await supabase.from("rooms").insert([
          {
            hotel_id: form.hotel_id,
            category: form.category,
            room_number: form.initial_room_number.trim(),
            status: form.initial_status,
            room_type: trimmedRoomType,
            floor: form.floor || null,
            bed_type: form.bed_type || null,
            max_guests: form.max_guests,
            price_per_night: form.price_per_night,
            description: form.description || null,
            amenities,
            images: form.images,
          },
        ]);

        if (error) throw error;
        toast.success("Room category created!");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const field = (label: string, content: React.ReactNode, colSpan = 1) => (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">{label}</label>
      {content}
    </div>
  );

  const ro = "w-full bg-muted/50 border border-border rounded-md px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-75";
  const rw = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {isEdit ? "Edit Room Category" : "Add Room Category"}
          </DialogTitle>
        </DialogHeader>

        {isEdit && (
          <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/25 rounded-md px-4 py-3 text-sm text-amber-700 dark:text-amber-400 mt-2">
            <span className="shrink-0">ℹ️</span>
            <span>
              Only <strong>Price Per Night</strong> can be changed here. To manage room numbers, use the{" "}
              <strong>Manage Room Numbers</strong> button on the main list.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          <div className="grid grid-cols-2 gap-4">

            {/* Hotel */}
            {field(
              "Hotel",
              isEdit ? (
                <input type="text" disabled className={ro}
                  value={hotels.find((h) => h.id === form.hotel_id)?.name ?? form.hotel_id} />
              ) : hotels.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2">
                  ⚠️ No hotels found. Add a hotel first.
                </div>
              ) : (
                <select required value={form.hotel_id} onChange={(e) => setForm({ ...form, hotel_id: e.target.value })} className={rw}>
                  <option value="" disabled>Select Hotel</option>
                  {hotels.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              )
            )}

            {/* Category */}
            {field(
              "Category",
              isEdit ? (
                <input type="text" disabled className={ro}
                  value={CATEGORY_LABELS[form.category as keyof typeof CATEGORY_LABELS] ?? form.category} />
              ) : (
                <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={rw}>
                  {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              )
            )}

            {/* Price — always editable */}
            {field(
              "Price Per Night (₹) *",
              <input required type="number" min={0} value={form.price_per_night} className={rw}
                onChange={(e) => setForm({ ...form, price_per_night: parseInt(e.target.value) || 0 })} />
            )}

            {/* Capacity */}
            {field(
              "Capacity (Guests) *",
              <input required type="number" min={1} value={form.max_guests} disabled={isEdit} className={isEdit ? ro : rw}
                onChange={(e) => setForm({ ...form, max_guests: parseInt(e.target.value) || 1 })} />
            )}

            {/* Room Type */}
            {field(
              "Room Type",
              <input type="text" value={form.room_type} disabled={isEdit} className={isEdit ? ro : rw}
                onChange={(e) => setForm({ ...form, room_type: e.target.value })} />
            )}

            {/* Bed Type */}
            {field(
              "Bed Type",
              <input type="text" value={form.bed_type} disabled={isEdit} className={isEdit ? ro : rw}
                onChange={(e) => setForm({ ...form, bed_type: e.target.value })} />
            )}

            {/* Floor */}
            {field(
              "Floor",
              <input type="text" value={form.floor} disabled={isEdit} className={isEdit ? ro : rw}
                onChange={(e) => setForm({ ...form, floor: e.target.value })} />
            )}

            {/* Images upload (add mode only) */}
            {!isEdit && field(
              "Upload Images",
              <input type="file" multiple accept="image/*" disabled={loading} onChange={handleFileUpload}
                className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
            <textarea rows={3} value={form.description} disabled={isEdit} className={`${isEdit ? ro : rw} resize-none`}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          {/* Amenities */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Amenities (comma separated)</label>
            <input type="text" value={form.amenities} disabled={isEdit} className={isEdit ? ro : rw}
              placeholder="WiFi, TV, AC, Hot Water"
              onChange={(e) => setForm({ ...form, amenities: e.target.value })} />
          </div>

          {/* Image preview */}
          {form.images.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Images</p>
              <div className="flex gap-2 flex-wrap">
                {form.images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border border-border group">
                    <img src={img} alt="" className="object-cover w-full h-full" />
                    {!isEdit && (
                      <button type="button"
                        onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                        className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Initial Room Number — add mode only */}
          {!isEdit && (
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
                  Initial Room Number *
                </label>
                <input required type="text" value={form.initial_room_number} className={rw}
                  placeholder="e.g. 101"
                  onChange={(e) => setForm({ ...form, initial_room_number: e.target.value })} />
                <p className="text-xs text-muted-foreground mt-1">
                  You can add more room numbers after saving via "Manage Room Numbers".
                </p>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
                  Initial Status *
                </label>
                <select required value={form.initial_status} className={rw}
                  onChange={(e) => setForm({ ...form, initial_status: e.target.value })}>
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm font-semibold rounded-md border border-border hover:bg-muted transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="px-6 py-2 text-sm font-semibold rounded-md bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save Price Update" : "Create Category"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
