import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WebsiteLayout } from "@/components/website/WebsiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORY_LABELS, formatINR, isoDate, addDays, fmtDateTime, getDurationLabel, getRateLabel } from "@/lib/hotel";
import { motion } from "framer-motion";
import { Check, ArrowRight, ArrowLeft, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { sendAdminNotification } from "@/lib/email";
import { useState } from "react";

/** Format ISO date string as "28 Jun 2026" - legacy, remove usage where we need time too */
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
  full_name: z.string().trim().min(2, "Full name is required").max(100),
  mobile: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian mobile number"),
  whatsapp: z.string().trim().regex(/^[6-9]\d{9}$/, "Please enter a valid 10-digit Indian WhatsApp number"),
  email: z.string().trim().email("Please enter a valid email address").max(255),
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
    full_name: "", mobile: "", whatsapp: "", email: "",
    num_guests: search.numGuests || 1,
    num_rooms: search.numRooms || 1,
    check_in_date: search.checkInDate || isoDate(new Date()),
    check_in_time: "14:00",
    num_days: search.numDays || 1,
  });

  const { data: stayModeData } = useQuery({
    queryKey: ["system_settings", "global_stay_mode"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "global_stay_mode")
          .maybeSingle();
        // Table may not exist yet (migration pending) — fall back gracefully
        if (error) return "standard";
        if (data) {
          let val = data.value;
          if (typeof val === "string") val = val.replace(/^"|"$/g, "");
          return val;
        }
        return "standard";
      } catch {
        return "standard";
      }
    },
    // Never throw to UI — always resolve with a default
    retry: false,
  });

  const is12HoursMode = stayModeData === "12_hours";

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

  const standardPrice = Number(room.price_per_night);
  const hours12Price = Number(room.price_12_hours || 0);
  
  const price = is12HoursMode ? hours12Price : standardPrice;
  const total = is12HoursMode 
    ? price * form.num_rooms 
    : price * form.num_rooms * form.num_days;
    
  let checkout = isoDate(addDays(form.check_in_date, form.num_days));
  let checkoutTime = "12:00";
  
  // For 12h stay, compute checkout date+time by adding exactly 12h to check_in datetime
  const checkInMs = new Date(`${form.check_in_date}T${form.check_in_time || "14:00"}:00`).getTime();
  const checkOutMs = is12HoursMode
    ? checkInMs + 12 * 60 * 60 * 1000
    : new Date(`${isoDate(addDays(form.check_in_date, form.num_days))}T12:00:00`).getTime();

  if (is12HoursMode) {
    const d = new Date(checkOutMs);
    checkout = d.toISOString().split("T")[0];
    checkoutTime = d.toTimeString().slice(0, 5);
  }

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

      // Get all ACTIVE (confirmed / checked_in) bookings to check room conflicts.
      // We use confirmed + checked_in only — pending bookings have not been paid yet
      // and their room allocation is considered tentative (overwritten at payment).
      const { data: allActive, error: ovErr } = await supabase
        .from("bookings")
        .select("assigned_room_ids, check_in_date, check_in_time, check_out_date, stay_type")
        .eq("hotel_id", (room as any).hotel_id)
        .eq("category", (room as any).category)
        .in("status", ["confirmed", "checked_in"]);
      if (ovErr) throw ovErr;

      // requestedStart / requestedEnd are pre-computed above as checkInMs / checkOutMs
      const requestedStart = checkInMs;
      const requestedEnd = checkOutMs;

      const overlapping = (allActive ?? []).filter((b: any) => {
        // Parse existing booking's start time
        const bStart = new Date(`${b.check_in_date}T${b.check_in_time || "14:00"}:00`).getTime();
        // Compute existing booking's end time the same way
        const bEnd = b.stay_type === "12_hours"
          ? bStart + 12 * 60 * 60 * 1000
          : new Date(`${b.check_out_date}T12:00:00`).getTime();
        // Standard interval overlap: A overlaps B iff A.start < B.end && A.end > B.start
        return bStart < requestedEnd && bEnd > requestedStart;
      });

      const bookedIds = new Set<string>(
        overlapping.flatMap((b: any) => b.assigned_room_ids ?? []),
      );
      const available = (siblingRooms ?? []).filter((r: any) => !bookedIds.has(r.id));

      if (available.length < form.num_rooms) {
        throw new Error(
          `Only ${available.length} room${available.length !== 1 ? "s" : ""} available for the selected time. Please adjust your selection.`,
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
          stay_type: is12HoursMode ? "12_hours" : "standard",
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
        numDays: is12HoursMode ? 0 : form.num_days,
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
                    {is12HoursMode && (
                      <div className="bg-orange-500/10 text-orange-600 border border-orange-500/20 px-3 py-2 rounded-md flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">12 Hours Stay Mode</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Check-in</span>
                      <span className="text-sm font-semibold">{fmtDateTime(form.check_in_date, form.check_in_time)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Check-out</span>
                      <span className="text-sm font-semibold text-primary">{fmtDateTime(checkout, checkoutTime)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Stay</span>
                      <span className="text-sm font-semibold">{getDurationLabel(form.num_days, is12HoursMode ? "12_hours" : "standard")}</span>
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
              
              <div className="mb-8 bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 p-4 rounded-lg flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-current text-xs font-bold">i</span>
                </div>
                <div className="space-y-1 text-sm font-medium">
                  <p className="font-bold uppercase tracking-wider text-xs mb-2">Primary Guest Information</p>
                  <p>Please carry a valid Aadhaar Card or any Government-issued Photo ID<br/>(Passport, Driving Licence, Voter ID, etc.) during hotel check-in for identity verification.</p>
                  <p className="opacity-80">This ID will be verified at the reception during check-in.</p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <Field label="Full Name *"  value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
                <Field label="Mobile Number *"  value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
                <Field 
                  label="WhatsApp Number *" 
                  value={form.whatsapp} 
                  onChange={(v) => setForm({ ...form, whatsapp: v })} 
                  // helperText="Booking confirmation, invoice, and hotel updates will be sent to this WhatsApp number."
                />
                <Field 
                  label="Email Address *" 
                  type="email" 
                  value={form.email} 
                  onChange={(v) => setForm({ ...form, email: v })} 
                  // helperText="Booking confirmation and invoice will also be sent to this email address."
                />
                {is12HoursMode && (
                  <>
                    <div className="sm:col-span-1">
                      <Field label="Check-In Time *" type="time" value={form.check_in_time || "14:00"} onChange={(v) => setForm({ ...form, check_in_time: v })} />
                    </div>
                    <div className="sm:col-span-1">
                      <Field label="Check-Out Time (Auto)" type="time" value={checkoutTime} onChange={() => {}} disabled />
                    </div>
                  </>
                )}
              </div>
              
              {/* <div className="mt-8 bg-gold/10 text-gold-hover p-4 rounded-md border border-gold/20 flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 shrink-0 text-gold" />
                <p className="text-sm font-medium">Your room details (Check-in, Duration, Guests) have been saved from your selection. Please provide your contact information to proceed.</p>
              </div> */}

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
                  ["Check-in", fmtDateTime(form.check_in_date, form.check_in_time)],
                  ["Check-out", fmtDateTime(checkout, checkoutTime)],
                  ["Duration", getDurationLabel(form.num_days, is12HoursMode ? "12_hours" : "standard")],
                  ["Guests", `${form.num_guests} ${form.num_guests === 1 ? "Guest" : "Guests"}`],
                  [getRateLabel(is12HoursMode ? "12_hours" : "standard"), formatINR(price)],
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

function Field({ label, value, onChange, type = "text", disabled, placeholder, helperText }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; placeholder?: string; helperText?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} placeholder={placeholder}
        className={`w-full bg-background border border-border rounded-md px-4 py-3 text-sm focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none transition-colors placeholder:text-muted-foreground/50 ${disabled ? "opacity-60 cursor-not-allowed bg-muted" : ""}`} />
      {helperText && <span className="text-xs text-muted-foreground mt-2 block">{helperText}</span>}
    </label>
  );
}
