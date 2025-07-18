/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const payload = await req.json();
    console.log("Rally Trigger received payload:", payload);

    const zapierWebhookUrl = Deno.env.get('ZAPIER_WEBHOOK_URL');
    console.log("ZAPIER_WEBHOOK_URL:", zapierWebhookUrl ? "Set" : "Not Set"); // Log if URL is set

    if (!zapierWebhookUrl) {
      console.error('ZAPIER_WEBHOOK_URL environment variable is not set.');
      return new Response(JSON.stringify({ error: 'Server configuration error: Zapier webhook URL missing. Please set ZAPIER_WEBHOOK_URL in Supabase secrets.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    // Dispatch this payload to the Zapier webhook
    const zapierResponse = await fetch(zapierWebhookUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!zapierResponse.ok) {
      const errorText = await zapierResponse.text();
      console.error('Error sending data to Zapier:', zapierResponse.status, errorText);
      return new Response(JSON.stringify({ error: `Failed to send data to Zapier. Status: ${zapierResponse.status}, Message: ${zapierResponse.statusText}. Details: ${errorText}` }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      });
    }

    console.log('Data successfully sent to Zapier.');

    return new Response(JSON.stringify({ message: 'Rally data received and processed by trigger, sent to Zapier.', data: payload }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in rally-trigger Edge Function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});