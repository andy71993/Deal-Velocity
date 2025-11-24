-- Migration: Add RFP Responder Tables (Phase 2)

-- 1. Create RFP Requirements Table
create table if not exists rfp_requirements (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  req_text text not null,
  req_type varchar(50), -- "technical", "management", "past_performance", "compliance"
  priority varchar(20), -- "mandatory", "desirable", "optional"
  page_ref integer,
  created_at timestamptz default now()
);

-- 2. Create Proposal Sections Table
create table if not exists proposal_sections (
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

-- 3. Create Evaluator Simulations Table
create table if not exists evaluator_simulations (
  id uuid primary key default gen_random_uuid(),
  proposal_section_id uuid not null references proposal_sections(id) on delete cascade,
  simulated_score integer check (simulated_score between 0 and 100),
  evaluator_persona varchar(50), -- "technical_lead", "contract_officer", "executive"
  feedback text,
  improvement_suggestions text,
  created_at timestamptz default now()
);

-- 4. Create Indexes
create index if not exists idx_requirements_project on rfp_requirements(project_id);
create index if not exists idx_proposal_project on proposal_sections(project_id);
create index if not exists idx_proposal_req on proposal_sections(requirement_id);
create index if not exists idx_simulations_proposal on evaluator_simulations(proposal_section_id);

-- 5. Enable RLS
alter table rfp_requirements enable row level security;
alter table proposal_sections enable row level security;
alter table evaluator_simulations enable row level security;

-- 6. Create RLS Policies

-- RFP Requirements
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

-- Proposal Sections
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

-- Evaluator Simulations
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
