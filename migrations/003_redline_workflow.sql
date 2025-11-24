-- Migration: Add Redline Workflow Tracking
-- Description: Adds columns to contract_clauses for accept/reject workflow

ALTER TABLE contract_clauses 
ADD COLUMN IF NOT EXISTS redline_status varchar(20) DEFAULT 'pending' 
  CHECK (redline_status IN ('pending', 'accepted', 'rejected')),
ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for filtering by status
CREATE INDEX IF NOT EXISTS idx_contract_clauses_redline_status 
  ON contract_clauses(redline_status);

-- Update existing rows to have default status
UPDATE contract_clauses 
SET redline_status = 'pending' 
WHERE redline_status IS NULL;
