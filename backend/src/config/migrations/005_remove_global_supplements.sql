-- Migration: Remove global default supplements
-- New users should set up their own supplements, not inherit defaults
-- Date: 2026-02-01

-- Remove all global supplements (they were just defaults)
DELETE FROM supplements WHERE is_global = true;

-- Note: Users can still see suggested supplements on the frontend
-- but must explicitly add them to their list
