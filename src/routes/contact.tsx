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
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">Get in Touch</span>
          <h1 className="font-bold text-5xl md:text-7xl mt-4 text-foreground tracking-tight">Contact Us</h1>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-8">
            {[
              { I: Phone, t: "Reservations", v: "+91 98765 43210" },
              { I: Mail, t: "Email", v: "reservations@emiratesinn.com" },
              { I: MapPin, t: "Address", v: "12 Marina Avenue, Dubai" },
            ].map((c) => (
              <div key={c.t} className="flex gap-6 items-center">
                <div className="h-14 w-14 bg-primary/5 rounded-md flex items-center justify-center shrink-0">
                  <c.I className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary">{c.t}</div>
                  <div className="text-foreground font-medium mt-1">{c.v}</div>
                </div>
              </div>
            ))}
          </div>
          <form className="space-y-5 bg-card p-8 rounded-lg shadow-sm border border-border" onSubmit={(e) => { e.preventDefault(); toast.success("Message sent — we'll respond shortly."); setForm({ name: "", email: "", message: "" }); }}>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your Name" className="w-full bg-background border border-border rounded-md px-4 py-3 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Email</label>
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="your@email.com" className="w-full bg-background border border-border rounded-md px-4 py-3 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">Message</label>
              <textarea required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="How can we help you?" rows={5} className="w-full bg-background border border-border rounded-md px-4 py-3 focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors resize-none" />
            </div>
            <button className="w-full bg-gold text-white font-semibold py-4 text-sm rounded-md shadow-md hover:bg-gold-hover transition">Send Message</button>
          </form>
        </div>
      </div>
    </WebsiteLayout>
  );
}
