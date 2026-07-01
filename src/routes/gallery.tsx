import { createFileRoute } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { motion } from "framer-motion";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: "Gallery — Emirates Inn" },
      {
        name: "description",
        content:
          "Explore the elegant spaces, comfortable rooms, and welcoming atmosphere of Emirates Inn & Emirates Grand Inn through our curated gallery.",
      },
    ],
  }),
  component: Gallery,
});

/* ─── Animation Variants ─────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
};

const imgVariant = {
  hidden: { opacity: 0, y: 22, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.75, ease: "easeOut" },
  },
};

/* ─── Gallery Images ─────────────────────────────────────── */
const PHOTOS: string[] = [
  "1566073771259-6a8506099945",
  "1582719508461-905c673771fd",
  "1631049307264-da0ec9d70304",
  "1551882547-ff40c63fe5fa",
  "1611892440504-42a792e24d32",
  "1590490360182-c33d57733427",
  "1564013799919-ab600027ffc6",
  "1571003123894-1f0594d2b5d9",
  "1578683010236-d716f9a3f461",
  "1582719478250-c89cae4dc85b",
  "1551776235-dde6d482980b",
  "1584132967334-10e028bd69f7",
];

/* ─── Component ──────────────────────────────────────────── */
function Gallery() {
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
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(0,0,0,0.06), transparent)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="px-6 max-w-4xl mx-auto"
        >
          {/* Small label */}
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: 0.1 }}
            className="text-xs font-semibold uppercase text-gold mb-7 inline-block"
            style={{ letterSpacing: "0.35em" }}
          >
            Our Gallery
          </motion.span>

          {/* Main heading */}
          <h1
            className="font-serif font-bold text-foreground tracking-tight leading-tight mb-7"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)" }}
          >
            Discover the Beauty of{" "}
            <span className="italic font-light">Every Stay.</span>
          </h1>

          {/* Gold rule */}
          <div className="w-14 h-px bg-gold/50 mx-auto mb-8" />

          {/* Subtitle */}
          <p
            className="text-muted-foreground leading-relaxed font-light max-w-2xl mx-auto"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)" }}
          >
            Explore the elegant spaces, comfortable rooms, modern amenities, and welcoming
            atmosphere of{" "}
            <strong className="font-medium text-foreground">Emirates Inn</strong> &{" "}
            <strong className="font-medium text-foreground">Emirates Grand Inn</strong> through
            our gallery.
          </p>
        </motion.div>
      </section>

      {/* ── 2. GALLERY ───────────────────────────────────── */}
      <section
        className="py-24"
        style={{ background: "#FAF9F6" }}
      >
        <div className="container-luxe">
          {/* Uniform 3-col grid: 1-col mobile → 2-col tablet → 3-col desktop */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            style={{ gap: "28px" }}
          >
            {PHOTOS.map((id) => (
              <motion.div
                key={id}
                variants={imgVariant}
              >
                <div
                  className="group relative overflow-hidden"
                  style={{
                    borderRadius: "22px",
                    boxShadow:
                      "0 4px 20px -4px rgba(13,35,58,0.08), 0 1px 4px rgba(0,0,0,0.04)",
                    transition: "box-shadow 400ms ease, transform 400ms ease",
                    aspectRatio: "4 / 3",
                  }}
                >
                  {/* Image */}
                  <img
                    src={`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=80`}
                    alt="Emirates Inn — gallery"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05] cursor-pointer"
                    style={{ display: "block" }}
                  />

                  {/* Hover dark overlay — fades in on group hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400"
                    style={{
                      background:
                        "linear-gradient(to bottom, rgba(10,20,35,0.0) 40%, rgba(10,20,35,0.30) 100%)",
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </WebsiteLayout>
  );
}
