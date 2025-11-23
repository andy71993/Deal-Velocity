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

-- Indexes
create index idx_profiles_org_id on profiles(org_id);
create index idx_projects_org_id on projects(org_id);
create index idx_contracts_project_id on contracts(project_id);
create index idx_contracts_vendor_id on contracts(vendor_id);
create index idx_contracts_buyer_id on contracts(buyer_id);
create index idx_documents_project_id on documents(project_id);
create index idx_documents_contract_id on documents(contract_id);
create index idx_outcomes_project_id on outcomes(project_id);

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
