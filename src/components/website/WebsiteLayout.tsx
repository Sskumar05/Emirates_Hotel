import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Menu, X, Phone, Mail, MapPin, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import emirates from "../../assets/emirates_logo.png"

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/rooms", label: "Rooms" },
  { to: "/amenities", label: "Amenities" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function WebsiteLayout({ children }: { children?: ReactNode } = {}) {
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 text-white transition-all duration-300" style={{ backgroundColor: "#0A1A2F", borderBottom: "1px solid rgba(255,255,255,0.06)", boxShadow: "0 8px 30px rgba(0,0,0,0.25)" }}>
        <div className="container-luxe flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div>
              {/* <Building className="h-6 w-6 text-primary-foreground transition-transform group-hover:scale-105" /> */}
              <img src={emirates} className="h-15 w-15" />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-xl tracking-tight text-white">Emirates</div>
              {/* <div className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">& Grand Collection</div> */}
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to as "."}
                className={`text-sm font-medium transition-colors ${path === n.to ? "text-white font-semibold" : "text-primary-foreground/80 hover:text-white"}`}>
                {n.label}
              </Link>
            ))}
            <Link to="/rooms" className="bg-gold text-white px-5 py-2.5 text-sm font-medium rounded-md hover:bg-gold-hover transition shadow-sm">
              Request Booking
            </Link>
          </nav>
          <button className="md:hidden text-primary-foreground hover:text-white transition-colors" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X /> : <Menu />}
          </button>
        </div>
        <AnimatePresence>
          {open && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
              className="md:hidden overflow-hidden" style={{ backgroundColor: "#081524", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="container-luxe py-6 flex flex-col gap-4">
                {NAV.map((n) => (
                  <Link key={n.to} to={n.to as "."} onClick={() => setOpen(false)}
                    className={`text-sm font-medium ${path === n.to ? "text-white font-semibold" : "text-primary-foreground/80 hover:text-white"}`}>
                    {n.label}
                  </Link>
                ))}
                <Link to="/rooms" onClick={() => setOpen(false)} className="bg-gold text-white px-5 py-3 text-sm font-medium text-center rounded-md mt-2 shadow-sm">Request Booking</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">{children ?? <Outlet />}</main>

      <footer className="bg-primary text-primary-foreground mt-24">
        <div className="container-luxe py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div>
                {/* <Building className="h-5 w-5 text-white" /> */}
                <img src={emirates} className="h-15 w-15" />
              </div>
              <span className="font-bold text-lg tracking-tight">Emirates Inn</span>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed">A curated collection of boutique and grand hotels delivering reliable comfort and corporate hospitality.</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-6">Explore</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              {NAV.slice(1).map((n) => <li key={n.to}><Link to={n.to as "."} className="hover:text-white transition-colors">{n.label}</Link></li>)}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-6">Contact</h4>
            <ul className="space-y-4 text-sm text-primary-foreground/70">
              <li className="flex gap-3 items-center"><Phone className="h-4 w-4 shrink-0" /><span>+91 73392 26598</span></li>
              <li className="flex gap-3 items-center"><Mail className="h-4 w-4 shrink-0" /><span>reservations@emiratesinn.com</span></li>
              <li className="flex gap-3 items-start"><MapPin className="h-4 w-4 shrink-0 mt-0.5" /><span>East Coast Rd, Velankanni, <br/>Tamil Nadu 611111 - India</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-6">Newsletter</h4>
            <p className="text-sm text-primary-foreground/70 mb-4">Receive exclusive corporate offers and updates.</p>
            <form className="flex gap-2">
              <input type="email" placeholder="your@email.com" className="flex-1 bg-primary-foreground/10 border border-primary-foreground/20 px-3 py-2.5 text-sm rounded-md focus:outline-none focus:border-white text-white placeholder:text-primary-foreground/50 transition-colors" />
              <button className="bg-gold text-white px-4 text-sm font-medium rounded-md hover:bg-gold-hover transition shadow-sm">Join</button>
            </form>
          </div>
        </div>
        <div className="border-t border-primary-foreground/10">
          <div className="container-luxe py-6 flex flex-col md:flex-row justify-between items-center gap-3 text-sm text-primary-foreground/50">
            <span>© {new Date().getFullYear()} Emirates Inn & Emirates Grand Inn. All rights reserved.</span>
            <div className="flex gap-4">
              <Link to="/" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/" className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
