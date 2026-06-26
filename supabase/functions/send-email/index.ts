import "@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = "Emirates Grand Inn <noreply@emiratesgrandinn.com>";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "admin@emiratesgrandinn.com";

// ── Retry helper ─────────────────────────────────────────────────────────────
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = 3,
  delayMs = 500,
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.ok || attempt === retries) return res;
    await new Promise((r) => setTimeout(r, delayMs * attempt));
  }
  throw new Error("Max retries exceeded");
}

// ── Resend sender ─────────────────────────────────────────────────────────────
async function sendViaResend(payload: {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{ filename: string; content: string }>;
}) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) throw new Error("RESEND_API_KEY secret not set");

  const body = JSON.stringify({
    from: FROM_ADDRESS,
    to: Array.isArray(payload.to) ? payload.to : [payload.to],
    subject: payload.subject,
    html: payload.html,
    ...(payload.attachments ? { attachments: payload.attachments } : {}),
  });

  const res = await fetchWithRetry(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message ?? JSON.stringify(data));
  return data;
}

// ── HTML Email Templates ──────────────────────────────────────────────────────
function baseTemplate(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Emirates Grand Inn</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#0a0a0f;font-family:'Inter',Arial,sans-serif;color:#e8e0d0;-webkit-text-size-adjust:100%}
  .wrapper{max-width:640px;margin:0 auto;padding:24px 16px}
  .card{background:linear-gradient(135deg,#12121c 0%,#1a1a28 100%);border:1px solid rgba(200,160,80,0.25);border-radius:4px;overflow:hidden}
  .header{background:linear-gradient(135deg,#1a1510 0%,#0f0f18 100%);padding:40px 40px 32px;text-align:center;border-bottom:1px solid rgba(200,160,80,0.3)}
  .crown{font-size:28px;margin-bottom:12px;display:block}
  .brand{font-family:'Playfair Display',Georgia,serif;font-size:26px;color:#c8a050;letter-spacing:0.06em;font-weight:700}
  .brand-sub{font-size:10px;color:#a08040;letter-spacing:0.3em;text-transform:uppercase;margin-top:4px}
  .divider{height:1px;background:linear-gradient(90deg,transparent,rgba(200,160,80,0.5),transparent);margin:24px 0}
  .content{padding:40px}
  .section-title{font-family:'Playfair Display',Georgia,serif;font-size:22px;color:#e8d8a0;margin-bottom:20px;font-weight:600}
  .greeting{font-size:15px;color:#b0a090;line-height:1.7;margin-bottom:28px}
  .detail-table{width:100%;border-collapse:collapse;margin:20px 0}
  .detail-table tr{border-bottom:1px solid rgba(200,160,80,0.1)}
  .detail-table tr:last-child{border-bottom:none}
  .detail-table td{padding:12px 0;font-size:13px;line-height:1.5;vertical-align:top}
  .detail-table td:first-child{color:#8a7a6a;width:42%;font-weight:400;letter-spacing:0.02em}
  .detail-table td:last-child{color:#e8e0d0;font-weight:500;text-align:right}
  .highlight-box{background:rgba(200,160,80,0.06);border:1px solid rgba(200,160,80,0.2);border-radius:2px;padding:20px;margin:24px 0;text-align:center}
  .total-amount{font-family:'Playfair Display',Georgia,serif;font-size:28px;color:#c8a050;font-weight:700}
  .total-label{font-size:10px;color:#8a7a6a;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:6px}
  .badge{display:inline-block;padding:4px 14px;border:1px solid rgba(200,160,80,0.4);font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#c8a050;border-radius:2px}
  .cta-btn{display:block;margin:28px auto 0;width:fit-content;padding:14px 36px;background:linear-gradient(135deg,#c8a050,#a07030);color:#0a0a0f;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:600;text-decoration:none;border-radius:2px}
  .footer{padding:28px 40px;border-top:1px solid rgba(200,160,80,0.15);text-align:center}
  .footer p{font-size:11px;color:#5a504a;line-height:1.7}
  .footer a{color:#8a6a40;text-decoration:none}
  .status-confirmed{color:#34d399}
  .status-cancelled{color:#f87171}
  .status-pending{color:#fbbf24}
  .booking-code{font-family:monospace;font-size:20px;color:#c8a050;letter-spacing:0.15em;font-weight:600}
  @media(max-width:600px){.content,.header,.footer{padding:24px 20px!important}.total-amount{font-size:22px}.brand{font-size:20px}}
</style>
</head>
<body>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent">${preheader}</div>` : ""}
<div class="wrapper">
  <div class="card">
    <div class="header">
      <span class="crown">♛</span>
      <div class="brand">Emirates Grand Inn</div>
      <div class="brand-sub">Luxury Hospitality</div>
    </div>
    ${content}
    <div class="footer">
      <p>© ${new Date().getFullYear()} Emirates Grand Inn · All rights reserved</p>
      <p style="margin-top:6px"><a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a></p>
      <p style="margin-top:10px;font-size:10px;color:#3a302a">This is an automated message from Emirates Grand Inn reservation system.</p>
    </div>
  </div>
</div>
</body>
</html>`;
}

function bookingConfirmationTemplate(d: {
  customerName: string;
  bookingCode: string;
  hotelName: string;
  roomType: string;
  roomNumbers: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  numRooms: number;
  numDays: number;
  totalAmount: string;
  paymentStatus: string;
}): string {
  return baseTemplate(
    `<div class="content">
      <div class="divider"></div>
      <div class="section-title">Booking Confirmed ✓</div>
      <p class="greeting">Dear ${d.customerName},<br/><br/>
      Thank you for choosing Emirates Grand Inn. Your reservation has been confirmed. We look forward to welcoming you and providing you with an exceptional luxury experience.</p>
      
      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:10px;color:#8a7a6a;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px">Booking Reference</div>
        <div class="booking-code">${d.bookingCode}</div>
        <div style="margin-top:10px"><span class="badge status-confirmed">Confirmed</span></div>
      </div>

      <div class="divider"></div>

      <table class="detail-table">
        <tr><td>Hotel</td><td>${d.hotelName}</td></tr>
        <tr><td>Room Type</td><td>${d.roomType}</td></tr>
        ${d.roomNumbers ? `<tr><td>Room Numbers</td><td>${d.roomNumbers}</td></tr>` : ""}
        <tr><td>Check-in Date</td><td>${d.checkIn}</td></tr>
        <tr><td>Check-out Date</td><td>${d.checkOut}</td></tr>
        <tr><td>Duration</td><td>${d.numDays} Night${d.numDays !== 1 ? "s" : ""}</td></tr>
        <tr><td>Guests</td><td>${d.numGuests} Guest${d.numGuests !== 1 ? "s" : ""}</td></tr>
        <tr><td>Rooms</td><td>${d.numRooms} Room${d.numRooms !== 1 ? "s" : ""}</td></tr>
        <tr><td>Payment Status</td><td><span class="status-${d.paymentStatus === "paid" ? "confirmed" : "pending"}">${d.paymentStatus.charAt(0).toUpperCase() + d.paymentStatus.slice(1)}</span></td></tr>
      </table>

      <div class="highlight-box">
        <div class="total-label">Total Amount</div>
        <div class="total-amount">${d.totalAmount}</div>
      </div>

      <p style="font-size:12px;color:#7a6a5a;text-align:center;line-height:1.7;margin-top:20px">
        Please carry a valid government-issued photo ID at check-in.<br/>
        Check-in time: 2:00 PM · Check-out time: 12:00 PM
      </p>
    </div>`,
    `Your booking ${d.bookingCode} at ${d.hotelName} is confirmed!`,
  );
}

function invoiceEmailTemplate(d: {
  customerName: string;
  invoiceNumber: string;
  bookingCode: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  numDays: number;
  amount: string;
  taxAmount: string;
  totalAmount: string;
  issuedAt: string;
  paymentStatus: string;
}): string {
  return baseTemplate(
    `<div class="content">
      <div class="divider"></div>
      <div class="section-title">Invoice</div>
      <p class="greeting">Dear ${d.customerName},<br/><br/>
      Please find your invoice attached as a PDF. Below is a summary of your stay with us.</p>

      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:10px;color:#8a7a6a;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px">Invoice Number</div>
        <div class="booking-code" style="font-size:18px">${d.invoiceNumber}</div>
        <div style="margin-top:6px;font-size:11px;color:#7a6a5a">${d.issuedAt}</div>
      </div>

      <div class="divider"></div>

      <table class="detail-table">
        <tr><td>Booking Reference</td><td>${d.bookingCode}</td></tr>
        <tr><td>Hotel</td><td>${d.hotelName}</td></tr>
        <tr><td>Room Type</td><td>${d.roomType}</td></tr>
        <tr><td>Check-in</td><td>${d.checkIn}</td></tr>
        <tr><td>Check-out</td><td>${d.checkOut}</td></tr>
        <tr><td>Duration</td><td>${d.numDays} Night${d.numDays !== 1 ? "s" : ""}</td></tr>
        <tr><td>Sub-total</td><td>${d.amount}</td></tr>
        <tr><td>Tax & Charges</td><td>${d.taxAmount}</td></tr>
      </table>

      <div class="highlight-box">
        <div class="total-label">Amount Due</div>
        <div class="total-amount">${d.totalAmount}</div>
        <div style="margin-top:10px"><span class="badge status-${d.paymentStatus === "paid" ? "confirmed" : "pending"}">${d.paymentStatus}</span></div>
      </div>

      <p style="font-size:11px;color:#5a504a;text-align:center;margin-top:16px">
        The invoice PDF is attached to this email for your records.
      </p>
    </div>`,
    `Invoice ${d.invoiceNumber} from Emirates Grand Inn`,
  );
}

function cancellationTemplate(d: {
  customerName: string;
  bookingCode: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  reason?: string;
  cancelledAt: string;
}): string {
  return baseTemplate(
    `<div class="content">
      <div class="divider"></div>
      <div class="section-title" style="color:#f87171">Booking Cancelled</div>
      <p class="greeting">Dear ${d.customerName},<br/><br/>
      We regret to inform you that your reservation has been cancelled. Below are the details of the cancelled booking.</p>

      <div style="text-align:center;margin-bottom:28px">
        <div style="font-size:10px;color:#8a7a6a;letter-spacing:0.3em;text-transform:uppercase;margin-bottom:8px">Booking Reference</div>
        <div class="booking-code" style="color:#f87171">${d.bookingCode}</div>
        <div style="margin-top:10px"><span class="badge status-cancelled">Cancelled</span></div>
      </div>

      <div class="divider"></div>

      <table class="detail-table">
        <tr><td>Hotel</td><td>${d.hotelName}</td></tr>
        <tr><td>Room Type</td><td>${d.roomType}</td></tr>
        <tr><td>Check-in Date</td><td>${d.checkIn}</td></tr>
        <tr><td>Check-out Date</td><td>${d.checkOut}</td></tr>
        <tr><td>Amount</td><td>${d.totalAmount}</td></tr>
        <tr><td>Cancelled At</td><td>${d.cancelledAt}</td></tr>
        ${d.reason ? `<tr><td>Reason</td><td>${d.reason}</td></tr>` : ""}
      </table>

      <div style="background:rgba(248,113,113,0.05);border:1px solid rgba(248,113,113,0.2);border-radius:2px;padding:20px;margin:24px 0">
        <p style="font-size:13px;color:#b08080;text-align:center;line-height:1.7">
          If you have any questions regarding your cancellation or refund,<br/>
          please contact us at <a href="mailto:${ADMIN_EMAIL}" style="color:#c8a050">${ADMIN_EMAIL}</a>
        </p>
      </div>

      <p style="font-size:12px;color:#7a6a5a;text-align:center">
        We hope to welcome you at Emirates Grand Inn in the future.
      </p>
    </div>`,
    `Booking ${d.bookingCode} has been cancelled`,
  );
}

function adminNotificationTemplate(d: {
  bookingCode: string;
  customerName: string;
  customerEmail: string;
  customerMobile: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  numRooms: number;
  numDays: number;
  totalAmount: string;
  createdAt: string;
}): string {
  return baseTemplate(
    `<div class="content">
      <div class="divider"></div>
      <div class="section-title">New Booking Alert 🔔</div>
      <p class="greeting">A new booking has been received on the Emirates Grand Inn reservation system.</p>

      <div style="text-align:center;margin-bottom:24px">
        <div class="booking-code">${d.bookingCode}</div>
        <div style="font-size:11px;color:#7a6a5a;margin-top:6px">Received: ${d.createdAt}</div>
      </div>

      <div class="divider"></div>

      <p style="font-size:10px;color:#8a7a6a;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:12px">Customer Details</p>
      <table class="detail-table" style="margin-bottom:20px">
        <tr><td>Name</td><td>${d.customerName}</td></tr>
        <tr><td>Email</td><td>${d.customerEmail}</td></tr>
        <tr><td>Mobile</td><td>${d.customerMobile}</td></tr>
      </table>

      <p style="font-size:10px;color:#8a7a6a;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:12px">Reservation Details</p>
      <table class="detail-table">
        <tr><td>Hotel</td><td>${d.hotelName}</td></tr>
        <tr><td>Room Type</td><td>${d.roomType}</td></tr>
        <tr><td>Check-in</td><td>${d.checkIn}</td></tr>
        <tr><td>Check-out</td><td>${d.checkOut}</td></tr>
        <tr><td>Duration</td><td>${d.numDays} Night${d.numDays !== 1 ? "s" : ""}</td></tr>
        <tr><td>Guests</td><td>${d.numGuests}</td></tr>
        <tr><td>Rooms</td><td>${d.numRooms}</td></tr>
      </table>

      <div class="highlight-box">
        <div class="total-label">Total Revenue</div>
        <div class="total-amount">${d.totalAmount}</div>
      </div>
    </div>`,
    `New booking ${d.bookingCode} received`,
  );
}

// ── Validation ────────────────────────────────────────────────────────────────
function validate(body: unknown): { type: string; payload: Record<string, unknown>; to: string } {
  if (!body || typeof body !== "object") throw new Error("Request body must be a JSON object");
  const b = body as Record<string, unknown>;
  if (!b.type || typeof b.type !== "string") throw new Error("Missing required field: type");
  if (!b.to || typeof b.to !== "string") throw new Error("Missing required field: to (email)");
  if (!b.payload || typeof b.payload !== "object") throw new Error("Missing required field: payload");
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!EMAIL_RE.test(b.to as string)) throw new Error(`Invalid email address: ${b.to}`);
  const allowed = ["booking_confirmation", "invoice", "cancellation", "admin_notification"];
  if (!allowed.includes(b.type as string)) throw new Error(`Unknown email type: ${b.type}. Allowed: ${allowed.join(", ")}`);
  return { type: b.type as string, payload: b.payload as Record<string, unknown>, to: b.to as string };
}

// ── Main Handler ──────────────────────────────────────────────────────────────
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    const rawBody = await req.json().catch(() => { throw new Error("Invalid JSON body"); });
    const { type, payload: p, to } = validate(rawBody);

    let subject = "";
    let html = "";
    let attachments: Array<{ filename: string; content: string }> | undefined;

    if (type === "booking_confirmation") {
      subject = `Booking Confirmed – ${p.bookingCode} | Emirates Grand Inn`;
      html = bookingConfirmationTemplate({
        customerName: String(p.customerName ?? "Guest"),
        bookingCode: String(p.bookingCode ?? ""),
        hotelName: String(p.hotelName ?? "Emirates Grand Inn"),
        roomType: String(p.roomType ?? ""),
        roomNumbers: String(p.roomNumbers ?? ""),
        checkIn: String(p.checkIn ?? ""),
        checkOut: String(p.checkOut ?? ""),
        numGuests: Number(p.numGuests ?? 1),
        numRooms: Number(p.numRooms ?? 1),
        numDays: Number(p.numDays ?? 1),
        totalAmount: String(p.totalAmount ?? ""),
        paymentStatus: String(p.paymentStatus ?? "pending"),
      });
    } else if (type === "invoice") {
      subject = `Invoice ${p.invoiceNumber} – Emirates Grand Inn`;
      html = invoiceEmailTemplate({
        customerName: String(p.customerName ?? "Guest"),
        invoiceNumber: String(p.invoiceNumber ?? ""),
        bookingCode: String(p.bookingCode ?? ""),
        hotelName: String(p.hotelName ?? "Emirates Grand Inn"),
        roomType: String(p.roomType ?? ""),
        checkIn: String(p.checkIn ?? ""),
        checkOut: String(p.checkOut ?? ""),
        numDays: Number(p.numDays ?? 1),
        amount: String(p.amount ?? ""),
        taxAmount: String(p.taxAmount ?? "₹0"),
        totalAmount: String(p.totalAmount ?? ""),
        issuedAt: String(p.issuedAt ?? new Date().toLocaleDateString()),
        paymentStatus: String(p.paymentStatus ?? "pending"),
      });
      if (p.pdfBase64 && p.invoiceNumber) {
        attachments = [{ filename: `Invoice-${p.invoiceNumber}.pdf`, content: String(p.pdfBase64) }];
      }
    } else if (type === "cancellation") {
      subject = `Booking Cancelled – ${p.bookingCode} | Emirates Grand Inn`;
      html = cancellationTemplate({
        customerName: String(p.customerName ?? "Guest"),
        bookingCode: String(p.bookingCode ?? ""),
        hotelName: String(p.hotelName ?? "Emirates Grand Inn"),
        roomType: String(p.roomType ?? ""),
        checkIn: String(p.checkIn ?? ""),
        checkOut: String(p.checkOut ?? ""),
        totalAmount: String(p.totalAmount ?? ""),
        reason: p.reason ? String(p.reason) : undefined,
        cancelledAt: String(p.cancelledAt ?? new Date().toLocaleString()),
      });
    } else if (type === "admin_notification") {
      subject = `New Booking: ${p.bookingCode} – ${p.hotelName} | Emirates Grand Inn`;
      html = adminNotificationTemplate({
        bookingCode: String(p.bookingCode ?? ""),
        customerName: String(p.customerName ?? ""),
        customerEmail: String(p.customerEmail ?? ""),
        customerMobile: String(p.customerMobile ?? ""),
        hotelName: String(p.hotelName ?? ""),
        roomType: String(p.roomType ?? ""),
        checkIn: String(p.checkIn ?? ""),
        checkOut: String(p.checkOut ?? ""),
        numGuests: Number(p.numGuests ?? 1),
        numRooms: Number(p.numRooms ?? 1),
        numDays: Number(p.numDays ?? 1),
        totalAmount: String(p.totalAmount ?? ""),
        createdAt: String(p.createdAt ?? new Date().toLocaleString()),
      });
      // Admin notification always goes to admin, override `to`
      const result = await sendViaResend({ to: ADMIN_EMAIL, subject, html, attachments });
      return new Response(JSON.stringify({ success: true, id: result.id, type }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const result = await sendViaResend({ to, subject, html, attachments });
    return new Response(JSON.stringify({ success: true, id: result.id, type }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-email]", message);
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
