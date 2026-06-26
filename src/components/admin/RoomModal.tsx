import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS } from "@/lib/hotel";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function RoomModal({
  isOpen,
  onClose,
  onSuccess,
  room,
  hotels,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  room?: any;
  hotels: any[];
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    hotel_id: "",
    room_number: "",
    category: "ac_double",
    room_type: "",
    floor: "",
    bed_type: "",
    max_guests: 2,
    price_per_night: 5000,
    description: "",
    amenities: "",
    status: "available",
    images: [] as string[],
  });

  useEffect(() => {
    if (room) {
      setForm({
        ...room,
        amenities: (room.amenities || []).join(", "),
      });
    } else {
      setForm({
        hotel_id: hotels.length > 0 ? hotels[0].id : "",
        room_number: "",
        category: "ac_double",
        room_type: "",
        floor: "",
        bed_type: "",
        max_guests: 2,
        price_per_night: 5000,
        description: "",
        amenities: "WiFi, TV, Hot Water",
        status: "available",
        images: [],
      });
    }
  }, [room, hotels, isOpen]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setLoading(true);
    const uploadedUrls: string[] = [...form.images];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `rooms/${fileName}`;

      try {
        const { error: uploadError, data } = await supabase.storage.from('room-images').upload(filePath, file);
        if (uploadError) {
          toast.error(`Upload failed: ${uploadError.message}. Try creating a "room-images" storage bucket in Supabase.`);
          continue;
        }
        const { data: { publicUrl } } = supabase.storage.from('room-images').getPublicUrl(filePath);
        uploadedUrls.push(publicUrl);
      } catch (err: any) {
        toast.error(`Error uploading image: ${err.message}`);
      }
    }
    
    setForm(prev => ({ ...prev, images: uploadedUrls }));
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    const payload = {
      ...form,
      amenities: form.amenities.split(",").map(s => s.trim()).filter(Boolean),
    };

    try {
      if (room?.id) {
        const { error } = await supabase.from("rooms").update(payload).eq("id", room.id);
        if (error) throw error;
        toast.success("Room updated successfully!");
      } else {
        const { error } = await supabase.from("rooms").insert([payload]);
        if (error) throw error;
        toast.success("Room created successfully!");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "An error occurred while saving the room.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card text-foreground">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{room ? "Edit Room" : "Add New Room"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Hotel *</label>
              {hotels.length === 0 ? (
                <div className="w-full bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2 text-sm text-amber-600">
                  ⚠️ No hotels found in the database. Please add hotels first via the{" "}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-semibold"
                  >
                    Supabase Dashboard
                  </a>
                  {" "}or run the seed SQL below.
                </div>
              ) : (
                <select
                  required
                  value={form.hotel_id}
                  onChange={e => setForm({...form, hotel_id: e.target.value})}
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="" disabled>Select Hotel</option>
                  {hotels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Room Number *</label>
              <input required type="text" value={form.room_number} onChange={e => setForm({...form, room_number: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Category *</label>
              <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Room Type</label>
              <input type="text" value={form.room_type} onChange={e => setForm({...form, room_type: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Floor</label>
              <input type="text" value={form.floor} onChange={e => setForm({...form, floor: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Bed Type</label>
              <input type="text" value={form.bed_type} onChange={e => setForm({...form, bed_type: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Capacity (Guests) *</label>
              <input required type="number" min={1} value={form.max_guests} onChange={e => setForm({...form, max_guests: parseInt(e.target.value)})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Price per Night (₹) *</label>
              <input required type="number" min={0} value={form.price_per_night} onChange={e => setForm({...form, price_per_night: parseInt(e.target.value)})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
            </div>
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none resize-none" />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Amenities (Comma separated)</label>
            <input type="text" value={form.amenities} onChange={e => setForm({...form, amenities: e.target.value})} placeholder="WiFi, TV, AC" className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Status *</label>
              <select required value={form.status} onChange={e => setForm({...form, status: e.target.value})} className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none">
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Upload Images</label>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} disabled={loading} className="w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer" />
            </div>
          </div>
          
          {form.images.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded overflow-hidden border border-border">
                  <img src={img} alt={`Uploaded ${idx}`} className="object-cover w-full h-full" />
                  <button type="button" onClick={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-xs flex items-center justify-center rounded-bl-sm">×</button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-md border border-border hover:bg-muted transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-semibold rounded-md bg-primary text-white shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {room ? "Update Room" : "Save Room"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
