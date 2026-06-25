import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wifi, Tv, Car, Droplet, ChefHat, Camera, Wine, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/rooms")({
  head: () => ({ meta: [{ title: "Rooms & Suites — Emirates Inn" }, { name: "description", content: "Browse our curated collection of rooms and suites." }] }),
  component: RoomsPage,
});

const AMENITY_ICON: Record<string, typeof Wifi> = { WiFi: Wifi, TV: Tv, Parking: Car, "Hot Water": Droplet, Kitchen: ChefHat, CCTV: Camera, "Welcome Drink": Wine };
const ROOM_IMG = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80";

function RoomsPage() {
  const [hotel, setHotel] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number>(10000);

  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => (await supabase.from("hotels").select("*").order("name")).data ?? [],
  });
  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => (await supabase.from("rooms").select("*, hotels(name, slug)").order("price_per_night")).data ?? [],
  });

  const filtered = useMemo(() => rooms.filter((r: any) =>
    (hotel === "all" || r.hotels?.slug === hotel) &&
    (category === "all" || r.category === category) &&
    Number(r.price_per_night) <= maxPrice
  ), [rooms, hotel, category, maxPrice]);

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-32 pb-20">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.4em] text-gold">Accommodations</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4">Rooms & Suites</h1>
        </div>

        {/* Filters */}
        <div className="glass p-6 mb-12 grid md:grid-cols-4 gap-4">
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Hotel</label>
            <select value={hotel} onChange={(e) => setHotel(e.target.value)} className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:border-gold focus:outline-none">
              <option value="all">All Properties</option>
              {hotels.map((h: any) => <option key={h.id} value={h.slug}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:border-gold focus:outline-none">
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">Max Price: {formatINR(maxPrice)}</label>
            <input type="range" min={2000} max={10000} step={500} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--color-gold)]" />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground">Loading rooms…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">No rooms match your filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r: any, i: number) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="group bg-card border border-border overflow-hidden hover:border-gold transition-all">
                <Link to="/rooms/$id" params={{ id: r.id }}>
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={r.images?.[0] || ROOM_IMG} alt={r.room_number} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                </Link>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.3em] text-gold">{r.hotels?.name}</span>
                      <h3 className="font-display text-2xl mt-1">{CATEGORY_LABELS[r.category]}</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-gold font-display text-xl">{formatINR(r.price_per_night)}</div>
                      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">per night</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(r.amenities ?? []).slice(0, 5).map((a: string) => {
                      const I = AMENITY_ICON[a]; return I ? <I key={a} className="h-4 w-4 text-muted-foreground" /> : null;
                    })}
                  </div>
                  <Link to="/rooms/$id" params={{ id: r.id }}
                    className="w-full block text-center border border-gold text-gold py-2.5 text-xs uppercase tracking-[0.2em] hover:bg-gold hover:text-primary-foreground transition">
                    View & Book <ArrowRight className="inline h-3 w-3 ml-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </WebsiteLayout>
  );
}
