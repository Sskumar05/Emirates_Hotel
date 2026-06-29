import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR } from "@/lib/hotel";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Wifi, Tv, Car, Droplet, ChefHat, Camera, Wine, ArrowRight, Ban } from "lucide-react";

export const Route = createFileRoute("/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms & Suites — Emirates Inn" },
      { name: "description", content: "Browse our curated collection of rooms and suites." },
    ],
  }),
  component: RoomsPage,
});

const AMENITY_ICON: Record<string, typeof Wifi> = {
  WiFi: Wifi, TV: Tv, Parking: Car, "Hot Water": Droplet,
  Kitchen: ChefHat, CCTV: Camera, "Welcome Drink": Wine,
};
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
    queryFn: async () =>
      (await supabase.from("rooms").select("*, hotels(name, slug, id)").order("price_per_night")).data ?? [],
  });

  // ── Group by hotel + category: one card per category ─────────────────────
  // The representative row (first / cheapest) keeps its `.id` for routing.
  // _availableCount = rooms with status = "available"
  // _maintenanceCount = rooms with status = "maintenance"
  // _totalCount = all rooms in group
  const grouped = useMemo(() => {
    const map: Record<string, any> = {};
    for (const r of rooms) {
      const hotelId = (r as any).hotel_id ?? (r as any).hotels?.id ?? "";
      const key = `${hotelId}__${(r as any).category}`;
      if (!map[key]) {
        map[key] = { ...r, _availableCount: 0, _maintenanceCount: 0, _totalCount: 0 };
      }
      map[key]._totalCount++;
      if ((r as any).status === "available") map[key]._availableCount++;
      if ((r as any).status === "maintenance") map[key]._maintenanceCount++;
    }
    return Object.values(map);
  }, [rooms]);

  const filtered = useMemo(
    () =>
      grouped.filter(
        (r: any) =>
          (hotel === "all" || r.hotels?.slug === hotel) &&
          (category === "all" || r.category === category) &&
          Number(r.price_per_night) <= maxPrice,
      ),
    [grouped, hotel, category, maxPrice],
  );

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-32 pb-20">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">Accommodations</span>
          <h1 className="font-bold text-4xl sm:text-5xl md:text-7xl mt-4 text-foreground tracking-tight">
            Rooms &amp; Suites
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-card shadow-sm rounded-lg border border-border p-6 mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Hotel
            </label>
            <select
              value={hotel}
              onChange={(e) => setHotel(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors"
            >
              <option value="all">All Properties</option>
              {hotels.map((h: any) => (
                <option key={h.id} value={h.slug}>{h.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-background border border-border rounded-md px-3 py-2.5 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2 lg:col-span-2">
            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
              Max Price: <span className="text-primary">{formatINR(maxPrice)}</span>
            </label>
            <input
              type="range"
              min={2000}
              max={10000}
              step={500}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[var(--color-gold)] mt-2"
            />
          </div>
        </div>

        {/* Grid — one card per Hotel + Category */}
        {isLoading ? (
          <div className="text-center py-20 text-muted-foreground font-medium">Loading rooms…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground font-medium">
            No rooms match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((r: any, i: number) => {
              const isSoldOut = r._availableCount === 0;

              return (
                <motion.div
                  key={`${r.hotel_id ?? ""}_${r.category}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`group bg-card rounded-lg shadow-card border overflow-hidden flex flex-col transition-all ${
                    isSoldOut
                      ? "border-border opacity-75"
                      : "border-border hover:shadow-md hover:border-gold/50"
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img
                      src={r.images?.[0] || ROOM_IMG}
                      alt={CATEGORY_LABELS[r.category] ?? r.category}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-transform duration-500 ${
                        isSoldOut ? "grayscale" : "group-hover:scale-105"
                      }`}
                    />
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white font-bold text-sm px-4 py-1.5 rounded-full uppercase tracking-wider">
                          Sold Out
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                            {r.hotels?.name}
                          </span>
                          <h3 className="font-bold text-2xl mt-1 text-foreground">
                            {CATEGORY_LABELS[r.category]}
                          </h3>
                        </div>
                        <div className="text-right">
                          <div className="text-primary font-bold text-xl">{formatINR(r.price_per_night)}</div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            per night
                          </div>
                        </div>
                      </div>

                      {/* Total rooms */}
                      <div className="text-xs font-semibold text-muted-foreground mb-3">
                        Total Rooms: {r._totalCount}
                      </div>

                      {/* Amenity icons */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(r.amenities ?? []).slice(0, 5).map((a: string) => {
                          const I = AMENITY_ICON[a];
                          return I ? (
                            <div key={a} className="bg-primary/5 p-1.5 rounded-md" title={a}>
                              <I className="h-4 w-4 text-primary" />
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>

                    {/* Footer — CTA */}
                    <div className="flex flex-col gap-3 mt-auto">

                      {isSoldOut ? (
                        <div className="w-full flex items-center justify-center gap-2 bg-muted text-muted-foreground font-semibold py-3 text-sm rounded-md cursor-not-allowed select-none">
                          <Ban className="h-4 w-4" /> Sold Out
                        </div>
                      ) : (
                        <Link
                          to="/rooms/$id"
                          params={{ id: r.id }}
                          className="w-full block text-center bg-gold text-white font-semibold py-3 text-sm rounded-md hover:bg-gold-hover transition shadow-sm"
                        >
                          View Details &amp; Book <ArrowRight className="inline h-4 w-4 ml-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </WebsiteLayout>
  );
}
