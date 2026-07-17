import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const body = await req.json();
    const { to_number, call_context } = body;

    if (!to_number || !call_context) {
      throw new Error('Missing required parameters: to_number, call_context');
    }

    const omnidimApiKey = Deno.env.get('OMNIDIM_API_KEY');
    const omnidimAgentId = Deno.env.get('OMNIDIM_AGENT_ID');

    if (!omnidimApiKey || !omnidimAgentId) {
      throw new Error('Server configuration error: Missing Omnidimensions credentials in Edge Function Secrets');
    }

    const payload = {
      agent_id: omnidimAgentId,
      to_number: to_number,
      call_context: call_context
    };

    const omnidimRes = await fetch('https://backend.omnidim.io/api/v1/calls/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${omnidimApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await omnidimRes.json();
    
    if (!omnidimRes.ok) {
      throw new Error(data.message || 'Failed to dispatch call to Omnidimensions');
    }

    // Insert call log
    const { error: dbError } = await supabaseClient
      .from('call_logs')
      .insert({
        request_id: data.request_id || crypto.randomUUID(),
        patient_id: call_context.patient_id,
        appointment_id: call_context.appointment_id,
        call_status: 'Call Initiated',
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Error logging call:', dbError);
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Edge Function Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
