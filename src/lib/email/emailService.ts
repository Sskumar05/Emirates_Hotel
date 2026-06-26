import { supabase } from "@/integrations/supabase/client";
import type {
  AdminNotificationPayload,
  BookingConfirmationPayload,
  CancellationEmailPayload,
  EmailType,
  InvoiceEmailPayload,
  SendEmailResult,
} from "./types";

// ─── Core Invoker ─────────────────────────────────────────────────────────────
async function invoke(
  type: EmailType,
  to: string,
  payload: Record<string, unknown>,
): Promise<SendEmailResult> {
  try {
    const { data, error } = await supabase.functions.invoke<SendEmailResult>("send-email", {
      body: { type, to, payload },
    });

    if (error) {
      console.error(`[emailService] Edge Function error (${type}):`, error);
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: "Empty response from email function" };
    }

    // Log delivery status to audit_logs
    await logDelivery({ type, to, result: data });

    return data;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[emailService] Unexpected error (${type}):`, message);
    return { success: false, error: message };
  }
}

// ─── Audit Logger ─────────────────────────────────────────────────────────────
async function logDelivery({
  type,
  to,
  result,
}: {
  type: EmailType;
  to: string;
  result: SendEmailResult;
}) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    await supabase.from("audit_logs").insert({
      actor_id: session?.user?.id ?? null,
      actor_email: session?.user?.email ?? null,
      action: result.success ? `email_sent:${type}` : `email_failed:${type}`,
      entity_type: "email",
      entity_id: result.id ?? null,
      new_value: {
        type,
        to,
        success: result.success,
        resend_id: result.id,
        error: result.error,
      },
    });
  } catch (logErr) {
    // Non-fatal — just console log
    console.warn("[emailService] Failed to write audit log:", logErr);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Send a booking confirmation email to the customer.
 */
export async function sendBookingConfirmation(
  to: string,
  payload: BookingConfirmationPayload,
): Promise<SendEmailResult> {
  return invoke("booking_confirmation", to, payload as Record<string, unknown>);
}

/**
 * Send an invoice email, optionally with a base64-encoded PDF attachment.
 */
export async function sendInvoiceEmail(
  to: string,
  payload: InvoiceEmailPayload,
): Promise<SendEmailResult> {
  return invoke("invoice", to, payload as Record<string, unknown>);
}

/**
 * Send a cancellation confirmation email to the customer.
 */
export async function sendCancellationEmail(
  to: string,
  payload: CancellationEmailPayload,
): Promise<SendEmailResult> {
  return invoke("cancellation", to, payload as Record<string, unknown>);
}

/**
 * Send a new-booking notification to the admin inbox.
 * The `to` field is ignored server-side; admin email is read from Edge Function secret.
 */
export async function sendAdminNotification(
  payload: AdminNotificationPayload,
): Promise<SendEmailResult> {
  // `to` is overridden by ADMIN_EMAIL secret inside the function
  return invoke("admin_notification", "admin@emiratesgrandinn.com", payload as Record<string, unknown>);
}
