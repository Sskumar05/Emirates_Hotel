import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/hotel";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  booking: any;
  roomNumberMap: Record<string, string>;
}

export function ReduceRoomsModal({ isOpen, onClose, onSuccess, booking, roomNumberMap }: Props) {
  const [selectedToRelease, setSelectedToRelease] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!booking) return null;

  const assignedRooms = booking.assigned_room_ids || [];

  const handleToggle = (roomId: string) => {
    setSelectedToRelease((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId]
    );
  };

  const remainingRoomsCount = assignedRooms.length - selectedToRelease.length;
  // Use price_per_night * num_days * remaining_rooms_count to be safe, 
  // or (total_amount / num_rooms) * remaining
  // Let's use (total_amount / num_rooms) * remaining
  const perRoomAmount = booking.num_rooms > 0 ? booking.total_amount / booking.num_rooms : 0;
  const newTotalAmount = perRoomAmount * remainingRoomsCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedToRelease.length === 0) {
      toast.error("Please select at least one room to release.");
      return;
    }
    if (remainingRoomsCount <= 0) {
      toast.error("You cannot release all rooms. Cancel the booking instead.");
      return;
    }

    setLoading(true);
    try {
      const newAssignedRooms = assignedRooms.filter((id: string) => !selectedToRelease.includes(id));
      const { error } = await supabase
        .from("bookings")
        .update({
          assigned_room_ids: newAssignedRooms,
          num_rooms: remainingRoomsCount,
          total_amount: newTotalAmount,
        })
        .eq("id", booking.id);

      if (error) throw error;
      
      toast.success("Rooms updated successfully. Released rooms are now available.");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to update rooms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-card text-foreground max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl font-bold">Reduce Rooms</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select the room(s) you want to release from booking {booking.booking_code}.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col flex-1 min-h-0 gap-6">
          <div className="flex flex-col flex-1 min-h-0 gap-3">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex-shrink-0">
              Assigned Rooms
            </h4>
            <div className="space-y-2 overflow-y-auto pr-2 flex-1">
              {assignedRooms.map((roomId: string) => (
                <label
                  key={roomId}
                  className={`flex items-center gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    selectedToRelease.includes(roomId)
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-border hover:bg-surface"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-border text-red-500 focus:ring-red-500"
                    checked={selectedToRelease.includes(roomId)}
                    onChange={() => handleToggle(roomId)}
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-primary">
                      Room {roomNumberMap[roomId] || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedToRelease.includes(roomId) ? "Will be released" : "Will be kept"}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-surface p-4 rounded-lg border border-border space-y-2 text-sm flex-shrink-0">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Rooms:</span>
              <span className="font-medium">{booking.num_rooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rooms to Release:</span>
              <span className="font-medium text-red-500">{selectedToRelease.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">New Room Count:</span>
              <span className="font-medium text-gold">{remainingRoomsCount}</span>
            </div>
            <div className="pt-2 mt-2 border-t border-border flex justify-between font-semibold">
              <span>New Total Amount:</span>
              <span>{formatINR(newTotalAmount)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium hover:bg-surface rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedToRelease.length === 0 || remainingRoomsCount <= 0}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-md transition-colors disabled:opacity-50"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Release Selected Rooms
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
