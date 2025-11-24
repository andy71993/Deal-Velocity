-- Migration: Fix RLS Policies for Contracts and Analysis
-- Description: Adds missing INSERT policies for contracts, clauses, and risk analysis

-- 1. Contracts: Allow users to create contracts for their org
CREATE POLICY "Users can create contracts for their org"
  ON contracts FOR INSERT
  WITH CHECK (
    vendor_id = get_auth_org_id() OR buyer_id = get_auth_org_id()
  );

-- 2. Contract Clauses: Allow users to insert clauses for their contracts
CREATE POLICY "Users can insert clauses for their contracts"
  ON contract_clauses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_clauses.contract_id
      AND (contracts.vendor_id = get_auth_org_id() OR contracts.buyer_id = get_auth_org_id())
    )
  );

-- 3. Risk Analysis: Allow users to insert risk analysis for their clauses
CREATE POLICY "Users can insert risk analysis for their clauses"
  ON risk_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contract_clauses
      JOIN contracts ON contracts.id = contract_clauses.contract_id
      WHERE contract_clauses.id = risk_analysis.clause_id
      AND (contracts.vendor_id = get_auth_org_id() OR contracts.buyer_id = get_auth_org_id())
    )
  );

-- 4. Allow users to UPDATE their contracts (needed for status updates etc)
CREATE POLICY "Users can update their contracts"
  ON contracts FOR UPDATE
  USING (vendor_id = get_auth_org_id() OR buyer_id = get_auth_org_id());

-- 5. Allow users to UPDATE their clauses (needed for redline_status)
CREATE POLICY "Users can update clauses for their contracts"
  ON contract_clauses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM contracts
      WHERE contracts.id = contract_clauses.contract_id
      AND (contracts.vendor_id = get_auth_org_id() OR contracts.buyer_id = get_auth_org_id())
    )
  );
