import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR, isoDate, addDays } from "@/lib/hotel";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Search = { roomId?: string };

export const Route = createFileRoute("/booking")({
  validateSearch: (s: Record<string, unknown>): Search => ({ roomId: typeof s.roomId === "string" ? s.roomId : undefined }),
  component: Booking,
});

const guestSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  mobile: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  num_guests: z.number().int().min(1).max(20),
  num_rooms: z.number().int().min(1).max(10),
  check_in_date: z.string(),
  check_in_time: z.string().optional(),
  num_days: z.number().int().min(1).max(60),
});

function Booking() {
  const { roomId } = Route.useSearch();
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    full_name: "", mobile: "", email: "",
    num_guests: 1, num_rooms: 1,
    check_in_date: isoDate(new Date()), check_in_time: "14:00", num_days: 1,
  });

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: async () => (await supabase.from("rooms").select("*, hotels(*)").eq("id", roomId!).maybeSingle()).data,
  });

  if (!roomId) {
    return <WebsiteLayout><div className="container-luxe py-32 text-center">
      <p className="text-muted-foreground mb-4">No room selected.</p>
      <button onClick={() => nav({ to: "/rooms" })} className="border border-gold text-gold px-6 py-2 text-xs uppercase tracking-[0.2em]">Browse Rooms</button>
    </div></WebsiteLayout>;
  }
  if (!room) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground">Loading…</div></WebsiteLayout>;

  const price = Number(room.price_per_night);
  const total = price * form.num_rooms * form.num_days;
  const checkout = isoDate(addDays(form.check_in_date, form.num_days));

  async function submitBooking() {
    const parsed = guestSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    try {
      const { data: customer, error: cErr } = await supabase.from("customers")
        .upsert({ full_name: form.full_name, mobile: form.mobile, email: form.email }, { onConflict: "mobile" })
        .select().single();
      if (cErr) throw cErr;
      const { data: booking, error: bErr } = await supabase.from("bookings").insert({
        customer_id: customer.id, hotel_id: (room as any).hotel_id, category: room.category,
        num_rooms: form.num_rooms, num_guests: form.num_guests,
        check_in_date: form.check_in_date, check_in_time: form.check_in_time,
        num_days: form.num_days, check_out_date: checkout,
        price_per_night: price, total_amount: total,
        status: "pending", payment_status: "pending",
      }).select().single();
      if (bErr) throw bErr;
      nav({ to: "/payment", search: { bookingId: booking.id } as any });
    } catch (e: any) {
      toast.error(e.message ?? "Booking failed");
    }
  }

  const steps = ["Review", "Guest Details", "Summary", "Payment"];

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20 max-w-4xl">
        <div className="flex items-center justify-between mb-12">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center text-xs ${step > i + 1 ? "bg-gold text-primary-foreground" : step === i + 1 ? "bg-gold text-primary-foreground" : "border border-border text-muted-foreground"}`}>
                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div className="ml-3 hidden sm:block">
                <div className={`text-xs uppercase tracking-[0.2em] ${step >= i + 1 ? "text-gold" : "text-muted-foreground"}`}>{s}</div>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-px mx-3 ${step > i + 1 ? "bg-gold" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border p-8 lg:p-12">
          {step === 1 && (
            <div>
              <h2 className="font-display text-3xl mb-6">Review your selection</h2>
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                <img src={(room as any).images?.[0] || "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"} alt="" className="aspect-[4/3] w-full object-cover" />
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-gold">{(room as any).hotels?.name}</div>
                  <h3 className="font-display text-2xl mt-2 mb-4">{CATEGORY_LABELS[room.category]}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{room.description}</p>
                  <div className="text-gold font-display text-3xl">{formatINR(price)}<span className="text-sm text-muted-foreground ml-2">/night</span></div>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="ml-auto block gradient-gold text-primary-foreground px-8 py-3 text-xs uppercase tracking-[0.3em]">Continue <ArrowRight className="inline h-4 w-4 ml-2" /></button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-display text-3xl mb-6">Guest details</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
                <Field label="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                <Field label="No. of Guests" type="number" value={String(form.num_guests)} onChange={(v) => setForm({ ...form, num_guests: Number(v) })} />
                <Field label="No. of Rooms" type="number" value={String(form.num_rooms)} onChange={(v) => setForm({ ...form, num_rooms: Number(v) })} />
                <Field label="No. of Days" type="number" value={String(form.num_days)} onChange={(v) => setForm({ ...form, num_days: Number(v) })} />
                <Field label="Check-in Date" type="date" value={form.check_in_date} onChange={(v) => setForm({ ...form, check_in_date: v })} />
                <Field label="Check-in Time" type="time" value={form.check_in_time} onChange={(v) => setForm({ ...form, check_in_time: v })} />
              </div>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-gold"><ArrowLeft className="inline h-4 w-4 mr-1" />Back</button>
                <button onClick={() => setStep(3)} className="gradient-gold text-primary-foreground px-8 py-3 text-xs uppercase tracking-[0.3em]">Continue <ArrowRight className="inline h-4 w-4 ml-2" /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-display text-3xl mb-6">Booking summary</h2>
              <dl className="divide-y divide-border">
                {[
                  ["Hotel", (room as any).hotels?.name],
                  ["Room Category", CATEGORY_LABELS[room.category]],
                  ["Check-In", `${form.check_in_date} ${form.check_in_time}`],
                  ["Checkout", checkout],
                  ["Rooms", String(form.num_rooms)],
                  ["Guests", String(form.num_guests)],
                  ["Nights", String(form.num_days)],
                  ["Price / night", formatINR(price)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3"><dt className="text-sm text-muted-foreground">{k}</dt><dd className="text-sm">{v}</dd></div>
                ))}
                <div className="flex justify-between py-5 bg-gold/5 px-4 -mx-4 mt-4">
                  <dt className="font-display text-xl text-gold">Total</dt>
                  <dd className="font-display text-2xl text-gold">{formatINR(total)}</dd>
                </div>
              </dl>
              <div className="flex justify-between mt-8">
                <button onClick={() => setStep(2)} className="text-sm text-muted-foreground hover:text-gold"><ArrowLeft className="inline h-4 w-4 mr-1" />Back</button>
                <button onClick={submitBooking} className="gradient-gold text-primary-foreground px-8 py-3 text-xs uppercase tracking-[0.3em]">Proceed to Payment <ArrowRight className="inline h-4 w-4 ml-2" /></button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </WebsiteLayout>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2 block">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border px-4 py-3 text-sm focus:border-gold focus:outline-none" />
    </label>
  );
}
