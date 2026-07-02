import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR, isoDate, addDays } from "@/lib/hotel";
import { motion } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { sendAdminNotification } from "@/lib/email";
import { useState } from "react";

/** Format ISO date string as "28 Jun 2026" */
function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

type Search = {
  roomId?: string;
  hotelId?: string;
  checkInDate?: string;
  numDays?: number;
  numGuests?: number;
  numRooms?: number;
};

export const Route = createFileRoute("/booking")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    roomId: typeof s.roomId === "string" ? s.roomId : undefined,
    hotelId: typeof s.hotelId === "string" ? s.hotelId : undefined,
    checkInDate: typeof s.checkInDate === "string" ? s.checkInDate : undefined,
    numDays: typeof s.numDays === "number" ? s.numDays : undefined,
    numGuests: typeof s.numGuests === "number" ? s.numGuests : undefined,
    numRooms: typeof s.numRooms === "number" ? s.numRooms : undefined,
  }),
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
  const search = Route.useSearch();
  const roomId = search.roomId;
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  
  const [form, setForm] = useState({
    full_name: "", mobile: "", email: "",
    num_guests: search.numGuests || 1,
    num_rooms: search.numRooms || 1,
    check_in_date: search.checkInDate || isoDate(new Date()),
    check_in_time: "14:00",
    num_days: search.numDays || 1,
  });

  const { data: room } = useQuery({
    queryKey: ["room", roomId],
    enabled: !!roomId,
    queryFn: async () => (await supabase.from("rooms").select("*, hotels(*)").eq("id", roomId!).maybeSingle()).data,
  });

  if (!roomId) {
    return <WebsiteLayout><div className="container-luxe py-32 text-center">
      <p className="text-muted-foreground font-medium mb-4">No room selected.</p>
      <button onClick={() => nav({ to: "/rooms" })} className="border border-gold text-gold hover:bg-gold/10 transition px-6 py-2.5 text-sm font-semibold rounded-md">Browse Rooms</button>
    </div></WebsiteLayout>;
  }
  if (!room) return <WebsiteLayout><div className="container-luxe py-32 text-center text-muted-foreground font-medium">Loading…</div></WebsiteLayout>;

  const price = Number(room.price_per_night);
  const total = price * form.num_rooms * form.num_days;
  const checkout = isoDate(addDays(form.check_in_date, form.num_days));

  async function submitBooking() {
    const parsed = guestSchema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSubmitting(true);
    try {
      // ── Step 1: upsert customer ────────────────────────────────────────────
      const { data: customerId, error: cErr } = await supabase.rpc("upsert_customer_for_booking", {
        p_full_name: form.full_name,
        p_mobile: form.mobile,
        p_email: form.email,
      });
      if (cErr) throw cErr;

      // ── Step 2: find available rooms to assign ────────────────────────────
      // Get all non-maintenance sibling rooms of the specific room type
      let srQuery = supabase
        .from("rooms")
        .select("id")
        .eq("hotel_id", (room as any).hotel_id)
        .eq("category", (room as any).category)
        .neq("status", "maintenance");
        
      if ((room as any).room_type) {
        srQuery = srQuery.eq("room_type", (room as any).room_type);
      } else {
        srQuery = srQuery.is("room_type", null);
      }
      
      const { data: siblingRooms, error: srErr } = await srQuery;
      if (srErr) throw srErr;

      // Get overlapping active bookings to know which rooms are already taken
      const { data: overlapping, error: ovErr } = await supabase
        .from("bookings")
        .select("assigned_room_ids")
        .eq("hotel_id", (room as any).hotel_id)
        .eq("category", (room as any).category)
        .in("status", ["pending", "confirmed", "checked_in"])
        .lt("check_in_date", checkout)
        .gt("check_out_date", form.check_in_date);
      if (ovErr) throw ovErr;

      const bookedIds = new Set<string>(
        (overlapping ?? []).flatMap((b: any) => b.assigned_room_ids ?? []),
      );
      const available = (siblingRooms ?? []).filter((r: any) => !bookedIds.has(r.id));

      if (available.length < form.num_rooms) {
        throw new Error(
          `Only ${available.length} room${available.length !== 1 ? "s" : ""} available for these dates. Please adjust your selection.`,
        );
      }

      // Pick first N available room IDs
      const assignedRoomIds = available.slice(0, form.num_rooms).map((r: any) => r.id);

      // ── Step 3: insert booking with room assignments already set ──────────
      const { data: booking, error: bErr } = await supabase
        .from("bookings")
        .insert({
          customer_id: customerId,
          hotel_id: (room as any).hotel_id,
          category: (room as any).category,
          num_rooms: form.num_rooms,
          num_guests: form.num_guests,
          check_in_date: form.check_in_date,
          check_in_time: form.check_in_time,
          num_days: form.num_days,
          check_out_date: checkout,
          price_per_night: price,
          total_amount: total,
          status: "pending",
          payment_status: "pending",
          assigned_room_ids: assignedRoomIds,
        })
        .select()
        .single();
      if (bErr) throw bErr;

      // ── Step 4: fire-and-forget admin notification ────────────────────────
      sendAdminNotification({
        bookingCode: booking.booking_code,
        customerName: form.full_name,
        customerEmail: form.email,
        customerMobile: form.mobile,
        hotelName: (room as any).hotels?.name ?? "Emirates Grand Inn",
        roomType: CATEGORY_LABELS[(room as any).category] ?? (room as any).category,
        checkIn: form.check_in_date,
        checkOut: checkout,
        numGuests: form.num_guests,
        numRooms: form.num_rooms,
        numDays: form.num_days,
        totalAmount: formatINR(total),
        createdAt: new Date().toLocaleString("en-IN"),
      }).catch((err) => console.warn("[booking] Admin notification failed:", err));

      nav({ to: "/payment", search: { bookingId: booking.id } as any });
    } catch (e: any) {
      toast.error(e.message ?? "Booking failed");
    } finally {
      setSubmitting(false);
    }
  }

  const steps = ["Review", "Guest Details", "Summary", "Payment"];

  return (
    <WebsiteLayout>
      <div className="container-luxe pt-28 pb-20 max-w-4xl">
        <div className="flex items-center justify-between mb-12">
          {steps.map((s, i) => (
            <div key={s} className="flex-1 flex items-center">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${step > i + 1 ? "bg-primary text-white" : step === i + 1 ? "bg-primary text-white" : "border border-border text-muted-foreground bg-card"}`}>
                {step > i + 1 ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <div className="ml-3 hidden sm:block">
                <div className={`text-xs font-bold uppercase tracking-wider ${step >= i + 1 ? "text-primary" : "text-muted-foreground"}`}>{s}</div>
              </div>
              {i < steps.length - 1 && <div className={`flex-1 h-1 mx-4 rounded-full ${step > i + 1 ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card shadow-card rounded-lg border border-border p-8 lg:p-12">
          {step === 1 && (
            <div>
              <h2 className="font-bold text-3xl mb-8 text-foreground tracking-tight">Review your selection</h2>
              <div className="grid sm:grid-cols-2 gap-8 mb-10">
                <img src={(room as any).images?.[0] || "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"} alt="" className="aspect-[4/3] w-full object-cover rounded-md shadow-sm" />
                <div className="flex flex-col justify-center">
                  <div className="text-xs font-semibold uppercase tracking-wider text-gold mb-1">{(room as any).hotels?.name}</div>
                  <h3 className="font-bold text-2xl mb-4 text-foreground">{CATEGORY_LABELS[room.category]}</h3>
                  <div className="text-primary font-bold text-3xl mb-6">{formatINR(price)}<span className="text-sm text-muted-foreground font-semibold ml-2">/night</span></div>
                  
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2.5 border border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Check-In</span>
                      <span className="text-sm font-semibold">{fmtDate(form.check_in_date)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Check-Out</span>
                      <span className="text-sm font-semibold text-primary">{fmtDate(checkout)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Duration</span>
                      <span className="text-sm font-semibold">{form.num_days} {form.num_days === 1 ? "Night" : "Nights"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Guests</span>
                      <span className="text-sm font-semibold">{form.num_guests} {form.num_guests === 1 ? "Guest" : "Guests"}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-border mt-1">
                      <span className="font-bold">Total Amount</span>
                      <span className="font-bold text-primary">{formatINR(total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <button onClick={() => setStep(2)} className="ml-auto flex items-center justify-center gap-2 bg-gold text-white px-8 py-3.5 text-sm font-semibold rounded-md shadow-md hover:bg-gold-hover transition">Continue <ArrowRight className="h-4 w-4" /></button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-bold text-3xl mb-8 text-foreground tracking-tight">Guest details</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Full Name *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Mobile Number *" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
                <div className="sm:col-span-2">
                  <Field label="Email Address *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                </div>
              </div>
              
              <div className="mt-8 bg-gold/10 text-gold-hover p-4 rounded-md border border-gold/20 flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 shrink-0 text-gold" />
                <p className="text-sm font-medium">Your room details (Check-in, Duration, Guests) have been saved from your selection. Please provide your contact information to proceed.</p>
              </div>

              <div className="flex justify-between items-center mt-10 pt-6 border-t border-border">
                <button onClick={() => setStep(1)} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Back</button>
                <button onClick={() => setStep(3)} className="flex items-center justify-center gap-2 bg-gold text-white px-8 py-3.5 text-sm font-semibold rounded-md shadow-md hover:bg-gold-hover transition">Continue <ArrowRight className="h-4 w-4" /></button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-bold text-3xl mb-8 text-foreground tracking-tight">Booking summary</h2>
              <dl className="divide-y divide-border border border-border rounded-md overflow-hidden bg-background">
                {[
                  ["Hotel", (room as any).hotels?.name],
                  ["Room Category", CATEGORY_LABELS[room.category]],
                  ["Number of Rooms", `${form.num_rooms} Room${form.num_rooms !== 1 ? "s" : ""}`],
                  ["Check-In", `${fmtDate(form.check_in_date)} · ${form.check_in_time}`],
                  ["Check-Out", fmtDate(checkout)],
                  ["Duration", `${form.num_days} ${form.num_days === 1 ? "Night" : "Nights"}`],
                  ["Guests", `${form.num_guests} ${form.num_guests === 1 ? "Guest" : "Guests"}`],
                  ["Price / room / night", formatINR(price)],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-4 px-4 sm:px-6">
                    <dt className="text-sm font-semibold text-muted-foreground">{k}</dt>
                    <dd className="text-sm font-bold text-foreground text-right break-words max-w-[60%]">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-5 bg-primary/5 px-6 items-center">
                  <dt className="font-bold text-lg text-primary">Total Amount</dt>
                  <dd className="font-bold text-2xl text-primary">{formatINR(total)}</dd>
                </div>
              </dl>
              <div className="flex justify-between items-center mt-10">
                <button onClick={() => setStep(2)} className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center"><ArrowLeft className="h-4 w-4 mr-2" />Back</button>
                <button disabled={submitting} onClick={submitBooking} className="flex items-center justify-center gap-2 bg-gold text-white px-8 py-3.5 text-sm font-semibold rounded-md shadow-md hover:bg-gold-hover transition disabled:opacity-60 disabled:cursor-not-allowed">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Proceed to Payment <ArrowRight className="h-4 w-4" />
                </button>
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
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full bg-background border border-border rounded-md px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors" />
    </label>
  );
}
