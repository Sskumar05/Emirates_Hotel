import { createFileRoute, Link } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Phone, Mail, MapPin, Clock, Wifi, Car, ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Emirates Inn" },
      { name: "description", content: "Get in touch with Emirates Inn & Emirates Grand Inn. We're here to assist you with your reservations and inquiries." },
    ],
  }),
  component: Contact,
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

/* ─── Component ──────────────────────────────────────────── */
function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent — we'll respond shortly.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  };

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
            Contact Us
          </motion.span>

          <h1
            className="font-serif font-bold text-foreground tracking-tight leading-tight mb-7"
            style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)" }}
          >
            We're Here to <span className="italic font-light">Welcome You.</span>
          </h1>

          <div className="w-14 h-px bg-gold/50 mx-auto mb-8" />

          <p
            className="text-muted-foreground leading-relaxed font-light max-w-2xl mx-auto"
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.15rem)" }}
          >
            Whether you're planning your next stay, have a question, or need assistance with your reservation, our team is always ready to help.
          </p>
        </motion.div>
      </section>

      {/* ── 2. CONTACT INFORMATION ────────────────────────── */}
      <section className="py-20 bg-background relative z-10 -mt-8">
        <div className="container-luxe">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { Icon: Phone, title: "Phone", desc: "+91 98765 43210" },
              { Icon: Mail, title: "Email", desc: "reservations@emiratesinn.com" },
              { Icon: MapPin, title: "Location", desc: "12 Marina Avenue, Dubai" },
              { Icon: Clock, title: "Reception Hours", desc: "24/7 Guest Assistance" },
            ].map(({ Icon, title, desc }, i) => (
              <motion.div
                key={i}
                variants={cardVariant}
                className="group flex flex-col items-center text-center"
                style={{
                  background: "#FFFFFF",
                  border: "1px solid rgba(180,155,90,0.2)",
                  borderRadius: "22px",
                  padding: "40px 24px",
                  boxShadow: "0 4px 20px -6px rgba(13,35,58,0.06)",
                  transition: "box-shadow 300ms ease, transform 300ms ease",
                }}
                whileHover={{
                  y: -5,
                  boxShadow: "0 14px 36px -8px rgba(13,35,58,0.12), 0 0 0 1px rgba(180,155,90,0.3)",
                }}
              >
                <div
                  className="mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(180,155,90,0.1) 0%, rgba(180,155,90,0.04) 100%)",
                    border: "1px solid rgba(180,155,90,0.25)",
                  }}
                >
                  <Icon className="text-gold" style={{ width: 24, height: 24 }} strokeWidth={1.5} />
                </div>
                <h3 className="font-serif font-bold text-foreground mb-2" style={{ fontSize: "1.1rem" }}>
                  {title}
                </h3>
                <p className="text-muted-foreground font-light text-sm">
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── 3. CONTACT FORM + MAP ─────────────────────────── */}
      <section className="py-24" style={{ background: "#FAF9F6" }}>
        <div className="container-luxe">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            
            {/* LEFT: Contact Form */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="mb-10">
                <h2 className="font-serif font-bold text-foreground text-3xl mb-4">Send a Message</h2>
                <p className="text-muted-foreground font-light text-lg">
                  Fill out the form below and our team will get back to you promptly.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
                style={{
                  background: "#FFFFFF",
                  padding: "40px",
                  borderRadius: "24px",
                  boxShadow: "0 4px 24px -6px rgba(13,35,58,0.06)",
                  border: "1px solid rgba(180,155,90,0.15)",
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Full Name</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Email Address</label>
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@example.com" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors" />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Phone Number</label>
                    <input required type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 890" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Subject</label>
                    <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Reservation Inquiry" className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 block">Message</label>
                  <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we assist you?" rows={5} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors resize-none" />
                </div>

                <button
                  type="submit"
                  className="w-full text-white font-semibold py-4 text-sm rounded-xl transition-opacity hover:opacity-90 uppercase tracking-widest"
                  style={{
                    background: "var(--color-gold)",
                    boxShadow: "0 4px 14px -4px rgba(180,155,90,0.5)",
                  }}
                >
                  Send Message
                </button>
              </form>
            </motion.div>

            {/* RIGHT: Map & Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              className="flex flex-col h-full"
            >
              <div
                className="w-full overflow-hidden mb-8"
                style={{
                  borderRadius: "24px",
                  boxShadow: "0 4px 24px -6px rgba(13,35,58,0.06)",
                  border: "1px solid rgba(180,155,90,0.15)",
                  height: "400px",
                }}
              >
                <iframe
                  title="Emirates Inn Location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14441.785233116812!2d55.1332768078125!3d25.080556200000007!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b5358052445%3A0xc3411b4395682855!2sDubai%20Marina%20-%20Dubai%20-%20United%20Arab%20Emirates!5e0!3m2!1sen!2sus!4v1717000000000!5m2!1sen!2sus"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </div>

              <div
                className="p-8"
                style={{
                  background: "#FFFFFF",
                  borderRadius: "24px",
                  boxShadow: "0 4px 24px -6px rgba(13,35,58,0.06)",
                  border: "1px solid rgba(180,155,90,0.15)",
                }}
              >
                <h3 className="font-serif font-bold text-2xl text-foreground mb-4">Emirates Inn</h3>
                <div className="space-y-4 text-muted-foreground font-light text-sm">
                  <p className="flex items-start gap-3">
                    <MapPin className="text-gold w-5 h-5 shrink-0" />
                    <span>12 Marina Avenue, Dubai<br />United Arab Emirates</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Phone className="text-gold w-5 h-5 shrink-0" />
                    <span>+91 98765 43210</span>
                  </p>
                  <p className="flex items-center gap-3">
                    <Mail className="text-gold w-5 h-5 shrink-0" />
                    <span>reservations@emiratesinn.com</span>
                  </p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── 4. HOTEL INFORMATION ──────────────────────────── */}
      <section className="py-24 bg-background">
        <div className="container-luxe max-w-[1500px] mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="p-10 sm:p-14 text-center"
            style={{
              //background: "#FFFFFF",
              background: "linear-gradient(135deg, #0D1B2A 0%, #162840 50%, #0D1B2A 100%)",
              borderRadius: "24px",
              boxShadow: "0 4px 30px -6px rgba(13,35,58,0.05)",
              border: "1px solid rgba(180,155,90,0.15)",
            }}
          >
            <h2 className="font-serif font-bold text-white text-2xl sm:text-3xl mb-10">
              Essential Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-y-10 gap-x-6 text-left">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-gold shrink-0" strokeWidth={1} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">Check-in</div>
                  <div className="font-medium text-white">3:00 PM</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-gold shrink-0" strokeWidth={1} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">Check-out</div>
                  <div className="font-medium text-white">11:00 AM</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-gold shrink-0" strokeWidth={1} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">Reception</div>
                  <div className="font-medium text-white">24/7 Service</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Car className="w-8 h-8 text-gold shrink-0" strokeWidth={1} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">Parking</div>
                  <div className="font-medium text-white">Complimentary</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Wifi className="w-8 h-8 text-gold shrink-0" strokeWidth={1} />
                <div>
                  <div className="text-xs font-semibold uppercase tracking-widest text-gold mb-1">Internet</div>
                  <div className="font-medium text-white">High-Speed WiFi</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── 5. FINAL BOOKING CTA ──────────────────────────── */}
      <section className="py-32" style={{ background: "#FAF9F6" }}>
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="max-w-3xl mx-auto px-6 text-center"
        >

          <h2
            className="font-serif font-bold text-foreground mb-5 tracking-tight"
            style={{ fontSize: "clamp(2rem, 5vw, 3rem)" }}
          >
            Ready for Your Next Stay?
          </h2>

          <div className="w-14 h-px bg-gold/50 mx-auto mb-7" />

          <p className="text-lg text-muted-foreground mb-12 leading-relaxed font-light max-w-xl mx-auto">
            Experience comfort, elegance, and exceptional hospitality at{" "}
            <strong className="font-medium text-foreground">Emirates Inn</strong> &{" "}
            <strong className="font-medium text-foreground">Emirates Grand Inn</strong>.
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
              Book Now <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>
    </WebsiteLayout>
  );
}
