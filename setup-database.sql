-- =============================================
-- BARBERPRO - SCHEMA COMPLETO
-- Execute no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/rzmgmalpvuvbfpchuivr/sql/new
-- =============================================

-- ENABLE UUID EXTENSION
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLE: salons
-- =============================================
CREATE TABLE IF NOT EXISTS public.salons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Salons viewable by authenticated" ON public.salons;
CREATE POLICY "Salons viewable by authenticated" ON public.salons
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Salon owners can manage salon" ON public.salons;
CREATE POLICY "Salon owners can manage salon" ON public.salons
  FOR ALL USING (auth.uid() = owner_id);

-- =============================================
-- TABLE: profiles
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'barbeiro', 'client')),
  salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
  commission_rate NUMERIC(5,2) DEFAULT 50.00
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles in salon" ON public.profiles;
CREATE POLICY "Admins can view all profiles in salon" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p.salon_id = profiles.salon_id
    )
  );

-- =============================================
-- TABLE: services
-- =============================================
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN DEFAULT TRUE,
  category TEXT DEFAULT 'corte'
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Services viewable by authenticated" ON public.services;
CREATE POLICY "Services viewable by authenticated" ON public.services
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin' AND p.salon_id = services.salon_id
    )
  );

-- =============================================
-- TABLE: clients
-- =============================================
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  birth_date DATE,
  notes TEXT,
  total_visits INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  loyalty_points INTEGER DEFAULT 0
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view clients" ON public.clients;
CREATE POLICY "Staff can view clients" ON public.clients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = clients.salon_id
    )
  );

DROP POLICY IF EXISTS "Staff can manage clients" ON public.clients;
CREATE POLICY "Staff can manage clients" ON public.clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = clients.salon_id AND p.role IN ('admin', 'barbeiro')
    )
  );

DROP POLICY IF EXISTS "Clients can view own record" ON public.clients;
CREATE POLICY "Clients can view own record" ON public.clients
  FOR SELECT USING (user_id = auth.uid());

-- =============================================
-- TABLE: appointments
-- =============================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'em_andamento', 'finalizado', 'cancelado')),
  price NUMERIC(10,2),
  notes TEXT,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pendente' CHECK (payment_status IN ('pendente', 'pago', 'reembolsado'))
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view appointments" ON public.appointments;
CREATE POLICY "Staff can view appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = appointments.salon_id
    )
  );

DROP POLICY IF EXISTS "Barbers can view own appointments" ON public.appointments;
CREATE POLICY "Barbers can view own appointments" ON public.appointments
  FOR SELECT USING (barber_id = auth.uid());

DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
CREATE POLICY "Clients can view own appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = appointments.client_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Staff can manage appointments" ON public.appointments;
CREATE POLICY "Staff can manage appointments" ON public.appointments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = appointments.salon_id AND p.role IN ('admin', 'barbeiro')
    )
  );

-- =============================================
-- TABLE: transactions
-- =============================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('receita', 'despesa', 'comissao')),
  description TEXT,
  amount NUMERIC(10,2) NOT NULL,
  payment_method TEXT DEFAULT 'dinheiro',
  status TEXT DEFAULT 'concluido' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
  category TEXT DEFAULT 'servico'
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = transactions.salon_id AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Barbers can view own commissions" ON public.transactions;
CREATE POLICY "Barbers can view own commissions" ON public.transactions
  FOR SELECT USING (barber_id = auth.uid() AND type = 'comissao');

-- =============================================
-- TABLE: notifications
-- =============================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_role TEXT CHECK (recipient_role IN ('admin', 'barbeiro', 'client')),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Auth users can insert notifications" ON public.notifications;
CREATE POLICY "Auth users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- TABLE: stock_items
-- =============================================
CREATE TABLE IF NOT EXISTS public.stock_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'produto',
  quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit TEXT DEFAULT 'unidade',
  min_quantity NUMERIC(10,2) DEFAULT 5,
  cost_price NUMERIC(10,2),
  sell_price NUMERIC(10,2),
  supplier TEXT,
  is_active BOOLEAN DEFAULT TRUE
);

ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage stock" ON public.stock_items;
CREATE POLICY "Admins can manage stock" ON public.stock_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = stock_items.salon_id AND p.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Barbers can view stock" ON public.stock_items;
CREATE POLICY "Barbers can view stock" ON public.stock_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = stock_items.salon_id AND p.role = 'barbeiro'
    )
  );

-- =============================================
-- TABLE: loyalty_points
-- =============================================
CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  type TEXT CHECK (type IN ('earned', 'redeemed')),
  description TEXT,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL
);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clients can view own loyalty" ON public.loyalty_points;
CREATE POLICY "Clients can view own loyalty" ON public.loyalty_points
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = loyalty_points.client_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage loyalty" ON public.loyalty_points;
CREATE POLICY "Admins can manage loyalty" ON public.loyalty_points
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.salon_id = loyalty_points.salon_id AND p.role = 'admin'
    )
  );

-- =============================================
-- FUNCTION: auto-create profile on signup
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'client')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ language plpgsql security definer;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- ENABLE REALTIME for notifications + appointments
-- =============================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- =============================================
-- SEED: Default salon + services
-- =============================================
-- Uncomment these after setting up your admin user:
-- INSERT INTO public.salons (name, email, phone, owner_id)
-- VALUES ('BarberPro Master', 'contato@barberpro.com', '(11) 99999-9999', 'YOUR-ADMIN-UUID');
