-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create custom types
create type organization_type as enum ('buyer', 'vendor');
create type project_status as enum ('draft', 'active', 'closed', 'awarded');
create type contract_status as enum ('draft', 'negotiation', 'signed', 'active', 'expired', 'terminated');
create type outcome_status as enum ('won', 'lost', 'abandoned');

-- 1. Organizations Table
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type organization_type not null,
  domain text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Profiles Table (Links to Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  full_name text,
  role text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Projects (RFPs/Opportunities) Table
create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  status project_status default 'draft',
  budget numeric,
  deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Contracts Table
create table contracts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete set null,
  vendor_id uuid references organizations(id),
  buyer_id uuid references organizations(id),
  title text not null,
  status contract_status default 'draft',
  value numeric,
  effective_date date,
  expiration_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Documents Table (with Vector Support)
create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  contract_id uuid references contracts(id) on delete cascade,
  name text not null,
  file_path text not null,
  file_type text,
  content_text text,
  embedding vector(1536), -- Assuming OpenAI embeddings
  created_at timestamptz default now()
);

-- 6. Outcomes Table
create table outcomes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  status outcome_status not null,
  final_value numeric,
  feedback text,
  created_at timestamptz default now()
);

-- 7. Contract Clauses Table (AI-identified clauses with risk scores)
create table contract_clauses (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  clause_text text not null,
  clause_type varchar(100), -- e.g., "liability", "termination", "payment"
  risk_score integer check (risk_score between 0 and 100),
  position_start integer,
  position_end integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  -- Redline workflow tracking
  redline_status varchar(20) default 'pending' check (redline_status in ('pending', 'accepted', 'rejected')),
  reviewed_at timestamptz,
  reviewed_by uuid references profiles(id) on delete set null
);

create index idx_contract_clauses_redline_status on contract_clauses(redline_status);

-- 8. Risk Analysis Table (GPT-4 risk assessments)
create table risk_analysis (
  id uuid primary key default gen_random_uuid(),
  clause_id uuid not null references contract_clauses(id) on delete cascade,
  risk_category varchar(100), -- e.g., "financial", "legal", "operational"
  risk_level varchar(20) check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_description text,
  impact_description text,
  suggested_alternative text,
  gpt_reasoning jsonb, -- Store full GPT-4 response for learning
  created_at timestamptz default now()
);

