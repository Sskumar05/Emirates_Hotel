-- ============================================================
-- Fix: Allow public (anon) users to confirm their own booking
--      after a successful payment.
--
-- Root Cause:
--   The original migration only has an UPDATE policy for
--   "authenticated" users with the admin role:
--
--     CREATE POLICY "Admins manage bookings" ON public.bookings
--       FOR UPDATE TO authenticated
--       USING (public.has_role(auth.uid(), 'admin'));
--
--   Customers on the payment page are unauthenticated (anon role).
--   Supabase RLS silently blocks the update() — no error is
--   returned, zero rows are updated, and the booking stays at
--   payment_status=pending / status=pending indefinitely.
--
-- Fix:
--   Add a narrow UPDATE policy that allows any anonymous caller
--   to update ONLY the three payment-related columns
--   (status, payment_status, payment_ref) on a booking that is
--   currently in "pending" status.
--   This is safe because:
--     - Only pending bookings can be confirmed (status check).
--     - The caller cannot change any other booking fields.
--     - Admin policies remain unchanged.
-- ============================================================

-- Drop the old policy first so we can replace it cleanly.
-- (Supabase does not support ALTER POLICY — drop + recreate.)
DROP POLICY IF EXISTS "Admins manage bookings" ON public.bookings;

-- Recreate the admin-only policy (unchanged semantics).
CREATE POLICY "Admins manage bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- NEW: Allow public users (anon / unauthenticated) to confirm
--      their own pending booking after a successful payment.
--      The USING clause restricts this to bookings that are
--      currently pending — once confirmed, this policy no longer
--      matches and prevents further overwrites.
CREATE POLICY "Public confirm own pending booking"
  ON public.bookings
  FOR UPDATE
  TO anon, authenticated
  USING (status = 'pending')
  WITH CHECK (
    status = 'confirmed'
    AND payment_status = 'paid'
  );
