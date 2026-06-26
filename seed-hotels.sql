-- ============================================================
-- Emirates Inn Hotel Seed Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Insert Emirates Inn and Emirates Grand Inn (if not already present)
INSERT INTO hotels (name, slug, address, phone, email, description, tagline)
VALUES
  (
    'Emirates Inn',
    'emirates-inn',
    'Emirates Inn, Main Road',
    '+91-0000000000',
    'info@emiratesinn.com',
    'A comfortable stay with warm hospitality in the heart of the city.',
    'Comfort & Warmth, Every Stay'
  ),
  (
    'Emirates Grand Inn',
    'emirates-grand-inn',
    'Emirates Grand Inn, Grand Road',
    '+91-0000000001',
    'info@emiratesgrandinn.com',
    'Luxury redefined — experience the grandeur of Emirates Grand Inn.',
    'Grand Luxury, Refined Comfort'
  )
ON CONFLICT (slug) DO NOTHING;

-- Verify the insert
SELECT id, name, slug FROM hotels;
