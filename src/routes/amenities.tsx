import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import {
  Wifi, Car, Droplet, Camera, Tv, ChefHat,
  ArrowRight, ShieldCheck, Sparkles, Heart
} from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/amenities")({
  head: () => ({
    meta: [
      { title: "Amenities — Emirates Inn" },
      { name: "description", content: "Discover the thoughtfully curated amenities at Emirates Inn & Emirates Grand Inn — designed for exceptional comfort, convenience, and a premium guest experience." },
    ],
  }),
  component: Amenities,
});

/* ─── Animation Variants ─────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const cardVariant = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

/* ─── Amenity Data ───────────────────────────────────────── */
const AMENITIES = [
  {
    Icon: Wifi,
    title: "Complimentary High-Speed WiFi",
    desc: "Stay effortlessly connected with enterprise-grade, high-speed wireless internet available throughout every room and public space.",
  },
  {
    Icon: Car,
    title: "Secure Car Parking",
    desc: "Enjoy peace of mind with our dedicated, CCTV-monitored secure parking facility, available to all guests at no additional cost.",
  },
  {
    Icon: Tv,
    title: "Smart Television",
    desc: "Unwind with our curated Smart TV selection featuring premium cable channels and streaming-ready displays in every room.",
  },
  {
    Icon: Droplet,
    title: "24/7 Hot Water",
    desc: "Indulge in a rejuvenating experience with round-the-clock hot water, reliably delivered to every bathroom at all hours.",
  },
  {
    Icon: Camera,
    title: "CCTV Security",
    desc: "Your safety is our priority. Comprehensive, discreet surveillance coverage ensures a secure and worry-free environment throughout your stay.",
  },
  {
    Icon: ChefHat,
    title: "Kitchen Facility",
    desc: "Select rooms feature fully equipped kitchen facilities, offering the convenience and comfort of a home away from home.",
  },
];

/* ─── Guest Highlights ───────────────────────────────────── */
const HIGHLIGHTS = [
  {
    Icon: Sparkles,
    title: "Exceptional Comfort",
    desc: "Every room is meticulously designed to provide a peaceful, relaxing atmosphere where rest and rejuvenation come naturally.",
  },
  {
    Icon: ShieldCheck,
    title: "Modern Convenience",
    desc: "Enjoy thoughtfully selected facilities and premium amenities that make every aspect of your stay completely effortless.",
  },
  {
    Icon: Heart,
    title: "Trusted Hospitality",
    desc: "Experience warmth, discretion, and genuine care — hospitality crafted entirely around your comfort and satisfaction.",
  },
];

