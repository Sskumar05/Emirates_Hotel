import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Menu, X, Phone, Mail, MapPin, Crown } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/rooms", label: "Rooms" },
  { to: "/amenities", label: "Amenities" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function WebsiteLayout({ children }: { children?: ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 glass">
        <div className="container-luxe flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 group">
            <Crown className="h-6 w-6 text-gold transition-transform group-hover:scale-110" />
            <div className="leading-tight">
              <div className="font-display text-xl tracking-wide">Emirates Inn</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">& Grand Collection</div>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to as "."}
                className={`text-sm uppercase tracking-[0.2em] transition-colors ${path === n.to ? "text-gold" : "text-muted-foreground hover:text-gold"}`}>
                {n.label}
              </Link>
            ))}
            <Link to="/rooms" className="gradient-gold text-primary-foreground px-5 py-2.5 text-xs uppercase tracking-[0.2em] font-medium rounded-sm hover:brightness-110 transition">
              Book Now
            </Link>
          </nav>
          <button className="md:hidden text-gold" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
              className="md:hidden overflow-hidden border-t border-border">
              <div className="container-luxe py-6 flex flex-col gap-4">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to as "."} onClick={() => setOpen(false)}
                    className={`text-sm uppercase tracking-[0.2em] ${path === n.to ? "text-gold" : "text-muted-foreground"}`}>
                    {n.label}
                  </Link>
                ))}
                <Link to="/rooms" onClick={() => setOpen(false)} className="gradient-gold text-primary-foreground px-5 py-3 text-xs uppercase tracking-[0.2em] text-center rounded-sm">Book Now</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children ?? <Outlet />}</main>

      <footer className="border-t border-border bg-surface mt-24">
        <div className="container-luxe py-16 grid md:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Crown className="h-5 w-5 text-gold" />
              <span className="font-display text-lg">Emirates Inn</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">A curated collection of boutique and grand hotels delivering refined comfort and timeless hospitality.</p>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {NAV.slice(1).map((n) => <li key={n.to}><Link to={n.to as "."} className="hover:text-gold transition-colors">{n.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex gap-2"><Phone className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>+91 98765 43210</span></li>
              <li className="flex gap-2"><Mail className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>reservations@emiratesinn.com</span></li>
              <li className="flex gap-2"><MapPin className="h-4 w-4 text-gold shrink-0 mt-0.5" /><span>12 Marina Avenue, Dubai</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Newsletter</h4>
            <p className="text-sm text-muted-foreground mb-3">Receive exclusive offers and curated stays.</p>
            <form className="flex gap-2">
              <input type="email" placeholder="your@email.com" className="flex-1 bg-background border border-border px-3 py-2 text-sm rounded-sm focus:outline-none focus:border-gold" />
              <button className="bg-gold text-primary-foreground px-4 text-xs uppercase tracking-[0.2em] rounded-sm hover:bg-gold-hover transition">Join</button>
            </form>
          </div>
        </div>
        <div className="hairline">
          <div className="container-luxe py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Emirates Inn & Emirates Grand Inn. All rights reserved.</span>
            <span>Crafted with elegance.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
