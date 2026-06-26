import { createFileRoute } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { Wifi, Car, Droplet, Camera, Tv, ChefHat, Wine } from "lucide-react";

export const Route = createFileRoute("/amenities")({
  head: () => ({ meta: [{ title: "Amenities — Emirates Inn" }] }),
  component: Amenities,
});

const ITEMS = [
  { I: Wifi, t: "Complimentary WiFi", d: "High-speed connectivity in every suite and public space." },
  { I: Car, t: "Car Parking", d: "Secure on-site parking with valet service available." },
  { I: Droplet, t: "Hot Water", d: "Round-the-clock hot water in all bathrooms." },
  { I: Camera, t: "24/7 CCTV", d: "Comprehensive surveillance for your peace of mind." },
  { I: Tv, t: "Smart Television", d: "Curated channels and streaming in every room." },
  { I: ChefHat, t: "Kitchen Facility", d: "In-suite kitchens in select rooms — cook at your leisure." },
  { I: Wine, t: "Complimentary Welcome Drink", d: "A signature pour to begin your stay." },
];

function Amenities() {
  return (
    <WebsiteLayout>
      <div className="container-luxe pt-32 pb-20">
        <div className="text-center mb-16">
          <span className="text-sm font-semibold uppercase tracking-wider text-gold">Curated Comforts</span>
          <h1 className="font-bold text-5xl md:text-7xl mt-4 text-foreground tracking-tight">Amenities</h1>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ITEMS.map((it) => (
            <div key={it.t} className="p-8 bg-card rounded-lg shadow-sm border border-border hover:shadow-md hover:border-gold/50 transition-all group">
              <div className="h-14 w-14 bg-primary/5 rounded-full flex items-center justify-center mb-6 group-hover:bg-gold/10 transition-colors">
                <it.I className="h-7 w-7 text-primary group-hover:text-gold transition-colors" />
              </div>
              <h3 className="font-bold text-2xl mb-3 text-foreground">{it.t}</h3>
              <p className="text-sm text-muted-foreground font-medium leading-relaxed">{it.d}</p>
            </div>
          ))}
        </div>
      </div>
    </WebsiteLayout>
  );
}
