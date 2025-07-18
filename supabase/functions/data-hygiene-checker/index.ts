import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { deal } = await req.json();

    if (!deal || !deal.id) {
      return new Response(JSON.stringify({ error: 'Missing deal data in request body.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const missingFields: string[] = [];
    const suggestions: string[] = [];
    let dealBreakerWarning = false;

    // Check for missing fields
    if (!deal.contact_id) {
      missingFields.push("Related Contact");
      suggestions.push("Assign a contact to this deal.");
    }
    if (!deal.assigned_to) {
      missingFields.push("Assigned User");
      suggestions.push("Assign a user to this deal.");
    }
    if (!deal.expected_close_date) {
      missingFields.push("Expected Close Date");
      suggestions.push("Set an expected close date for better forecasting.");
    }
    if (!deal.description || deal.description.trim() === "") {
      missingFields.push("Description");
      suggestions.push("Add a detailed description to the deal.");
    }
    if (!deal.tier) {
      missingFields.push("Tier");
      suggestions.push("Assign a tier to the deal for better categorization.");
    }

    // Specific deal breaker logic (example)
    if (deal.stage === 'in_development' && (!deal.assigned_to || !deal.expected_close_date)) {
      dealBreakerWarning = true;
      suggestions.push("This deal is in development but missing an assigned user or close date, which could be a deal breaker.");
    }

    const insights = {
      missingFields,
      suggestions,
      dealBreakerWarning,
    };

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in data-hygiene-checker Edge Function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});