-- =============================================
-- BARBERPRO V1 - SUPABASE-FIRST CANONICAL SCHEMA
-- Projeto alvo: llfohlqwythkozphwkfo
-- Runtime oficial: frontend Vite + Supabase Auth/DB/Storage/Realtime
-- =============================================

create extension if not exists "pgcrypto";

-- =============================================
-- Helper functions
-- =============================================

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = timezone('utc', now());
  return new;
end;
$$;

-- =============================================
-- Core tables
-- =============================================

create table if not exists public."Barbershop" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "slug" text not null unique,
  "logo" text,
  "phone" text,
  "email" text,
  "description" text,
  "address" text,
  "neighborhood" text,
  "city" text,
  "state" text,
  "zipCode" text,
  "cnpj" text,
  "instagram" text,
  "website" text,
  "settings" jsonb not null default '{}'::jsonb,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."User" (
  "id" uuid primary key default gen_random_uuid(),
  "authId" uuid unique references auth.users(id) on delete cascade,
  "barbershopId" uuid references public."Barbershop"("id") on delete set null,
  "name" text not null,
  "email" text,
  "phone" text,
  "role" text not null default 'client' check ("role" in ('admin', 'barbeiro', 'client')),
  "avatarUrl" text,
  "commissionRate" numeric(5,2),
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."Barber" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null unique references public."User"("id") on delete cascade,
  "barbershopId" uuid not null references public."Barbershop"("id") on delete cascade,
  "specialty" text,
  "bio" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."Client" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid references public."User"("id") on delete set null,
  "barbershopId" uuid not null references public."Barbershop"("id") on delete cascade,
  "name" text not null,
  "email" text,
  "phone" text,
  "birthDate" date,
  "notes" text,
  "totalVisits" integer not null default 0,
  "totalSpent" numeric(12,2) not null default 0,
  "loyaltyPoints" integer not null default 0,
  "lastVisitAt" timestamptz,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."Service" (
  "id" uuid primary key default gen_random_uuid(),
  "barbershopId" uuid not null references public."Barbershop"("id") on delete cascade,
  "name" text not null,
  "description" text,
  "category" text,
  "price" numeric(12,2) not null default 0,
  "duration" integer not null default 30,
  "sortOrder" integer not null default 0,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."WorkingHours" (
  "id" uuid primary key default gen_random_uuid(),
  "barbershopId" uuid not null references public."Barbershop"("id") on delete cascade,
  "dayOfWeek" integer not null check ("dayOfWeek" between 0 and 6),
  "openTime" text not null default '09:00',
  "closeTime" text not null default '18:00',
  "isOpen" boolean not null default true,
  "slotDuration" integer not null default 30,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now()),
  unique ("barbershopId", "dayOfWeek")
);

create table if not exists public."Appointment" (
  "id" uuid primary key default gen_random_uuid(),
  "barbershopId" uuid not null references public."Barbershop"("id") on delete cascade,
  "clientId" uuid references public."Client"("id") on delete set null,
  "barberId" uuid references public."Barber"("id") on delete set null,
  "serviceId" uuid references public."Service"("id") on delete set null,
  "scheduledAt" timestamptz not null,
  "duration" integer not null default 30,
  "status" text not null default 'SCHEDULED' check ("status" in ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  "price" numeric(12,2) not null default 0,
  "notes" text,
  "paymentMethod" text,
  "paymentStatus" text not null default 'PENDING' check ("paymentStatus" in ('PENDING', 'PAID', 'REFUNDED')),
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."Transaction" (
  "id" uuid primary key default gen_random_uuid(),
  "barbershopId" uuid not null references public."Barbershop"("id") on delete cascade,
  "appointmentId" uuid references public."Appointment"("id") on delete set null,
  "clientId" uuid references public."Client"("id") on delete set null,
  "barberId" uuid references public."Barber"("id") on delete set null,
  "type" text not null check ("type" in ('INCOME', 'EXPENSE', 'COMMISSION')),
  "amount" numeric(12,2) not null,
  "description" text,
  "category" text,
  "paymentMethod" text,
  "status" text not null default 'COMPLETED' check ("status" in ('PENDING', 'COMPLETED', 'CANCELLED')),
  "gateway" text,
  "gatewayReference" text,
  "externalOrderId" text unique,
  "metadata" jsonb not null default '{}'::jsonb,
  "date" timestamptz not null default timezone('utc', now()),
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."Notification" (
  "id" uuid primary key default gen_random_uuid(),
  "userId" uuid not null references public."User"("id") on delete cascade,
  "barbershopId" uuid references public."Barbershop"("id") on delete cascade,
  "type" text not null,
  "title" text not null,
  "message" text not null,
  "data" jsonb not null default '{}'::jsonb,
  "read" boolean not null default false,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create table if not exists public."StockItem" (
  "id" uuid primary key default gen_random_uuid(),
  "barbershopId" uuid not null references public."Barbershop"("id") on delete cascade,
  "name" text not null,
  "brand" text,
  "sku" text,
  "category" text,
  "quantity" numeric(12,2) not null default 0,
  "minQuantity" numeric(12,2) not null default 0,
  "unit" text default 'un',
  "costPrice" numeric(12,2),
  "sellPrice" numeric(12,2),
  "imageUrl" text,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default timezone('utc', now()),
  "updatedAt" timestamptz not null default timezone('utc', now())
);

create or replace function public.current_internal_user_id()
returns uuid
language sql
stable
as $$
  select "id"
  from public."User"
  where "authId" = auth.uid()
  limit 1
$$;

create or replace function public.current_barbershop_id()
returns uuid
language sql
stable
as $$
  select "barbershopId"
  from public."User"
  where "authId" = auth.uid()
  limit 1
$$;

-- =============================================
-- UpdatedAt triggers
-- =============================================

drop trigger if exists "touch_Barbershop_updatedAt" on public."Barbershop";
create trigger "touch_Barbershop_updatedAt" before update on public."Barbershop"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_User_updatedAt" on public."User";
create trigger "touch_User_updatedAt" before update on public."User"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_Barber_updatedAt" on public."Barber";
create trigger "touch_Barber_updatedAt" before update on public."Barber"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_Client_updatedAt" on public."Client";
create trigger "touch_Client_updatedAt" before update on public."Client"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_Service_updatedAt" on public."Service";
create trigger "touch_Service_updatedAt" before update on public."Service"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_WorkingHours_updatedAt" on public."WorkingHours";
create trigger "touch_WorkingHours_updatedAt" before update on public."WorkingHours"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_Appointment_updatedAt" on public."Appointment";
create trigger "touch_Appointment_updatedAt" before update on public."Appointment"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_Transaction_updatedAt" on public."Transaction";
create trigger "touch_Transaction_updatedAt" before update on public."Transaction"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_Notification_updatedAt" on public."Notification";
create trigger "touch_Notification_updatedAt" before update on public."Notification"
for each row execute procedure public.touch_updated_at();

drop trigger if exists "touch_StockItem_updatedAt" on public."StockItem";
create trigger "touch_StockItem_updatedAt" before update on public."StockItem"
for each row execute procedure public.touch_updated_at();

-- =============================================
-- Auth bootstrap
-- =============================================

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public."User" (
    "authId",
    "name",
    "email",
    "phone",
    "role",
    "avatarUrl",
    "isActive"
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'avatar_url',
    true
  )
  on conflict ("authId") do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_barberpro on auth.users;
create trigger on_auth_user_created_barberpro
after insert on auth.users
for each row execute procedure public.handle_new_auth_user();

-- =============================================
-- RLS
-- =============================================

alter table public."Barbershop" enable row level security;
alter table public."User" enable row level security;
alter table public."Barber" enable row level security;
alter table public."Client" enable row level security;
alter table public."Service" enable row level security;
alter table public."WorkingHours" enable row level security;
alter table public."Appointment" enable row level security;
alter table public."Transaction" enable row level security;
alter table public."Notification" enable row level security;
alter table public."StockItem" enable row level security;

drop policy if exists "public can read active barbershops" on public."Barbershop";
create policy "public can read active barbershops" on public."Barbershop"
for select using ("isActive" = true);

drop policy if exists "staff can manage own barbershop" on public."Barbershop";
create policy "staff can manage own barbershop" on public."Barbershop"
for all using ("id" = public.current_barbershop_id())
with check ("id" = public.current_barbershop_id());

drop policy if exists "setup user can create first barbershop" on public."Barbershop";
create policy "setup user can create first barbershop" on public."Barbershop"
for insert with check (
  exists (
    select 1
    from public."User" internal_user
    where internal_user."authId" = auth.uid()
      and internal_user."barbershopId" is null
      and internal_user."role" in ('admin', 'barbeiro')
  )
);

drop policy if exists "users can read own row" on public."User";
create policy "users can read own row" on public."User"
for select using ("authId" = auth.uid());

drop policy if exists "users can insert own row" on public."User";
create policy "users can insert own row" on public."User"
for insert with check ("authId" = auth.uid());

drop policy if exists "staff can read internal users in barbershop" on public."User";
create policy "staff can read internal users in barbershop" on public."User"
for select using ("barbershopId" = public.current_barbershop_id());

drop policy if exists "public can read barber display names" on public."User";
create policy "public can read barber display names" on public."User"
for select using (
  "role" = 'barbeiro'
  and exists (
    select 1
    from public."Barber" barber
    join public."Barbershop" shop on shop."id" = barber."barbershopId"
    where barber."userId" = "User"."id"
      and barber."isActive" = true
      and shop."isActive" = true
  )
);

drop policy if exists "users can update own row" on public."User";
create policy "users can update own row" on public."User"
for update using ("authId" = auth.uid())
with check ("authId" = auth.uid());

drop policy if exists "barbers are publicly visible" on public."Barber";
create policy "barbers are publicly visible" on public."Barber"
for select using (
  "isActive" = true
  and exists (
    select 1 from public."Barbershop" b
    where b."id" = "Barber"."barbershopId" and b."isActive" = true
  )
);

drop policy if exists "staff manage barbers" on public."Barber";
create policy "staff manage barbers" on public."Barber"
for all using ("barbershopId" = public.current_barbershop_id())
with check ("barbershopId" = public.current_barbershop_id());

drop policy if exists "staff manage clients" on public."Client";
create policy "staff manage clients" on public."Client"
for all using ("barbershopId" = public.current_barbershop_id())
with check ("barbershopId" = public.current_barbershop_id());

drop policy if exists "client can read own profile" on public."Client";
create policy "client can read own profile" on public."Client"
for select using ("userId" = public.current_internal_user_id());

drop policy if exists "client can create own profile" on public."Client";
create policy "client can create own profile" on public."Client"
for insert with check ("userId" = public.current_internal_user_id());

drop policy if exists "public can read active services" on public."Service";
create policy "public can read active services" on public."Service"
for select using (
  "isActive" = true
  and exists (
    select 1 from public."Barbershop" b
    where b."id" = "Service"."barbershopId" and b."isActive" = true
  )
);

drop policy if exists "staff manage services" on public."Service";
create policy "staff manage services" on public."Service"
for all using ("barbershopId" = public.current_barbershop_id())
with check ("barbershopId" = public.current_barbershop_id());

drop policy if exists "public can read working hours" on public."WorkingHours";
create policy "public can read working hours" on public."WorkingHours"
for select using (
  exists (
    select 1 from public."Barbershop" b
    where b."id" = "WorkingHours"."barbershopId" and b."isActive" = true
  )
);

drop policy if exists "staff manage working hours" on public."WorkingHours";
create policy "staff manage working hours" on public."WorkingHours"
for all using ("barbershopId" = public.current_barbershop_id())
with check ("barbershopId" = public.current_barbershop_id());

drop policy if exists "public can read public appointments" on public."Appointment";
create policy "public can read public appointments" on public."Appointment"
for select using (
  exists (
    select 1 from public."Barbershop" b
    where b."id" = "Appointment"."barbershopId" and b."isActive" = true
  )
);

drop policy if exists "staff manage appointments" on public."Appointment";
create policy "staff manage appointments" on public."Appointment"
for all using ("barbershopId" = public.current_barbershop_id())
with check ("barbershopId" = public.current_barbershop_id());

drop policy if exists "client can read own appointments" on public."Appointment";
create policy "client can read own appointments" on public."Appointment"
for select using (
  "clientId" in (
    select c."id"
    from public."Client" c
    where c."userId" = public.current_internal_user_id()
  )
);

drop policy if exists "client can create own appointments" on public."Appointment";
create policy "client can create own appointments" on public."Appointment"
for insert with check (
  exists (
    select 1
    from public."Client" c
    where c."id" = "clientId"
      and c."userId" = public.current_internal_user_id()
  )
);

drop policy if exists "staff read transactions" on public."Transaction";
create policy "staff read transactions" on public."Transaction"
for select using ("barbershopId" = public.current_barbershop_id());

drop policy if exists "staff manage transactions" on public."Transaction";
create policy "staff manage transactions" on public."Transaction"
for all using ("barbershopId" = public.current_barbershop_id())
with check ("barbershopId" = public.current_barbershop_id());

drop policy if exists "client reads own transactions" on public."Transaction";
create policy "client reads own transactions" on public."Transaction"
for select using (
  "clientId" in (
    select c."id"
    from public."Client" c
    where c."userId" = public.current_internal_user_id()
  )
);

drop policy if exists "client inserts own pending transactions" on public."Transaction";
create policy "client inserts own pending transactions" on public."Transaction"
for insert with check (
  "clientId" in (
    select c."id"
    from public."Client" c
    where c."userId" = public.current_internal_user_id()
      and c."barbershopId" = "Transaction"."barbershopId"
  )
);

drop policy if exists "user reads own notifications" on public."Notification";
create policy "user reads own notifications" on public."Notification"
for select using ("userId" = public.current_internal_user_id());

drop policy if exists "user updates own notifications" on public."Notification";
create policy "user updates own notifications" on public."Notification"
for update using ("userId" = public.current_internal_user_id())
with check ("userId" = public.current_internal_user_id());

drop policy if exists "staff can insert notifications" on public."Notification";
create policy "staff can insert notifications" on public."Notification"
for insert with check ("barbershopId" = public.current_barbershop_id());

drop policy if exists "staff manage stock" on public."StockItem";
create policy "staff manage stock" on public."StockItem"
for all using ("barbershopId" = public.current_barbershop_id())
with check ("barbershopId" = public.current_barbershop_id());

-- =============================================
-- Storage bucket for logos
-- =============================================

insert into storage.buckets ("id", "name", "public")
values ('logos', 'logos', true)
on conflict ("id") do nothing;

drop policy if exists "public can view logos" on storage.objects;
create policy "public can view logos" on storage.objects
for select using (bucket_id = 'logos');

drop policy if exists "authenticated can manage logos" on storage.objects;
create policy "authenticated can manage logos" on storage.objects
for all using (bucket_id = 'logos' and auth.role() = 'authenticated')
with check (bucket_id = 'logos' and auth.role() = 'authenticated');

-- =============================================
-- Realtime
-- =============================================

do $$
begin
  begin
    alter publication supabase_realtime add table public."Notification";
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public."Appointment";
  exception when duplicate_object then null;
  end;
end $$;

-- =============================================
-- Optional seed examples
-- =============================================
-- insert into public."Barbershop" ("name", "slug", "city", "state")
-- values ('BarberPro Matriz', 'barberpro-matriz', 'Cuiaba', 'MT');