/* ─── Component ──────────────────────────────────────────── */
function Amenities() {
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
        {/* Subtle decorative line */}
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
          {/* Small label */}
          <motion.span
            initial={{ opacity: 0, letterSpacing: "0.15em" }}
            animate={{ opacity: 1, letterSpacing: "0.35em" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-xs font-semibold uppercase text-gold mb-7 inline-block"
            style={{ letterSpacing: "0.35em" }}
          >
            Our Amenities
          </motion.span>

          {/* Main heading */}
          <h1
            className="font-serif font-bold text-foreground tracking-tight leading-tight mb-7"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)" }}
          >
            Comfort Designed Around{" "}
            <span className="italic font-light">Every Stay.</span>
          </h1>

          {/* Gold rule */}
          <div className="w-14 h-px bg-gold/50 mx-auto mb-8" />

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto font-light">
            Every stay at <strong className="font-medium text-foreground">Emirates Inn</strong> &{" "}
            <strong className="font-medium text-foreground">Emirates Grand Inn</strong> is thoughtfully
            enhanced with carefully selected amenities, modern conveniences, and personalized comforts
            — ensuring every guest enjoys a seamless and memorable experience.
          </p>
        </motion.div>
      </section>

      {/* ── 2. INTRODUCTION ──────────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container-luxe">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-3xl mx-auto text-center"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-5 inline-block">
              Curated Comforts
            </span>
            <h2 className="font-serif font-bold text-foreground mb-7" style={{ fontSize: "clamp(1.9rem, 4vw, 2.8rem)" }}>
              Everything You Need for a Comfortable Stay
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed font-light">
              Each amenity at our properties has been individually selected with a single purpose: to
              provide you with the highest possible standard of convenience, relaxation, safety, and
              premium guest experience. We believe that the finest hospitality is found not in grand
              gestures, but in the quiet excellence of every considered detail.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── 3. AMENITIES GRID ────────────────────────────── */}
      <section
        className="py-24 border-y border-border"
        style={{ background: "linear-gradient(180deg, #F9F7F4 0%, #FAF9F6 100%)" }}
      >
        <div className="container-luxe">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7"
            style={{ alignItems: "stretch" }}
          >
            {AMENITIES.map(({ Icon, title, desc }) => (
              <motion.div
                key={title}
                variants={cardVariant}
                className="amenity-card group"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(180,155,90,0.22)",
                  borderRadius: "22px",
                  padding: "38px 36px",
                  boxShadow: "0 4px 24px -6px rgba(13,35,58,0.07), 0 1px 4px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "box-shadow 300ms ease, border-color 300ms ease, transform 300ms ease",
                }}
                whileHover={{
                  y: -6,
                  boxShadow: "0 16px 40px -8px rgba(13,35,58,0.13), 0 0 0 1px rgba(180,155,90,0.35)",
                }}
              >
                {/* Icon container */}
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-center mb-7"
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(180,155,90,0.1) 0%, rgba(180,155,90,0.05) 100%)",
                    border: "1px solid rgba(180,155,90,0.25)",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    className="text-gold group-hover:scale-110 transition-transform duration-300"
                    style={{ width: 26, height: 26 }}
                    strokeWidth={1.5}
                  />
                </motion.div>

                {/* Title */}
                <h3
                  className="font-serif font-bold text-foreground mb-3"
                  style={{ fontSize: "1.13rem", letterSpacing: "-0.01em" }}
                >
                  {title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground leading-relaxed font-light" style={{ fontSize: "0.92rem" }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 4. WHY GUESTS LOVE OUR AMENITIES ─────────────── */}
      <section className="py-24 bg-background">
        <div className="container-luxe">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-center mb-16"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold mb-4 inline-block">
              Guest Experience
            </span>
            <h2 className="font-serif font-bold text-foreground" style={{ fontSize: "clamp(1.8rem, 4vw, 2.6rem)" }}>
              Why Guests Love Our Amenities
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {HIGHLIGHTS.map(({ Icon, title, desc }, i) => (
              <motion.div
                key={i}
                variants={cardVariant}
                className="group text-center"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(180,155,90,0.2)",
                  borderRadius: "20px",
                  padding: "44px 36px",
                  boxShadow: "0 4px 20px -6px rgba(13,35,58,0.06)",
                  transition: "box-shadow 300ms ease, border-color 300ms ease, transform 300ms ease",
                }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 14px 36px -8px rgba(13,35,58,0.12), 0 0 0 1px rgba(180,155,90,0.3)",
                }}
              >
                {/* Icon */}
                <div
                  className="mx-auto mb-7 flex items-center justify-center group-hover:scale-105 transition-transform duration-300"
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(180,155,90,0.12) 0%, rgba(180,155,90,0.05) 100%)",
                    border: "1px solid rgba(180,155,90,0.28)",
                  }}
                >
                  <Icon className="text-gold" style={{ width: 28, height: 28 }} strokeWidth={1.5} />
                </div>

                <h3 className="font-serif font-bold text-foreground mb-3" style={{ fontSize: "1.2rem" }}>
                  {title}
                </h3>
                <p className="text-muted-foreground leading-relaxed font-light" style={{ fontSize: "0.92rem" }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 5. LUXURY IMAGE BANNER ────────────────────────── */}
      <section
        className="relative py-28 flex items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0D1B2A 0%, #162840 50%, #0D1B2A 100%)",
        }}
      >
        {/* Decorative pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Gold accent lines */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(180,155,90,0.4), transparent)" }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: "linear-gradient(to right, transparent, rgba(180,155,90,0.4), transparent)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="relative z-10 text-center px-6 max-w-4xl mx-auto"
        >
          {/* Small gold rule */}
          <div className="w-10 h-px bg-gold/60 mx-auto mb-8" />

          <h2
            className="font-serif font-bold text-white tracking-tight leading-tight mb-6"
            style={{ fontSize: "clamp(2rem, 5vw, 3.2rem)" }}
          >
            Every Detail Designed{" "}
            <span className="italic font-light text-gold/90">Around Your Comfort.</span>
          </h2>

          <p className="text-white/65 max-w-xl mx-auto font-light leading-relaxed" style={{ fontSize: "1.1rem" }}>
            Experience hospitality where modern comfort meets genuine care — crafted to exceed every expectation.
          </p>

          <div className="w-10 h-px bg-gold/60 mx-auto mt-8" />
        </motion.div>
      </section>

      {/* ── 6. FINAL CTA ──────────────────────────────────── */}
      <section
        className="py-32 bg-background"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" }}
          className="max-w-3xl mx-auto px-6 text-center"
        >
          {/* Decorative icon */}
         

          <h2
            className="font-serif font-bold text-foreground mb-5 tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Ready to Experience Exceptional Comfort?
          </h2>

          {/* Gold rule */}
          <div className="w-14 h-px bg-gold/50 mx-auto mb-7" />

          <p className="text-lg text-muted-foreground mb-12 leading-relaxed font-light max-w-xl mx-auto">
            Book your stay at <strong className="font-medium text-foreground">Emirates Inn</strong> &{" "}
            <strong className="font-medium text-foreground">Emirates Grand Inn</strong> and enjoy
            thoughtfully designed amenities with outstanding hospitality.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
            <Link
              to="/rooms"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl border border-foreground text-foreground font-medium hover:bg-foreground hover:text-background transition-colors duration-300 uppercase tracking-widest text-sm"
            >
              Explore Rooms
            </Link>
            <Link
              to="/rooms"
              className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gold text-white font-medium hover:bg-gold/90 transition-colors duration-300 uppercase tracking-widest text-sm shadow-[0_4px_20px_0_rgba(180,155,90,0.35)] inline-flex items-center justify-center gap-3"
            >
              Book Your Stay <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

    </WebsiteLayout>
  );
}