-- 9. Clause Variations Table (Tracks clause changes for DMG)
create table clause_variations (
  id uuid primary key default gen_random_uuid(),
  original_clause_id uuid references contract_clauses(id) on delete set null,
  modified_clause_text text not null,
  modification_type varchar(50) check (modification_type in ('user_edit', 'ai_suggestion', 'negotiation')),
  accepted boolean,
  deal_outcome varchar(50) check (deal_outcome in ('won', 'lost', 'pending')),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- 10. User Feedback Table (Trains the DMG)
create table user_feedback (
  id uuid primary key default gen_random_uuid(),
  clause_id uuid references contract_clauses(id) on delete cascade,
  risk_analysis_id uuid references risk_analysis(id) on delete cascade,
  feedback_type varchar(50) check (feedback_type in ('accurate', 'inaccurate', 'helpful', 'not_helpful')),
  rating integer check (rating between 1 and 5),
  comment text,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 11. RFP Requirements Table (Extracted from RFP)
create table rfp_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  req_text text not null,
  req_type varchar(50), -- "technical", "management", "past_performance", "compliance"
  priority varchar(20), -- "mandatory", "desirable", "optional"
  page_ref integer,
  created_at timestamptz default now()
);

-- 12. Proposal Sections Table (Draft responses)
create table proposal_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  requirement_id uuid references rfp_requirements(id),
  section_title text,
  content text,
  status varchar(20) default 'draft', -- "draft", "review", "approved"
  version integer default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 13. Evaluator Simulations Table (The Secret Sauce)
create table evaluator_simulations (
  id uuid primary key default gen_random_uuid(),
  proposal_section_id uuid not null references proposal_sections(id) on delete cascade,
  simulated_score integer check (simulated_score between 0 and 100),
  evaluator_persona varchar(50), -- "technical_lead", "contract_officer", "executive"
  feedback text,
  improvement_suggestions text,
  created_at timestamptz default now()
);

-- Indexes
create index idx_profiles_org_id on profiles(org_id);
create index idx_projects_org_id on projects(org_id);
create index idx_contracts_project_id on contracts(project_id);
create index idx_contracts_vendor_id on contracts(vendor_id);
create index idx_contracts_buyer_id on contracts(buyer_id);
create index idx_documents_project_id on documents(project_id);
create index idx_documents_contract_id on documents(contract_id);
create index idx_outcomes_project_id on outcomes(project_id);

-- Contract Risk Analysis Indexes
create index idx_clauses_contract on contract_clauses(contract_id);
create index idx_clauses_risk_score on contract_clauses(risk_score desc);
create index idx_risk_category on risk_analysis(risk_category);
create index idx_risk_clause on risk_analysis(clause_id);
create index idx_variations_original on clause_variations(original_clause_id);
create index idx_feedback_clause on user_feedback(clause_id);
create index idx_feedback_user on user_feedback(user_id);

-- RFP Responder Indexes
create index idx_requirements_project on rfp_requirements(project_id);
create index idx_proposal_project on proposal_sections(project_id);
create index idx_proposal_req on proposal_sections(requirement_id);
create index idx_simulations_proposal on evaluator_simulations(proposal_section_id);

-- Vector Index (IVFFlat for better performance on large datasets, requires some data to be effective)
-- For now, we'll use a simple index or skip it until data is populated.
-- create index on documents using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Row Level Security (RLS)

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table contracts enable row level security;
alter table documents enable row level security;
alter table outcomes enable row level security;
alter table contract_clauses enable row level security;
alter table risk_analysis enable row level security;
alter table clause_variations enable row level security;
alter table user_feedback enable row level security;
alter table rfp_requirements enable row level security;
alter table proposal_sections enable row level security;
alter table evaluator_simulations enable row level security;

-- Helper function to get current user's org_id
create or replace function get_auth_org_id()
returns uuid
language sql
security definer
stable
as $$
  select org_id from profiles where id = auth.uid();
$$;

-- Policies

-- Organizations: Users can view their own organization
create policy "Users can view their own organization"
  on organizations for select
  using (id = get_auth_org_id());

-- Profiles: Users can view profiles in their organization
create policy "Users can view profiles in their organization"
  on profiles for select
  using (org_id = get_auth_org_id());

-- Projects: Users can view/edit projects belonging to their organization
create policy "Users can view projects of their organization"
  on projects for select
  using (org_id = get_auth_org_id());

create policy "Users can insert projects for their organization"
  on projects for insert
  with check (org_id = get_auth_org_id());

create policy "Users can update projects of their organization"
  on projects for update
  using (org_id = get_auth_org_id());

-- Contracts: Users can view contracts where their org is buyer or vendor
create policy "Users can view their contracts"
  on contracts for select
  using (vendor_id = get_auth_org_id() or buyer_id = get_auth_org_id());

create policy "Users can create contracts for their org"
  on contracts for insert
  with check (vendor_id = get_auth_org_id() or buyer_id = get_auth_org_id());

create policy "Users can update their contracts"
  on contracts for update
  using (vendor_id = get_auth_org_id() or buyer_id = get_auth_org_id());

-- Documents: Users can view documents linked to their projects or contracts
create policy "Users can view documents of their org's projects"
  on documents for select
  using (
    exists (
      select 1 from projects
      where projects.id = documents.project_id
      and projects.org_id = get_auth_org_id()
    )
    or
    exists (
      select 1 from contracts
      where contracts.id = documents.contract_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

-- Outcomes: Users can view outcomes of their projects
create policy "Users can view outcomes of their projects"
  on outcomes for select
  using (
    exists (
      select 1 from projects
      where projects.id = outcomes.project_id
      and projects.org_id = get_auth_org_id()
    )
  );

-- Contract Clauses: Users can view clauses for their contracts
create policy "Users can view clauses from their contracts"
  on contract_clauses for select
  using (
    exists (
      select 1 from contracts
      where contracts.id = contract_clauses.contract_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

create policy "Users can insert clauses for their contracts" on contract_clauses for insert with check (
    exists (
        select 1 from contracts
        where contracts.id = contract_clauses.contract_id
        and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
);

create policy "Users can update clauses for their contracts"
  on contract_clauses for update
  using (
    exists (
      select 1 from contracts
      where contracts.id = contract_clauses.contract_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

-- Risk Analysis: Users can view risk analysis for their clauses
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

create policy "Users can insert risk analysis for their clauses"
  on risk_analysis for insert
  with check (
    exists (
      select 1 from contract_clauses
      join contracts on contracts.id = contract_clauses.contract_id
      where contract_clauses.id = risk_analysis.clause_id
      and (contracts.vendor_id = get_auth_org_id() or contracts.buyer_id = get_auth_org_id())
    )
  );

-- Clause Variations: Users can view and create variations for their clauses
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

-- User Feedback: Users can view and create feedback
create policy "Users can view their feedback"
  on user_feedback for select
  using (user_id = auth.uid());

create policy "Users can create feedback"
  on user_feedback for insert
  with check (user_id = auth.uid());

-- RFP Requirements: Users can view requirements for their projects
create policy "Users can view requirements for their projects"
  on rfp_requirements for select
  using (
    exists (
      select 1 from projects
      where projects.id = rfp_requirements.project_id
      and projects.org_id = get_auth_org_id()
    )
  );

create policy "Users can manage requirements for their projects"
  on rfp_requirements for all
  using (
    exists (
      select 1 from projects
      where projects.id = rfp_requirements.project_id
      and projects.org_id = get_auth_org_id()
    )
  );

-- Proposal Sections: Users can view/edit proposals for their projects
create policy "Users can view proposals for their projects"
  on proposal_sections for select
  using (
    exists (
      select 1 from projects
      where projects.id = proposal_sections.project_id
      and projects.org_id = get_auth_org_id()
    )
  );

create policy "Users can manage proposals for their projects"
  on proposal_sections for all
  using (
    exists (
      select 1 from projects
      where projects.id = proposal_sections.project_id
      and projects.org_id = get_auth_org_id()
    )
  );

-- Evaluator Simulations: Users can view simulations for their proposals
create policy "Users can view simulations for their proposals"
  on evaluator_simulations for select
  using (
    exists (
      select 1 from proposal_sections
      join projects on projects.id = proposal_sections.project_id
      where proposal_sections.id = evaluator_simulations.proposal_section_id
      and projects.org_id = get_auth_org_id()
    )
  );

create policy "Users can create simulations for their proposals"
  on evaluator_simulations for insert
  with check (
    exists (
      select 1 from proposal_sections
      join projects on projects.id = proposal_sections.project_id
      where proposal_sections.id = evaluator_simulations.proposal_section_id
      and projects.org_id = get_auth_org_id()
    )
  );

-- Triggers for updated_at

create or replace function update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger update_organizations_updated_at
before update on organizations
for each row execute function update_updated_at_column();

create trigger update_profiles_updated_at
before update on profiles
for each row execute function update_updated_at_column();

create trigger update_projects_updated_at
before update on projects
for each row execute function update_updated_at_column();

create trigger update_contracts_updated_at
before update on contracts
for each row execute function update_updated_at_column();
