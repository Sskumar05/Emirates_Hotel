/**
 * Email Test Utility
 * ------------------
 * Lets admin users test each email type from the Settings page.
 * Calls the real Edge Function — verifies live delivery.
 */
import {
  sendAdminNotification,
  sendBookingConfirmation,
  sendCancellationEmail,
  sendInvoiceEmail,
} from "@/lib/email";
import type { SendEmailResult } from "@/lib/email";

export interface EmailTestResult {
  type: string;
  to: string;
  result: SendEmailResult;
  durationMs: number;
}

async function timed(fn: () => Promise<SendEmailResult>): Promise<{ result: SendEmailResult; durationMs: number }> {
  const start = Date.now();
  const result = await fn();
  return { result, durationMs: Date.now() - start };
}

export async function testBookingConfirmationEmail(to: string): Promise<EmailTestResult> {
  const { result, durationMs } = await timed(() =>
    sendBookingConfirmation(to, {
      customerName: "Test Guest",
      bookingCode: "EI-TEST0001",
      hotelName: "Emirates Grand Inn",
      roomType: "AC Double Room",
      roomNumbers: "101, 102",
      checkIn: "2026-07-15",
      checkOut: "2026-07-18",
      numGuests: 2,
      numRooms: 2,
      numDays: 3,
      totalAmount: "₹12,000",
      paymentStatus: "paid",
    }),
  );
  return { type: "booking_confirmation", to, result, durationMs };
}

export async function testInvoiceEmail(to: string): Promise<EmailTestResult> {
  const { result, durationMs } = await timed(() =>
    sendInvoiceEmail(to, {
      customerName: "Test Guest",
      invoiceNumber: "INV-202607-TEST01",
      bookingCode: "EI-TEST0001",
      hotelName: "Emirates Grand Inn",
      roomType: "AC Double Room",
      checkIn: "2026-07-15",
      checkOut: "2026-07-18",
      numDays: 3,
      amount: "₹10,800",
      taxAmount: "₹1,200",
      totalAmount: "₹12,000",
      issuedAt: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      paymentStatus: "paid",
    }),
  );
  return { type: "invoice", to, result, durationMs };
}

export async function testCancellationEmail(to: string): Promise<EmailTestResult> {
  const { result, durationMs } = await timed(() =>
    sendCancellationEmail(to, {
      customerName: "Test Guest",
      bookingCode: "EI-TEST0001",
      hotelName: "Emirates Grand Inn",
      roomType: "AC Double Room",
      checkIn: "2026-07-15",
      checkOut: "2026-07-18",
      totalAmount: "₹12,000",
      reason: "Test cancellation",
      cancelledAt: new Date().toLocaleString("en-IN"),
    }),
  );
  return { type: "cancellation", to, result, durationMs };
}

export async function testAdminNotificationEmail(): Promise<EmailTestResult> {
  const { result, durationMs } = await timed(() =>
    sendAdminNotification({
      bookingCode: "EI-TEST0001",
      customerName: "Test Guest",
      customerEmail: "test@example.com",
      customerMobile: "+91 9999999999",
      hotelName: "Emirates Grand Inn",
      roomType: "AC Double Room",
      checkIn: "2026-07-15",
      checkOut: "2026-07-18",
      numGuests: 2,
      numRooms: 2,
      numDays: 3,
      totalAmount: "₹12,000",
      createdAt: new Date().toLocaleString("en-IN"),
    }),
  );
  return { type: "admin_notification", to: "admin", result, durationMs };
}

export async function runAllEmailTests(to: string): Promise<EmailTestResult[]> {
  const results = await Promise.allSettled([
    testBookingConfirmationEmail(to),
    testInvoiceEmail(to),
    testCancellationEmail(to),
    testAdminNotificationEmail(),
  ]);

  return results.map((r, i) => {
    const labels = ["booking_confirmation", "invoice", "cancellation", "admin_notification"];
    if (r.status === "fulfilled") return r.value;
    return {
      type: labels[i],
      to,
      result: { success: false, error: r.reason?.message ?? "Unknown error" },
      durationMs: 0,
    };
  });
}
