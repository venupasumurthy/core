-- ============================================================================
-- CORE: Multi-Robot Fleet Coordination Engine - Supabase Database Schema
-- Run this script in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/izpaaeynqhvurjtzfaxk/sql/new
-- ============================================================================

-- 1. Create Robots Table
create table if not exists public.robots (
  id text primary key,
  name text not null,
  role text not null,
  battery numeric not null default 100,
  health numeric not null default 100,
  speed numeric not null default 2,
  capacity numeric not null default 50,
  current_load numeric not null default 0,
  state text not null default 'IDLE',
  x numeric not null default 120,
  y numeric not null default 200,
  target_x numeric,
  target_y numeric,
  assigned_zone_id text,
  work_progress numeric not null default 0,
  work_time_remaining numeric not null default 0,
  label_code text,
  radio_radius numeric default 180,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Create Work Zones Table
create table if not exists public.zones (
  id text primary key,
  name text not null,
  x numeric not null default 300,
  y numeric not null default 100,
  width numeric not null default 220,
  height numeric not null default 160,
  color text not null default '#3b82f6',
  task_type text not null default 'DELIVERY',
  difficulty text not null default 'MEDIUM',
  time_limit_seconds numeric not null default 120,
  time_remaining_seconds numeric not null default 120,
  current_resource_level numeric not null default 0,
  status text not null default 'UNASSIGNED',
  assigned_robot_id text,
  transport_robot_id text,
  task_code text,
  hazard_text text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create Messages Table (Autonomous AI Dialogue & Mesh Telemetry)
create table if not exists public.messages (
  id text primary key,
  timestamp text not null,
  from_robot text not null,
  to_robot text not null,
  content text not null,
  badge text default 'STATUS',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Create Coordination Alerts Table
create table if not exists public.coordination_alerts (
  id text primary key,
  source_robot_id text not null,
  source_zone_id text not null,
  target_robot_id text not null,
  target_zone_id text not null,
  resource_type text not null,
  amount numeric not null default 1,
  message text not null,
  status text not null default 'PENDING',
  assigned_transport_robot_id text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. Enable Row Level Security (RLS) on all tables
alter table public.robots enable row level security;
alter table public.zones enable row level security;
alter table public.messages enable row level security;
alter table public.coordination_alerts enable row level security;

-- 6. Create Public Access Policies (for anon/publishable key)
drop policy if exists "Public access for robots" on public.robots;
create policy "Public access for robots" on public.robots for all using (true) with check (true);

drop policy if exists "Public access for zones" on public.zones;
create policy "Public access for zones" on public.zones for all using (true) with check (true);

drop policy if exists "Public access for messages" on public.messages;
create policy "Public access for messages" on public.messages for all using (true) with check (true);

drop policy if exists "Public access for coordination_alerts" on public.coordination_alerts;
create policy "Public access for coordination_alerts" on public.coordination_alerts for all using (true) with check (true);

-- 7. Enable Supabase Realtime for live cross-device synchronisation
begin;
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table
    public.robots,
    public.zones,
    public.messages,
    public.coordination_alerts;
commit;

-- 8. Seed Initial Fleet Robots
insert into public.robots (id, name, role, battery, health, speed, capacity, current_load, state, x, y, label_code)
values
  ('R0001', 'Scout Drone R1', 'GENERAL', 92, 98, 2.2, 20, 0, 'IDLE', 110, 160, 'R1'),
  ('R0002', 'Heavy Hauler R2', 'HEAVY_LIFTER', 88, 95, 1.2, 100, 0, 'IDLE', 110, 260, 'R2'),
  ('R0003', 'Transporter R3', 'TRANSPORTER', 96, 100, 1.8, 50, 0, 'IDLE', 110, 360, 'R3'),
  ('R0004', 'Planter Unit R4', 'PLANTER', 81, 91, 1.5, 30, 0, 'IDLE', 110, 460, 'R4'),
  ('R0005', 'Water Carrier R5', 'WATER_COLLECTOR', 99, 99, 1.9, 40, 0, 'IDLE', 110, 560, 'R5')
on conflict (id) do nothing;

-- 9. Seed Initial Work Zones
insert into public.zones (id, name, x, y, width, height, color, task_type, difficulty, time_limit_seconds, time_remaining_seconds, status, task_code)
values
  ('Z0001', 'Alpha Hydro Bay', 360, 140, 240, 170, '#06b6d4', 'WATER_WASTE', 'EASY', 120, 120, 'UNASSIGNED', 'HYD-01'),
  ('Z0002', 'Beta Agri Sector', 660, 140, 240, 170, '#10b981', 'TREE_PLANTING', 'MEDIUM', 180, 180, 'UNASSIGNED', 'AGR-02'),
  ('Z0003', 'Gamma Cargo Hub', 360, 360, 240, 170, '#f59e0b', 'DELIVERY', 'HARD', 240, 240, 'UNASSIGNED', 'CRG-03'),
  ('Z0004', 'Delta Sanitization', 660, 360, 240, 170, '#a855f7', 'CLEANING', 'MEDIUM', 150, 150, 'UNASSIGNED', 'SAN-04')
on conflict (id) do nothing;
