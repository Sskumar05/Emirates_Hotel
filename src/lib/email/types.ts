// ─── Email type identifiers ──────────────────────────────────────────────────
export type EmailType =
  | "booking_confirmation"
  | "invoice"
  | "cancellation"
  | "admin_notification";

// ─── Booking Confirmation ────────────────────────────────────────────────────
export interface BookingConfirmationPayload {
  customerName: string;
  bookingCode: string;
  hotelName: string;
  roomType: string;
  roomNumbers?: string;
  checkIn: string;
  checkOut: string;
  numGuests: number;
  numRooms: number;
  numDays: number;
  totalAmount: string;
  paymentStatus: string;
}

// ─── Invoice Email ───────────────────────────────────────────────────────────
export interface InvoiceEmailPayload {
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
  /** Base64-encoded PDF — omit if no attachment needed */
  pdfBase64?: string;
}

// ─── Cancellation Email ───────────────────────────────────────────────────────
export interface CancellationEmailPayload {
  customerName: string;
  bookingCode: string;
  hotelName: string;
  roomType: string;
  checkIn: string;
  checkOut: string;
  totalAmount: string;
  reason?: string;
  cancelledAt: string;
}

// ─── Admin Notification ───────────────────────────────────────────────────────
export interface AdminNotificationPayload {
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
}

// ─── Generic request shape ───────────────────────────────────────────────────
export interface SendEmailRequest<T = Record<string, unknown>> {
  type: EmailType;
  to: string;
  payload: T;
}

// ─── Response ────────────────────────────────────────────────────────────────
export interface SendEmailResult {
  success: boolean;
  /** Resend message ID on success */
  id?: string;
  type?: EmailType;
  error?: string;
}

// ─── Audit log shape ─────────────────────────────────────────────────────────
export interface EmailDeliveryLog {
  actor_id?: string;
  actor_email?: string;
  action: string;
  entity_type: "email";
  entity_id?: string;
  new_value: {
    type: EmailType;
    to: string;
    success: boolean;
    resend_id?: string;
    error?: string;
  };
}
