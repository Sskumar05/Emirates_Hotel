import { CATEGORY_LABELS, formatINR, fmtDateTime, getDurationLabel, getRateLabel } from "@/lib/hotel";

// ─── Build invoice HTML from a booking-like object ────────────────────────
// Accepts both:
//  • Bookings row  (has .customers, .hotels, .booking_code, .payment_status …)
//  • Invoices row  (has .bookings{}, .customers{}, .invoice_number, .status …)
export function generateInvoiceHTML(data: any): string {
  // Normalize: support both bookings row (confirmation page) and invoices row (admin panel)
  const isInvoiceRow = !!data.invoice_number;

  const booking  = isInvoiceRow ? (data.bookings ?? {})   : data;
  const customer = data.customers ?? {};
  const hotel    = booking.hotels ?? data.hotels ?? {};

  const now          = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  const cat          = CATEGORY_LABELS[booking.category] ?? booking.category ?? "—";
  const pricePerNight = formatINR(isInvoiceRow ? (data.amount ?? 0) / Math.max(booking.num_days ?? 1, 1) : booking.price_per_night);
  const nights       = booking.num_days ?? 1;
  const guests       = booking.num_guests ?? "—";
  const total        = isInvoiceRow
    ? formatINR((data.amount ?? 0) + (data.tax_amount ?? 0))
    : formatINR(booking.total_amount);
  const invoiceRef   = isInvoiceRow ? data.invoice_number : booking.booking_code;
  const bookingCode  = booking.booking_code ?? "—";
  const payStatus    = isInvoiceRow ? (data.status ?? "pending") : (booking.payment_status ?? "pending");
  const bookingDate  = isInvoiceRow
    ? new Date(data.issued_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    : booking.created_at
      ? new Date(booking.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : now;

  const stayType = booking.stay_type ?? "standard";
  const durationLabel = getDurationLabel(nights, stayType);
  const rateLabel = getRateLabel(stayType);
  const checkInFormatted = fmtDateTime(booking.check_in_date, booking.check_in_time);
  
  const checkOutFormatted = fmtDateTime(booking.check_out_date, stayType === '12_hours' ? (() => {
    const d = new Date(`${booking.check_in_date}T${booking.check_in_time || "14:00"}:00`);
    d.setHours(d.getHours() + 12);
    return d.toTimeString().slice(0, 5);
  })() : '12:00');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  /* ── Single A4 page enforcement ── */
  @page{size:A4 portrait;margin:10mm}
  html,body{width:210mm;height:297mm;overflow:hidden}
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Inter',sans-serif;color:#1a1a2e;background:#fff;padding:10mm;page-break-after:avoid}
  /* ── Prevent any element from causing a page break ── */
  *{break-inside:avoid;page-break-inside:avoid}
  .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #B8860B;padding-bottom:12px;margin-bottom:14px;break-inside:avoid}
  .brand{display:flex;flex-direction:column;gap:2px}
  .brand-name{font-size:19px;font-weight:800;color:#1a1a2e;letter-spacing:-0.5px}
  .brand-sub{font-size:11px;color:#6b7280;font-weight:500}
  .invoice-meta{text-align:right}
  .invoice-title{font-size:24px;font-weight:800;color:#B8860B;letter-spacing:-1px}
  .invoice-ref{font-size:12px;color:#6b7280;margin-top:3px;font-weight:500}
  .invoice-date{font-size:11px;color:#9ca3af;margin-top:2px}
  .section{margin-bottom:12px;break-inside:avoid;page-break-inside:avoid}
  .section-title{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#9ca3af;margin-bottom:7px}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .info-block{background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:9px 12px;break-inside:avoid}
  .info-label{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#9ca3af;margin-bottom:3px}
  .info-value{font-size:12px;font-weight:600;color:#1a1a2e}
  table{width:100%;border-collapse:collapse;margin-bottom:0;break-inside:avoid}
  thead{break-inside:avoid}
  th{background:#f3f4f6;text-align:left;padding:7px 11px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#6b7280}
  td{padding:7px 11px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#374151}
  tr{break-inside:avoid;page-break-inside:avoid}
  tr:last-child td{border-bottom:none}
  .text-right{text-align:right}
  .total-row td{font-weight:700;font-size:13px;background:#fef9f0;color:#B8860B;border-top:2px solid #B8860B}
  .status-badge{display:inline-block;padding:2px 10px;border-radius:20px;font-size:11px;font-weight:600;background:#dcfce7;color:#16a34a}
  .footer{margin-top:14px;padding-top:10px;border-top:1px solid #e5e7eb;text-align:center;break-inside:avoid}
  .footer-text{font-size:11px;color:#9ca3af;font-style:italic}
  .footer-brand{font-size:11px;font-weight:600;color:#B8860B;margin-top:3px}
  @media print{button{display:none!important}}
</style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <div class="brand-name">Emirates Grand Inn</div>
      <div class="brand-sub">Luxury Hotel &amp; Suites</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-ref">${invoiceRef}</div>
      <div class="invoice-date">Issued: ${now}</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Guest Information</div>
    <div class="grid2">
      <div class="info-block">
        <div class="info-label">Full Name</div>
        <div class="info-value">${customer.full_name ?? "—"}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Email Address</div>
        <div class="info-value">${customer.email ?? "—"}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Mobile Number</div>
        <div class="info-value">${customer.mobile ?? "—"}</div>
      </div>
      <div class="info-block">
        <div class="info-label">Payment Status</div>
        <div class="info-value"><span class="status-badge">${payStatus}</span></div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Booking Details</div>
    <table>
      <thead>
        <tr>
          <th>Field</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Booking Reference</td><td>${bookingCode}</td></tr>
        <tr><td>Hotel</td><td>${hotel.name ?? "—"}</td></tr>
        <tr><td>Room Category</td><td>${cat}</td></tr>
        <tr><td>Check-in</td><td>${checkInFormatted}</td></tr>
        <tr><td>Check-out</td><td>${checkOutFormatted}</td></tr>
        <tr><td>Duration</td><td>${durationLabel}</td></tr>
        <tr><td>Number of Guests</td><td>${guests}</td></tr>
        <tr><td>${rateLabel}</td><td>${pricePerNight}</td></tr>
        <tr><td>Booking Date</td><td>${bookingDate}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">Amount Summary</div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th class="text-right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>${cat} · ${durationLabel}</td>
          <td class="text-right">${pricePerNight} × ${stayType === '12_hours' ? booking.num_rooms : nights * booking.num_rooms}</td>
        </tr>
        ${isInvoiceRow && (data.tax_amount ?? 0) > 0
          ? `<tr><td>Taxes &amp; Charges</td><td class="text-right">${formatINR(data.tax_amount)}</td></tr>`
          : ""}
        <tr class="total-row">
          <td>Grand Total</td>
          <td class="text-right">${total}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div class="footer-text">"Thank you for choosing our hotel. We look forward to welcoming you."</div>
    <div class="footer-brand">Emirates Grand Inn · Luxury Redefined</div>
  </div>
</body>
</html>`;
}

// ─── Trigger browser print-to-PDF via hidden iframe ──────────────────────────
// iframe is sized to exact A4 pixels at 96dpi (794 × 1123)
export function downloadInvoice(data: any) {
  const html = generateInvoiceHTML(data);
  const iframe = document.createElement("iframe");
  // A4 at 96dpi = 794 × 1123 px — prevents layout reflow that causes a second page
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;overflow:hidden";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();

  // Allow fonts + layout to settle before printing
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) document.body.removeChild(iframe);
    }, 4000);
  }, 1000);
}

// ─── Generate base64 PDF silently for email attachment ──────────────────────
export async function generateInvoiceBase64(data: any): Promise<string> {
  const html2pdf = (await import("html2pdf.js")).default;
  return new Promise((resolve, reject) => {
    try {
      const html = generateInvoiceHTML(data);
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:794px;height:1123px;border:none;overflow:hidden";
      document.body.appendChild(iframe);

      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        throw new Error("Could not create iframe document");
      }
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        const opt = {
          margin: 0,
          filename: 'invoice.pdf',
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'px', format: [794, 1123], orientation: 'portrait' }
        };
        
        html2pdf()
          .set(opt)
          .from(doc.body)
          .outputPdf('datauristring')
          .then((dataUri: string) => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
            const base64 = dataUri.split(',')[1];
            resolve(base64);
          })
          .catch((err: any) => {
            if (document.body.contains(iframe)) document.body.removeChild(iframe);
            reject(err);
          });
      }, 500);
    } catch (e) {
      reject(e);
    }
  });
}
