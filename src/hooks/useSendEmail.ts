import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  sendAdminNotification,
  sendBookingConfirmation,
  sendCancellationEmail,
  sendInvoiceEmail,
} from "@/lib/email";
import type {
  AdminNotificationPayload,
  BookingConfirmationPayload,
  CancellationEmailPayload,
  InvoiceEmailPayload,
  SendEmailResult,
} from "@/lib/email";

interface UseSendEmailReturn {
  loading: boolean;
  lastResult: SendEmailResult | null;
  sendConfirmation: (to: string, payload: BookingConfirmationPayload) => Promise<SendEmailResult>;
  sendInvoice: (to: string, payload: InvoiceEmailPayload) => Promise<SendEmailResult>;
  sendCancellation: (to: string, payload: CancellationEmailPayload) => Promise<SendEmailResult>;
  notifyAdmin: (payload: AdminNotificationPayload) => Promise<SendEmailResult>;
}

export function useSendEmail(): UseSendEmailReturn {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<SendEmailResult | null>(null);

  const run = useCallback(
    async (
      label: string,
      fn: () => Promise<SendEmailResult>,
    ): Promise<SendEmailResult> => {
      setLoading(true);
      const toastId = toast.loading(`Sending ${label}…`);
      try {
        const result = await fn();
        setLastResult(result);
        if (result.success) {
          toast.success(`${label} sent successfully`, { id: toastId });
        } else {
          toast.error(`Failed to send ${label}: ${result.error ?? "Unknown error"}`, { id: toastId });
        }
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const result: SendEmailResult = { success: false, error: message };
        setLastResult(result);
        toast.error(`Error sending ${label}: ${message}`, { id: toastId });
        return result;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const sendConfirmation = useCallback(
    (to: string, payload: BookingConfirmationPayload) =>
      run("booking confirmation", () => sendBookingConfirmation(to, payload)),
    [run],
  );

  const sendInvoice = useCallback(
    (to: string, payload: InvoiceEmailPayload) =>
      run("invoice email", () => sendInvoiceEmail(to, payload)),
    [run],
  );

  const sendCancellation = useCallback(
    (to: string, payload: CancellationEmailPayload) =>
      run("cancellation email", () => sendCancellationEmail(to, payload)),
    [run],
  );

  const notifyAdmin = useCallback(
    (payload: AdminNotificationPayload) =>
      run("admin notification", () => sendAdminNotification(payload)),
    [run],
  );

  return { loading, lastResult, sendConfirmation, sendInvoice, sendCancellation, notifyAdmin };
}
