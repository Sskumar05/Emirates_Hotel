import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Hotel, Sliders, Mail } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: Settings });

function Settings() {
  const { data: hotels = [] } = useQuery({ queryKey: ["hotels"], queryFn: async () => (await supabase.from("hotels").select("*")).data ?? [] });
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6"><Hotel className="h-5 w-5 text-gold" /><h3 className="font-display text-xl">Hotel Settings</h3></div>
        <div className="space-y-3">
          {hotels.map((h: any) => (
            <div key={h.id} className="flex justify-between py-3 border-b border-border last:border-0">
              <div>
                <div className="font-medium">{h.name}</div>
                <div className="text-xs text-muted-foreground">{h.address}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">{h.phone}<br />{h.email}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6"><Sliders className="h-5 w-5 text-gold" /><h3 className="font-display text-xl">General Settings</h3></div>
        <div className="space-y-4 text-sm">
          <Setting label="Currency" value="INR (₹)" />
          <Setting label="Time Zone" value="Asia/Kolkata" />
          <Setting label="Default Check-in" value="14:00" />
          <Setting label="Default Check-out" value="12:00" />
        </div>
      </div>
      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6"><Bell className="h-5 w-5 text-gold" /><h3 className="font-display text-xl">Notifications</h3></div>
        <div className="space-y-3 text-sm">
          <Toggle label="Email confirmations" defaultOn />
          <Toggle label="SMS/WhatsApp confirmations" defaultOn />
          <Toggle label="Daily summary email" defaultOn />
        </div>
      </div>
      <div className="bg-card border border-border p-8">
        <div className="flex items-center gap-3 mb-6"><Mail className="h-5 w-5 text-gold" /><h3 className="font-display text-xl">Integrations</h3></div>
        <ul className="text-sm space-y-2">
          <li className="flex justify-between"><span>Razorpay (Payments)</span><span className="text-amber-400">Ready — keys required</span></li>
          <li className="flex justify-between"><span>Resend (Email)</span><span className="text-amber-400">Ready — keys required</span></li>
          <li className="flex justify-between"><span>Cloudinary (Media)</span><span className="text-amber-400">Ready — keys required</span></li>
          <li className="flex justify-between"><span>pdf-lib (Invoices)</span><span className="text-emerald-400">Active</span></li>
        </ul>
      </div>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between py-2 border-b border-border last:border-0"><span className="text-muted-foreground">{label}</span><span>{value}</span></div>;
}
function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="accent-[var(--color-gold)] w-5 h-5" />
    </label>
  );
}
