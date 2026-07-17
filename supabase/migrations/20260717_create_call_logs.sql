-- supabase/migrations/20260717_create_call_logs.sql

CREATE TABLE IF NOT EXISTS public.call_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id text,
    patient_id text NOT NULL,
    appointment_id text NOT NULL,
    call_status text NOT NULL DEFAULT 'Call Initiated',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" 
ON public.call_logs FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Enable insert access for authenticated users" 
ON public.call_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" 
ON public.call_logs FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
