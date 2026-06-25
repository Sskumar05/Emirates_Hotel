import { createFileRoute } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — Emirates Inn" }] }),
  component: Contact,
});

function Contact() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  return (
    <WebsiteLayout>
      <div className="container-luxe pt-32 pb-20 max-w-5xl">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-[0.4em] text-gold">Get in Touch</span>
          <h1 className="font-display text-5xl md:text-7xl mt-4">Contact Us</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            {[
              { I: Phone, t: "Reservations", v: "+91 98765 43210" },
              { I: Mail, t: "Email", v: "reservations@emiratesinn.com" },
              { I: MapPin, t: "Address", v: "12 Marina Avenue, Dubai" },
            ].map((c) => (
              <div key={c.t} className="flex gap-4">
                <div className="h-12 w-12 border border-gold/30 flex items-center justify-center">
                  <c.I className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-gold">{c.t}</div>
                  <div className="text-foreground mt-1">{c.v}</div>
                </div>
              </div>
            ))}
          </div>
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent — we'll respond shortly."); setForm({ name: "", email: "", message: "" }); }}>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="w-full bg-card border border-border px-4 py-3 focus:border-gold focus:outline-none" />
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="w-full bg-card border border-border px-4 py-3 focus:border-gold focus:outline-none" />
            <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message" rows={6} className="w-full bg-card border border-border px-4 py-3 focus:border-gold focus:outline-none" />
            <button className="gradient-gold text-primary-foreground px-8 py-3 text-xs uppercase tracking-[0.3em] w-full">Send Message</button>
          </form>
        </div>
      </div>
    </WebsiteLayout>
  );
}
