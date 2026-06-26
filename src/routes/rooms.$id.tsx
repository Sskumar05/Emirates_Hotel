import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR, AMENITY_LABELS } from "@/lib/hotel";
import { motion } from "framer-motion";
import { Check, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/rooms/$id")({
  component: RoomDetail,
});

const FALLBACK = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1600&q=80";

function RoomDetail() {
  const { id } = Route.useParams();
  const nav = useNavigate();
  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => (await supabase.from("rooms").select("*, hotels(name, slug, address)").eq("id", id).maybeSingle()).data,
  });

  if (isLoading) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground font-medium">Loading…</div></WebsiteLayout>;
  if (!room) return <WebsiteLayout><div className="container-luxe py-32 text-center font-medium">Room not found.</div></WebsiteLayout>;

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20">
        <Link to="/rooms" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Rooms
        </Link>
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <img src={(room as any).images?.[0] || FALLBACK} alt="" className="w-full aspect-[4/3] object-cover rounded-lg shadow-sm" />
            <div className="grid grid-cols-3 gap-4">
              {["1582719478250-c89cae4dc85b", "1551882547-ff40c63fe5fa", "1611892440504-42a792e24d32"].map((i) =>
                <img key={i} src={`https://images.unsplash.com/photo-${i}?w=400&q=80`} alt="" className="aspect-square object-cover rounded-md shadow-sm" />
              )}
            </div>
          </motion.div>
          <div className="bg-card p-8 rounded-lg shadow-card border border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">{(room as any).hotels?.name}</span>
            <h1 className="font-bold text-4xl mt-3 mb-6 text-foreground tracking-tight">{CATEGORY_LABELS[room.category]}</h1>
            <p className="text-muted-foreground leading-relaxed mb-8">{room.description}</p>
            <div className="flex items-baseline gap-3 mb-8 pb-8 border-b border-border">
              <span className="font-bold text-4xl text-primary">{formatINR(room.price_per_night)}</span>
              <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">per night</span>
            </div>
            <div className="mb-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-4">Suite Features</h3>
              <ul className="grid grid-cols-2 gap-y-4 gap-x-6">
                <li className="flex items-center gap-3 text-sm font-medium"><div className="bg-primary/10 p-1 rounded-full"><Check className="h-3 w-3 text-primary" /></div> Max {room.max_guests} guests</li>
                <li className="flex items-center gap-3 text-sm font-medium"><div className="bg-primary/10 p-1 rounded-full"><Check className="h-3 w-3 text-primary" /></div> Room {room.room_number}</li>
                {(room.amenities ?? []).map((a: string) =>
                  <li key={a} className="flex items-center gap-3 text-sm font-medium"><div className="bg-primary/10 p-1 rounded-full"><Check className="h-3 w-3 text-primary" /></div> {AMENITY_LABELS[a] ?? a}</li>
                )}
              </ul>
            </div>
            <button onClick={() => nav({ to: "/booking", search: { roomId: id } as any })}
              className="w-full bg-gold text-white py-4 text-sm font-semibold rounded-md shadow-md hover:bg-gold-hover transition">
              Reserve This Suite
            </button>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
