-- Seed Data for Deal Velocity Verification

-- 1. Create a Buyer Organization
INSERT INTO organizations (id, name, type, domain)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Acme Corp', 'buyer', 'acme.com')
ON CONFLICT (id) DO NOTHING;

-- 2. Create a Vendor Organization
INSERT INTO organizations (id, name, type, domain)
VALUES 
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Globex Inc', 'vendor', 'globex.com')
ON CONFLICT (id) DO NOTHING;

-- 3. Create a Project (RFP)
INSERT INTO projects (id, org_id, title, description, status, budget, deadline)
VALUES 
  ('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Q4 Marketing RFP', 'Seeking marketing agency for Q4 campaign.', 'active', 50000, NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO NOTHING;

-- 4. Create a Contract
INSERT INTO contracts (id, project_id, vendor_id, buyer_id, title, status, value, effective_date)
VALUES 
  ('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marketing Services Agreement', 'draft', 45000, NOW())
ON CONFLICT (id) DO NOTHING;

-- 5. Create a Document (Mock Vector)
INSERT INTO documents (id, project_id, name, file_path, content_text)
VALUES 
  ('e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'RFP_Requirements.pdf', '/projects/c0eebc99/RFP_Requirements.pdf', 'Must have experience in B2B tech marketing.')
ON CONFLICT (id) DO NOTHING;

-- 6. Create an Outcome
INSERT INTO outcomes (id, project_id, status, final_value, feedback)
VALUES 
  ('f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66', 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', 'won', 48000, 'Selected based on strong creative proposal.')
ON CONFLICT (id) DO NOTHING;
