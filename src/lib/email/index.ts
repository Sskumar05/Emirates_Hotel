export { sendBookingConfirmation, sendCancellationEmail, sendInvoiceEmail, sendAdminNotification } from "./emailService";
export type {
  BookingConfirmationPayload,
  CancellationEmailPayload,
  InvoiceEmailPayload,
  AdminNotificationPayload,
  SendEmailResult,
  EmailType,
} from "./types";
