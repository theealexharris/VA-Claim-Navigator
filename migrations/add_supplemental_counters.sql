-- Add supplemental statement usage counters to users table
-- supplemental_statements_allowed: set to 2 on Pro purchase, +1 per $27 add-on
-- supplemental_statements_used: incremented each time user prints/downloads a statement

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS supplemental_statements_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS supplemental_statements_allowed INTEGER NOT NULL DEFAULT 0;
