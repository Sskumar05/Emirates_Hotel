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

  if (isLoading) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground">Loading…</div></WebsiteLayout>;
  if (!room) return <WebsiteLayout><div className="container-luxe py-32 text-center">Room not found.</div></WebsiteLayout>;

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20">
        <Link to="/rooms" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold mb-8">
          <ArrowLeft className="h-4 w-4" /> Back to Rooms
        </Link>
        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <img src={(room as any).images?.[0] || FALLBACK} alt="" className="w-full aspect-[4/3] object-cover" />
            <div className="grid grid-cols-3 gap-3">
              {["1582719478250-c89cae4dc85b", "1551882547-ff40c63fe5fa", "1611892440504-42a792e24d32"].map((i) =>
                <img key={i} src={`https://images.unsplash.com/photo-${i}?w=400&q=80`} alt="" className="aspect-square object-cover" />
              )}
            </div>
          </motion.div>
          <div>
            <span className="text-xs uppercase tracking-[0.4em] text-gold">{(room as any).hotels?.name}</span>
            <h1 className="font-display text-5xl mt-3 mb-4">{CATEGORY_LABELS[room.category]}</h1>
            <p className="text-muted-foreground leading-relaxed mb-8">{room.description}</p>
            <div className="flex items-baseline gap-3 mb-8 pb-8 border-b border-border">
              <span className="font-display text-4xl text-gold">{formatINR(room.price_per_night)}</span>
              <span className="text-sm uppercase tracking-[0.2em] text-muted-foreground">per night</span>
            </div>
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-[0.3em] text-gold mb-4">Suite Features</h3>
              <ul className="grid grid-cols-2 gap-y-3 gap-x-6">
                <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-gold" /> Max {room.max_guests} guests</li>
                <li className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-gold" /> Room {room.room_number}</li>
                {(room.amenities ?? []).map((a: string) =>
                  <li key={a} className="flex items-center gap-2 text-sm"><Check className="h-4 w-4 text-gold" /> {AMENITY_LABELS[a] ?? a}</li>
                )}
              </ul>
            </div>
            <button onClick={() => nav({ to: "/booking", search: { roomId: id } as any })}
              className="w-full gradient-gold text-primary-foreground py-4 text-xs uppercase tracking-[0.3em] hover:brightness-110 transition">
              Reserve This Suite
            </button>
          </div>
        </div>
      </div>
    </WebsiteLayout>
  );
}
