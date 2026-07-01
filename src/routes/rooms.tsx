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
      { name: "description", content: "Browse our curated collection of thoughtfully designed rooms and suites at Emirates Inn & Emirates Grand Inn." },
    ],
  }),
  component: RoomsPage,
});

/* ─── Static maps (unchanged) ───────────────────────────── */
const AMENITY_ICON: Record<string, typeof Wifi> = {
  WiFi: Wifi, TV: Tv, Parking: Car, "Hot Water": Droplet,
  Kitchen: ChefHat, CCTV: Camera, "Welcome Drink": Wine,
};
const ROOM_IMG = "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&q=80";

/* ─── Animation Variants ─────────────────────────────────── */
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

/* ─── Component ──────────────────────────────────────────── */
function RoomsPage() {
  /* ── State (maxPrice removed) ── */
  const [hotel, setHotel] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");

  /* ── Data fetching (unchanged) ── */
  const { data: hotels = [] } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => (await supabase.from("hotels").select("*").order("name")).data ?? [],
  });

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () =>
      (await supabase.from("rooms").select("*, hotels(name, slug, id)").order("price_per_night")).data ?? [],
  });

  /* ── Grouping logic (unchanged) ── */
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

  /* ── Filtering (maxPrice removed) ── */
  const filtered = useMemo(
    () =>
      grouped.filter(
        (r: any) =>
          (hotel === "all" || r.hotels?.slug === hotel) &&
          (category === "all" || r.category === category),
      ),
    [grouped, hotel, category],
  );

  return (
    <WebsiteLayout>

      {/* ── 1. HERO ───────────────────────────────────────── */}
      <section
        className="relative flex items-center justify-center text-center"
        style={{
          background: "linear-gradient(160deg, #FAF9F6 0%, #F4F1EC 100%)",
          paddingTop: "clamp(7rem, 14vw, 10rem)",
          paddingBottom: "clamp(4rem, 8vw, 6rem)",
        }}
      >
        {/* Bottom hairline */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="px-6 max-w-4xl mx-auto"
        >
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.1 }}
            className="text-xs font-semibold uppercase text-gold mb-7 inline-block"
            style={{ letterSpacing: "0.35em" }}
          >
            Accommodations
          </motion.span>

          <h1
            className="font-serif font-bold text-foreground tracking-tight leading-tight mb-7"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)" }}
          >
            Rooms &amp;{" "}
            <span className="italic font-light">Suites.</span>
          </h1>

          <div className="w-14 h-px bg-gold/50 mx-auto mb-8" />

          <p
            className="text-muted-foreground leading-relaxed font-light max-w-2xl mx-auto"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)" }}
          >
            Choose from our thoughtfully designed rooms and suites, crafted for
            comfort, elegance, and a memorable stay at{" "}
            <strong className="font-medium text-foreground">Emirates Inn</strong> &{" "}
            <strong className="font-medium text-foreground">Emirates Grand Inn</strong>.
          </p>
        </motion.div>
      </section>

      {/* ── 2. FILTERS ───────────────────────────────────── */}
      <section className="py-6 bg-background">
        <div className="container-luxe">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-5"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(180,155,90,0.2)",
              borderRadius: "18px",
              padding: "0.875rem clamp(1rem, 2.5vw, 1.5rem)",
              boxShadow: "0 4px 24px -6px rgba(13,35,58,0.07), 0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Hotel filter */}
            <div>
              <label
                className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block"
                style={{ letterSpacing: "0.12em" }}
              >
                Property
              </label>
              <select
                id="filter-hotel"
                value={hotel}
                onChange={(e) => setHotel(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors"
                style={{ fontFamily: "inherit" }}
              >
                <option value="all">All Properties</option>
                {hotels.map((h: any) => (
                  <option key={h.id} value={h.slug}>{h.name}</option>
                ))}
              </select>
            </div>

            {/* Category filter */}
            <div>
              <label
                className="text-xs font-semibold uppercase text-muted-foreground mb-2.5 block"
                style={{ letterSpacing: "0.12em" }}
              >
                Category
              </label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors"
                style={{ fontFamily: "inherit" }}
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 3. ROOM CARDS ────────────────────────────────── */}
      <section
        className="pt-4 pb-28"
        style={{ background: "#FAF9F6" }}
      >
        <div className="container-luxe">
          {isLoading ? (
            /* Loading state */
            <div className="text-center py-28 text-muted-foreground font-light text-lg">
              Loading rooms…
            </div>
          ) : filtered.length === 0 ? (
            /* Empty state */
            <div className="text-center py-28">
              <p className="text-muted-foreground font-light text-lg">No rooms match your current filters.</p>
              <button
                onClick={() => { setHotel("all"); setCategory("all"); }}
                className="mt-6 text-sm font-semibold text-gold underline underline-offset-4 hover:text-gold/80 transition"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-40px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filtered.map((r: any) => {
                const isSoldOut = r._availableCount === 0;

                return (
                  <motion.div
                    key={`${r.hotel_id ?? ""}_${r.category}`}
                    variants={cardVariant}
                    className="group flex flex-col"
                    style={{
                      background: "#FFFFFF",
                      border: isSoldOut
                        ? "1px solid rgba(0,0,0,0.08)"
                        : "1px solid rgba(180,155,90,0.18)",
                      borderRadius: "22px",
                      boxShadow: "0 4px 20px -6px rgba(13,35,58,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                      overflow: "hidden",
                      opacity: isSoldOut ? 0.72 : 1,
                      transition: "box-shadow 350ms ease, transform 350ms ease, border-color 350ms ease",
                    }}
                    whileHover={isSoldOut ? {} : {
                      y: -6,
                      boxShadow: "0 16px 40px -8px rgba(13,35,58,0.14), 0 0 0 1px rgba(180,155,90,0.32)",
                    }}
                  >
                    {/* ── Thumbnail ── */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
                      <img
                        src={r.images?.[0] || ROOM_IMG}
                        alt={CATEGORY_LABELS[r.category] ?? r.category}
                        loading="lazy"
                        className={`w-full h-full object-cover transition-transform duration-600 ${
                          isSoldOut ? "grayscale" : "group-hover:scale-[1.06]"
                        }`}
                        style={{ display: "block" }}
                      />

                      {/* Hotel name badge — top left */}
                      <div
                        className="absolute top-4 left-4"
                        style={{
                          background: "rgba(255,255,255,0.92)",
                          backdropFilter: "blur(6px)",
                          borderRadius: "8px",
                          padding: "4px 10px",
                          fontSize: "0.68rem",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: "var(--color-gold)",
                          border: "1px solid rgba(180,155,90,0.25)",
                        }}
                      >
                        {r.hotels?.name}
                      </div>

                      {/* Sold-out overlay */}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span
                            className="text-white font-bold text-xs uppercase tracking-widest"
                            style={{
                              background: "rgba(180,30,30,0.92)",
                              borderRadius: "999px",
                              padding: "6px 18px",
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            Sold Out
                          </span>
                        </div>
                      )}

                      {/* Bottom gradient for depth */}
                      <div
                        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
                        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.18), transparent)" }}
                      />
                    </div>

                    {/* ── Card Body ── */}
                    <div className="flex flex-col flex-1 p-6">

                      {/* Title + Price row */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1 pr-3">
                          <h3
                            className="font-serif font-bold text-foreground leading-tight"
                            style={{ fontSize: "1.2rem" }}
                          >
                            {CATEGORY_LABELS[r.category]}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1 font-light">
                            {r._totalCount} room{r._totalCount !== 1 ? "s" : ""} available
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className="font-bold text-foreground"
                            style={{ fontSize: "1.18rem", letterSpacing: "-0.02em" }}
                          >
                            {formatINR(r.price_per_night)}
                          </div>
                          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">
                            per night
                          </div>
                        </div>
                      </div>

                      {/* Gold separator */}
                      <div
                        className="w-8 h-px mb-5"
                        style={{ background: "rgba(180,155,90,0.4)" }}
                      />

                      {/* Amenity icons */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {(r.amenities ?? []).slice(0, 5).map((a: string) => {
                          const I = AMENITY_ICON[a];
                          return I ? (
                            <div
                              key={a}
                              title={a}
                              className="flex items-center justify-center"
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: "rgba(180,155,90,0.08)",
                                border: "1px solid rgba(180,155,90,0.2)",
                              }}
                            >
                              <I className="text-gold" style={{ width: 15, height: 15 }} strokeWidth={1.5} />
                            </div>
                          ) : null;
                        })}
                      </div>

                      {/* CTA — always pushed to bottom */}
                      <div className="mt-auto">
                        {isSoldOut ? (
                          <div
                            className="w-full flex items-center justify-center gap-2 font-semibold text-sm cursor-not-allowed select-none"
                            style={{
                              background: "rgba(0,0,0,0.04)",
                              color: "var(--color-muted-foreground)",
                              borderRadius: "12px",
                              padding: "13px 0",
                              border: "1px solid rgba(0,0,0,0.07)",
                            }}
                          >
                            <Ban className="h-4 w-4" /> Sold Out
                          </div>
                        ) : (
                          <Link
                            to="/rooms/$id"
                            params={{ id: r.id }}
                            className="w-full block text-center font-semibold text-sm text-white hover:opacity-90 transition-opacity"
                            style={{
                              background: "var(--color-gold)",
                              borderRadius: "12px",
                              padding: "13px 0",
                              boxShadow: "0 4px 14px -4px rgba(180,155,90,0.5)",
                            }}
                          >
                            View Details &amp; Book{" "}
                            <ArrowRight className="inline h-4 w-4 ml-1" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </section>

    </WebsiteLayout>
  );
}
