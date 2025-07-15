/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Edge Function started.");
    const payload = await req.json();
    console.log("Payload received:", payload);

    const { email, password, first_name, last_name } = payload;

    if (!email || !password || !first_name || !last_name) {
      console.error('Missing required fields in payload.');
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error('Supabase environment variables are not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Supabase credentials missing.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log("Creating Supabase admin client...");
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log("Supabase admin client created.");

    console.log("Attempting to create user:", email);
    const { data: user, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Changed to true to send confirmation email
      user_metadata: { first_name, last_name },
    });
    console.log("createUser call completed.");

    if (signUpError) {
      console.error('Supabase signup error:', signUpError.message);
      return new Response(JSON.stringify({ error: signUpError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log('User created successfully:', user?.user?.id);
    return new Response(JSON.stringify({ message: 'User created successfully. Please check your email to confirm your account.', user: user?.user }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Caught error in signup-validation Edge Function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});