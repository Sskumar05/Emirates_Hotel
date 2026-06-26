import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { motion } from "framer-motion";
import { Wifi, Car, Droplet, Camera, Tv, ChefHat, Wine, Sparkles, MapPin, Star, ArrowRight, Building } from "lucide-react";
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
      <section className="relative h-[85vh] min-h-[640px] -mt-20 flex items-center">
        <img src={heroImg} alt="Emirates Inn lobby" className="absolute inset-0 w-full h-full object-cover" width={1920} height={1280} />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="container-luxe relative z-10 pt-20">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-3xl">
            <div className="flex items-center gap-2 text-gold mb-6 font-semibold">
              <Building className="h-5 w-5" />
              <span className="text-xs uppercase tracking-widest">A Curated Collection</span>
            </div>
            <h1 className="font-bold text-5xl md:text-7xl lg:text-8xl leading-tight mb-6 text-white tracking-tight">
              Where elegance<br /><span className="text-gold">finds its home.</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-xl mb-10 leading-relaxed font-medium">
              Two distinct properties — one shared philosophy of refined hospitality. Discover Emirates Inn & Emirates Grand Inn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/rooms" className="bg-gold text-white px-8 py-4 text-sm font-semibold rounded-md shadow-md inline-flex items-center justify-center gap-2 hover:bg-gold-hover transition">
                Reserve Your Stay <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/about" className="bg-white/10 backdrop-blur-sm border border-white/20 text-white px-8 py-4 text-sm font-semibold rounded-md inline-flex items-center justify-center hover:bg-white/20 transition">
                Our Story
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Hotel showcase */}
      <section className="py-24 lg:py-32 bg-background">
        <div className="container-luxe">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">The Collection</span>
            <h2 className="font-bold text-4xl md:text-5xl mt-4 text-foreground tracking-tight">Two Properties. One Standard.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { slug: "emirates-inn", name: "Emirates Inn", tag: "Boutique Refinement", img: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80" },
              { slug: "emirates-grand-inn", name: "Emirates Grand Inn", tag: "Flagship Luxury", img: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=80" },
            ].map((h, i) => (
              <motion.div key={h.slug} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.6 }}
                className="group relative overflow-hidden bg-card rounded-lg shadow-card border border-border flex flex-col">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={h.img} alt={h.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className="p-8 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold mb-2 block">{h.tag}</span>
                    <h3 className="font-bold text-2xl mb-4 text-foreground">{h.name}</h3>
                  </div>
                  <Link to="/rooms" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-gold transition mt-4">
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
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">Curated Comforts</span>
            <h2 className="font-bold text-4xl md:text-5xl mt-4 text-foreground tracking-tight">Amenities, perfected.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {AMENITIES.map((a, i) => (
              <motion.div key={a.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group p-6 rounded-lg bg-card shadow-sm border border-border text-center hover:shadow-md hover:border-gold/50 transition-all">
                <div className="bg-primary/5 h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-gold/10 transition-colors">
                  <a.icon className="h-6 w-6 text-primary group-hover:text-gold transition-colors" />
                </div>
                <p className="text-sm font-medium text-foreground">{a.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery preview */}
      <section className="py-24 bg-background">
        <div className="container-luxe">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-sm font-semibold uppercase tracking-wider text-gold">Moments</span>
              <h2 className="font-bold text-4xl md:text-5xl mt-3 text-foreground tracking-tight">A glimpse inside.</h2>
            </div>
            <Link to="/gallery" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-gold transition">
              View Gallery <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "1571003123894-1f0594d2b5d9", "1611892440504-42a792e24d32", "1590490360182-c33d57733427",
              "1551882547-ff40c63fe5fa", "1631049307264-da0ec9d70304", "1564013799919-ab600027ffc6",
              "1582719478250-c89cae4dc85b", "1578683010236-d716f9a3f461",
            ].map((id, i) => (
              <motion.div key={id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className={`overflow-hidden rounded-lg ${i === 0 || i === 5 ? "row-span-2 aspect-square md:aspect-[3/4]" : "aspect-square"}`}>
                <img src={`https://images.unsplash.com/photo-${id}?w=600&q=80`} alt="" loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container-luxe">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold uppercase tracking-wider text-gold">Voices</span>
            <h2 className="font-bold text-4xl md:text-5xl mt-4 tracking-tight">What our guests say.</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="p-8 bg-card rounded-lg shadow-card text-foreground">
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="h-4 w-4 text-gold fill-gold" />)}
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">Verified Guest</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 bg-surface">
        <div className="container-luxe text-center">
          <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-border">
            <MapPin className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-bold text-4xl md:text-6xl mb-6 text-foreground tracking-tight">Your story begins here.</h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">Reserve your suite and let our team craft an unforgettable stay.</p>
          <Link to="/rooms" className="bg-gold text-white px-10 py-4 text-sm font-semibold rounded-md shadow-md inline-flex items-center gap-2 hover:bg-gold-hover transition">
            Begin Reservation <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </WebsiteLayout>
  );
}
