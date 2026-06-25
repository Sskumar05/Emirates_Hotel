import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { motion } from "framer-motion";
import { Wifi, Car, Droplet, Camera, Tv, ChefHat, Wine, Sparkles, MapPin, Star, ArrowRight, Crown } from "lucide-react";
import heroImg from "@/assets/hero-hotel.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Emirates Inn & Grand Inn — Luxury Hotels in Dubai" },
      { name: "description", content: "Boutique luxury at Emirates Inn and flagship grandeur at Emirates Grand Inn. Book your stay." },
    ],
  }),
  component: Home,
});

const AMENITIES = [
  { icon: Wifi, label: "Complimentary WiFi" },
  { icon: Car, label: "Car Parking" },
  { icon: Droplet, label: "Hot Water" },
  { icon: Camera, label: "24/7 CCTV" },
  { icon: Tv, label: "Smart TV" },
  { icon: ChefHat, label: "Kitchen Facility" },
  { icon: Wine, label: "Welcome Drink" },
  { icon: Sparkles, label: "Concierge Service" },
];

const TESTIMONIALS = [
  { name: "Aarav S.", text: "Impeccable service and the most elegant rooms I've stayed in. Truly five-star.", rating: 5 },
  { name: "Priya M.", text: "Emirates Grand Inn redefined luxury for us. Will be returning soon.", rating: 5 },
  { name: "Rohan K.", text: "Discreet, warm and refined. The welcome drink set the tone perfectly.", rating: 5 },
];

function Home() {
  return (
    <WebsiteLayout>
      {/* Hero */}
      <section className="relative h-[92vh] min-h-[640px] -mt-20 flex items-center">
        <img src={heroImg} alt="Emirates Inn lobby" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="container-luxe relative z-10 pt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }} className="max-w-3xl">
            <div className="flex items-center gap-2 text-gold mb-6">
              <Crown className="h-5 w-5" />
              <span className="text-xs uppercase tracking-[0.4em]">A Curated Collection</span>
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-6">
              Where elegance<br /><span className="text-gold italic">finds its home.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-10 leading-relaxed">
              Two distinct properties — one shared philosophy of refined hospitality. Discover Emirates Inn & Emirates Grand Inn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/rooms" className="gradient-gold text-primary-foreground px-8 py-4 text-xs uppercase tracking-[0.3em] inline-flex items-center justify-center gap-2 hover:brightness-110 transition">
                Reserve Your Stay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/about" className="border border-gold text-gold px-8 py-4 text-xs uppercase tracking-[0.3em] inline-flex items-center justify-center hover:bg-gold/10 transition">
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hotel showcase */}
      <section className="py-24 lg:py-32">
        <div className="container-luxe">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.4em] text-gold">The Collection</span>
            <h2 className="font-display text-4xl md:text-6xl mt-4">Two Properties. One Standard.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { slug: "emirates-inn", name: "Emirates Inn", tag: "Boutique Refinement", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80" },
              { slug: "emirates-grand-inn", name: "Emirates Grand Inn", tag: "Flagship Luxury", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80" },
            ].map((h, i) => (
              <motion.div key={h.slug} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.8 }}
                className="group relative overflow-hidden bg-card border border-border rounded-sm">
                <div className="aspect-[4/5] overflow-hidden">
                  <img src={h.img} alt={h.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <span className="text-xs uppercase tracking-[0.3em] text-gold">{h.tag}</span>
                  <h3 className="font-display text-4xl mt-2 mb-4">{h.name}</h3>
                  <Link to="/rooms" className="inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] text-foreground hover:text-gold transition">
                    Explore Rooms <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section className="py-24 bg-surface border-y border-border">
        <div className="container-luxe">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.4em] text-gold">Curated Comforts</span>
            <h2 className="font-display text-4xl md:text-5xl mt-4">Amenities, perfected.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {AMENITIES.map((a, i) => (
              <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group p-6 border border-border bg-card text-center hover:border-gold transition-all hover:-translate-y-1">
                <a.icon className="h-8 w-8 text-gold mx-auto mb-4" />
                <p className="text-sm">{a.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery preview */}
      <section className="py-24">
        <div className="container-luxe">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-[0.4em] text-gold">Moments</span>
              <h2 className="font-display text-4xl md:text-5xl mt-3">A glimpse inside.</h2>
            </div>
            <Link to="/gallery" className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gold uppercase tracking-[0.2em]">
              View Gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              "1571003123894-1f0594d2b5d9", "1611892440504-42a792e24d32", "1590490360182-c33d57733427",
              "1551882547-ff40c63fe5fa", "1631049307264-da0ec9d70304", "1564013799919-ab600027ffc6",
              "1582719478250-c89cae4dc85b", "1578683010236-d716f9a3f461",
            ].map((id, i) => (
              <motion.div key={id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className={`overflow-hidden ${i === 0 || i === 5 ? "row-span-2 aspect-square md:aspect-[3/4]" : "aspect-square"}`}>
                <img src={`https://images.unsplash.com/photo-${id}?w=600&q=80`} alt="" loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-surface border-y border-border">
        <div className="container-luxe">
          <div className="text-center mb-16">
            <span className="text-xs uppercase tracking-[0.4em] text-gold">Voices</span>
            <h2 className="font-display text-4xl md:text-5xl mt-4">What our guests say.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-8 bg-card border border-border">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="h-4 w-4 text-gold fill-gold" />)}
                </div>
                <p className="text-muted-foreground italic mb-6 leading-relaxed">"{t.text}"</p>
                <p className="text-sm uppercase tracking-[0.2em] text-gold">— {t.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="container-luxe text-center">
          <MapPin className="h-8 w-8 text-gold mx-auto mb-6" />
          <h2 className="font-display text-4xl md:text-6xl mb-6">Your story begins here.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10">Reserve your suite and let our team craft an unforgettable stay.</p>
          <Link to="/rooms" className="gradient-gold text-primary-foreground px-10 py-4 text-xs uppercase tracking-[0.3em] inline-flex items-center gap-2 hover:brightness-110 transition">
            Begin Reservation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </WebsiteLayout>
  );
}
