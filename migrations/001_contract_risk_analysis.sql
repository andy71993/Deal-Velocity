-- Migration: Add Contract Risk Analysis Tables (Phase 1)

-- 1. Create Contract Clauses Table
create table if not exists contract_clauses (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  clause_text text not null,
  clause_type varchar(100),
  risk_score integer check (risk_score between 0 and 100),
  position_start integer,
  position_end integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Create Risk Analysis Table
create table if not exists risk_analysis (
  id uuid primary key default gen_random_uuid(),
  clause_id uuid not null references contract_clauses(id) on delete cascade,
  risk_category varchar(100),
  risk_level varchar(20) check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_description text,
  impact_description text,
  suggested_alternative text,
  gpt_reasoning jsonb,
  created_at timestamptz default now()
);

-- 3. Create Clause Variations Table
create table if not exists clause_variations (
  id uuid primary key default gen_random_uuid(),
  original_clause_id uuid references contract_clauses(id) on delete set null,
  modified_clause_text text not null,
  modification_type varchar(50) check (modification_type in ('user_edit', 'ai_suggestion', 'negotiation')),
  accepted boolean,
  deal_outcome varchar(50) check (deal_outcome in ('won', 'lost', 'pending')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 4. Create User Feedback Table
create table if not exists user_feedback (
  id uuid primary key default gen_random_uuid(),
  clause_id uuid references contract_clauses(id) on delete cascade,
  risk_analysis_id uuid references risk_analysis(id) on delete cascade,
  feedback_type varchar(50) check (feedback_type in ('accurate', 'inaccurate', 'helpful', 'not_helpful')),
  rating integer check (rating between 1 and 5),
  comment text,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 5. Create Indexes
create index if not exists idx_clauses_contract on contract_clauses(contract_id);
create index if not exists idx_clauses_risk_score on contract_clauses(risk_score desc);
create index if not exists idx_risk_category on risk_analysis(risk_category);
create index if not exists idx_risk_clause on risk_analysis(clause_id);
create index if not exists idx_variations_original on clause_variations(original_clause_id);
create index if not exists idx_feedback_clause on user_feedback(clause_id);
create index if not exists idx_feedback_user on user_feedback(user_id);

-- 6. Enable RLS
alter table contract_clauses enable row level security;
alter table risk_analysis enable row level security;
alter table clause_variations enable row level security;
alter table user_feedback enable row level security;

-- 7. Create RLS Policies

-- Contract Clauses
create policy "Users can view clauses from their contracts"
  on contract_clauses for select
  using (
    exists (
      select 1 from contracts
      where contracts.id = contract_clauses.contract_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

-- Risk Analysis
create policy "Users can view risk analysis for their clauses"
  on risk_analysis for select
  using (
    exists (
      select 1 from contract_clauses
      join contracts on contracts.id = contract_clauses.contract_id
      where contract_clauses.id = risk_analysis.clause_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

-- Clause Variations
create policy "Users can view clause variations"
  on clause_variations for select
  using (
    exists (
      select 1 from contract_clauses
      join contracts on contracts.id = contract_clauses.contract_id
      where contract_clauses.id = clause_variations.original_clause_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

create policy "Users can create clause variations"
  on clause_variations for insert
  with check (
    exists (
      select 1 from contract_clauses
      join contracts on contracts.id = contract_clauses.contract_id
      where contract_clauses.id = clause_variations.original_clause_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

-- User Feedback
create policy "Users can view their feedback"
  on user_feedback for select
  using (user_id = auth.uid());

create policy "Users can create feedback"
  on user_feedback for insert
  with check (user_id = auth.uid());
