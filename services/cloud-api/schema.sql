-- ============================================================
-- RESQLINK DISASTER SOS - COMPLETE FRESH RESET & SETUP SCRIPT
-- ============================================================
-- Paste this entire script into your Supabase SQL Editor and click RUN.
-- It safely drops previous tables and creates the complete schema
-- with support for Voice Transcripts, Priority, Category, and Stations.
-- ============================================================

-- STEP 1: CLEAN SLATE (Safely drop older tables and policies)
DROP TABLE IF EXISTS public.sos_messages CASCADE;
DROP TABLE IF EXISTS public.stations CASCADE;
DROP TABLE IF EXISTS public.broadcasts CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;

-- STEP 2: CREATE STATIONS TABLE (Police & Fire Emergency Accounts)
CREATE TABLE public.stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id TEXT UNIQUE NOT NULL,
    station_name TEXT NOT NULL,
    department TEXT NOT NULL,
    username TEXT NOT NULL,
    temporary_password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- STEP 3: CREATE SOS MESSAGES TABLE (All Emergency Data Logs)
CREATE TABLE public.sos_messages (
    id TEXT PRIMARY KEY,
    citizen_id TEXT NOT NULL,
    lat FLOAT,
    lng FLOAT,
    emergency_type TEXT DEFAULT 'GENERAL',
    priority TEXT DEFAULT 'NORMAL',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- STEP 4: CREATE BROADCASTS TABLE (District Emergency Warnings)
CREATE TABLE public.broadcasts (
    id TEXT PRIMARY KEY,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- STEP 5: CREATE NOTICES TABLE (Inter-Department Directives)
CREATE TABLE public.notices (
    id TEXT PRIMARY KEY,
    sender TEXT NOT NULL,
    target TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- STEP 6: PERFORMANCE INDEXES (Fast Filtering on Dates, Coordinates & Severity)
CREATE INDEX idx_sos_created_at ON public.sos_messages (created_at DESC);
CREATE INDEX idx_sos_status ON public.sos_messages (status);
CREATE INDEX idx_sos_priority ON public.sos_messages (priority);
CREATE INDEX idx_sos_emergency_type ON public.sos_messages (emergency_type);

-- STEP 7: ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures that the Hub Server and Dashboard are NEVER blocked by permissions
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to stations" ON public.stations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to sos_messages" ON public.sos_messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to broadcasts" ON public.broadcasts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow full access to notices" ON public.notices FOR ALL USING (true) WITH CHECK (true);

-- STEP 8: ENABLE REALTIME REPLICATION (For live dashboard updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'sos_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.sos_messages;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- STEP 9: SEED ALL 42 ALAPPUZHA DISTRICT EMERGENCY ACCOUNTS
INSERT INTO public.stations (station_id, station_name, department, username, temporary_password, status) VALUES
('POL-ALP-SOUTH', 'Alappuzha South Police Station', 'POLICE', 'ALP_POL_SOUTH', 'ALP@South2026', 'ACTIVE'),
('POL-ALP-NORTH', 'Alappuzha North Police Station', 'POLICE', 'ALP_POL_NORTH', 'ALP@North2026', 'ACTIVE'),
('POL-PUNNAPRA', 'Punnapra Police Station', 'POLICE', 'ALP_POL_PUNNAPRA', 'ALP@Punnapra2026', 'ACTIVE'),
('POL-AMBALAPUZHA', 'Ambalapuzha Police Station', 'POLICE', 'ALP_POL_AMBALAPUZHA', 'ALP@Ambalapuzha2026', 'ACTIVE'),
('POL-NEDUMUDY', 'Nedumudy Police Station', 'POLICE', 'ALP_POL_NEDUMUDY', 'ALP@Nedumudy2026', 'ACTIVE'),
('POL-MARARIKKULAM', 'Mararikkulam Police Station', 'POLICE', 'ALP_POL_MARARIKKULAM', 'ALP@Mararikkulam2026', 'ACTIVE'),
('POL-MANNANCHERY', 'Mannanchery Police Station', 'POLICE', 'ALP_POL_MANNANCHERY', 'ALP@Mannanchery2026', 'ACTIVE'),
('POL-CHERTHALA', 'Cherthala Police Station', 'POLICE', 'ALP_POL_CHERTHALA', 'ALP@Cherthala2026', 'ACTIVE'),
('POL-AROOR', 'Aroor Police Station', 'POLICE', 'ALP_POL_AROOR', 'ALP@Aroor2026', 'ACTIVE'),
('POL-KUTHIATHODE', 'Kuthiathode Police Station', 'POLICE', 'ALP_POL_KUTHIATHODE', 'ALP@Kuthiathode2026', 'ACTIVE'),
('POL-PATTANAKKAD', 'Pattanakkad Police Station', 'POLICE', 'ALP_POL_PATTANAKKAD', 'ALP@Pattanakkad2026', 'ACTIVE'),
('POL-MUHAMMA', 'Muhamma Police Station', 'POLICE', 'ALP_POL_MUHAMMA', 'ALP@Muhamma2026', 'ACTIVE'),
('POL-ARTHUNKAL', 'Arthunkal Police Station', 'POLICE', 'ALP_POL_ARTHUNKAL', 'ALP@Arthunkal2026', 'ACTIVE'),
('POL-PULINCUNNU', 'Pulincunnu Police Station', 'POLICE', 'ALP_POL_PULINCUNNU', 'ALP@Pulincunnu2026', 'ACTIVE'),
('POL-EDATHUA', 'Edathua Police Station', 'POLICE', 'ALP_POL_EDATHUA', 'ALP@Edathua2026', 'ACTIVE'),
('POL-RAMANKARI', 'Ramankari Police Station', 'POLICE', 'ALP_POL_RAMANKARI', 'ALP@Ramankari2026', 'ACTIVE'),
('POL-KAINADY', 'Kainady Police Station', 'POLICE', 'ALP_POL_KAINADY', 'ALP@Kainady2026', 'ACTIVE'),
('POL-KAYAMKULAM', 'Kayamkulam Police Station', 'POLICE', 'ALP_POL_KAYAMKULAM', 'ALP@Kayamkulam2026', 'ACTIVE'),
('POL-HARIPPAD', 'Harippad Police Station', 'POLICE', 'ALP_POL_HARIPPAD', 'ALP@Harippad2026', 'ACTIVE'),
('POL-KAREELAKULANGARA', 'Kareelakulangara Police Station', 'POLICE', 'ALP_POL_KAREELAKULANGARA', 'ALP@Kareelakulangara2026', 'ACTIVE'),
('POL-TRIKKUNNAPUZHA', 'Trikkunnapuzha Police Station', 'POLICE', 'ALP_POL_TRIKKUNNAPUZHA', 'ALP@Trikkunnapuzha2026', 'ACTIVE'),
('POL-KANAKAKUNNU', 'Kanakakunnu Police Station', 'POLICE', 'ALP_POL_KANAKAKUNNU', 'ALP@Kanakakunnu2026', 'ACTIVE'),
('POL-VALLIKUNNAM', 'Vallikunnam Police Station', 'POLICE', 'ALP_POL_VALLIKUNNAM', 'ALP@Vallikunnam2026', 'ACTIVE'),
('POL-CHENGANNUR', 'Chengannur Police Station', 'POLICE', 'ALP_POL_CHENGANNUR', 'ALP@Chengannur2026', 'ACTIVE'),
('POL-MANNAR', 'Mannar Police Station', 'POLICE', 'ALP_POL_MANNAR', 'ALP@Mannar2026', 'ACTIVE'),
('POL-VENMONY', 'Venmony Police Station', 'POLICE', 'ALP_POL_VENMONY', 'ALP@Venmony2026', 'ACTIVE'),
('POL-MAVELIKARA', 'Mavelikara Police Station', 'POLICE', 'ALP_POL_MAVELIKARA', 'ALP@Mavelikara2026', 'ACTIVE'),
('POL-NOORANAD', 'Nooranad Police Station', 'POLICE', 'ALP_POL_NOORANAD', 'ALP@Nooranad2026', 'ACTIVE'),
('POL-KURATHIKAD', 'Kurathikad Police Station', 'POLICE', 'ALP_POL_KURATHIKAD', 'ALP@Kurathikad2026', 'ACTIVE'),
('POL-VEEYAPURAM', 'Veeyapuram Police Station', 'POLICE', 'ALP_POL_VEEYAPURAM', 'ALP@Veeyapuram2026', 'ACTIVE'),
('POL-CYBER', 'Cyber Police Station', 'POLICE', 'ALP_POL_CYBER', 'ALP@Cyber2026', 'ACTIVE'),
('POL-VANITHA', 'Alappuzha Vanitha Police Station', 'POLICE', 'ALP_POL_VANITHA', 'ALP@Vanitha2026', 'ACTIVE'),
('POL-COASTAL', 'Thottappally Coastal Police Station', 'POLICE', 'ALP_POL_COASTAL', 'ALP@Coastal2026', 'ACTIVE'),
('POL-TRAFFIC', 'Alappuzha Traffic Police Station', 'POLICE', 'ALP_POL_TRAFFIC', 'ALP@Traffic2026', 'ACTIVE'),
('FRS-ALAPPUZHA', 'Fire and Rescue Station, Alappuzha', 'FIRE_AND_RESCUE', 'ALP_FRS_ALAPPUZHA', 'FRS@Alappuzha2026', 'ACTIVE'),
('FRS-AROOR', 'Fire and Rescue Station, Aroor', 'FIRE_AND_RESCUE', 'ALP_FRS_AROOR', 'FRS@Aroor2026', 'ACTIVE'),
('FRS-CHERTHALA', 'Fire and Rescue Station, Cherthala', 'FIRE_AND_RESCUE', 'ALP_FRS_CHERTHALA', 'FRS@Cherthala2026', 'ACTIVE'),
('FRS-THAKAZHY', 'Fire and Rescue Station, Thakazhy', 'FIRE_AND_RESCUE', 'ALP_FRS_THAKAZHY', 'FRS@Thakazhy2026', 'ACTIVE'),
('FRS-HARIPAD', 'Fire and Rescue Station, Haripad', 'FIRE_AND_RESCUE', 'ALP_FRS_HARIPAD', 'FRS@Haripad2026', 'ACTIVE'),
('FRS-KAYAMKULAM', 'Fire and Rescue Station, Kayamkulam', 'FIRE_AND_RESCUE', 'ALP_FRS_KAYAMKULAM', 'FRS@Kayamkulam2026', 'ACTIVE'),
('FRS-MAVELIKKARA', 'Fire and Rescue Station, Mavelikkara', 'FIRE_AND_RESCUE', 'ALP_FRS_MAVELIKKARA', 'FRS@Mavelikkara2026', 'ACTIVE'),
('FRS-CHENGANNUR', 'Fire and Rescue Station, Chengannur', 'FIRE_AND_RESCUE', 'ALP_FRS_CHENGANNUR', 'FRS@Chengannur2026', 'ACTIVE');
