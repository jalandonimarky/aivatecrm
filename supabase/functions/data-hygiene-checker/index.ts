// @ts-nocheck
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
    const deal = payload.deal;

    if (!deal) {
      return new Response(JSON.stringify({ error: 'Deal data is required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    let missingFields: string[] = [];
    let suggestions: string[] = [];
    let dealBreakerWarning: boolean = false;

    // --- Data Hygiene Checks ---

    // Critical fields for any deal
    if (!deal.title || deal.title.trim() === '') {
      missingFields.push("Title");
      suggestions.push("Add a clear and descriptive title for the deal.");
    }
    if (!deal.value || deal.value <= 0) {
      missingFields.push("Value");
      suggestions.push("Set a realistic value for the deal.");
      if (deal.stage !== 'paid' && deal.stage !== 'cancelled') {
        dealBreakerWarning = true; // Critical if value is missing for an active deal
        suggestions.push("Urgent: Deal value is missing or zero, which is a potential deal breaker.");
      }
    }
    if (!deal.expected_close_date) {
      missingFields.push("Expected Close Date");
      suggestions.push("Set an expected close date to track deal progress.");
      if (deal.stage !== 'paid' && deal.stage !== 'cancelled') {
        dealBreakerWarning = true; // Critical if close date is missing for an active deal
        suggestions.push("Urgent: Expected close date is missing, which can impact forecasting.");
      }
    }

    // Important fields for better tracking
    if (!deal.description || deal.description.trim() === '') {
      missingFields.push("Description");
      suggestions.push("Add a detailed description of the project or client needs.");
    }
    if (!deal.contact_id) {
      missingFields.push("Related Contact");
      suggestions.push("Link the deal to an existing contact.");
    }
    if (!deal.assigned_to) {
      missingFields.push("Assigned To");
      suggestions.push("Assign the deal to a team member.");
    }
    if (!deal.tier) {
      missingFields.push("Tier");
      suggestions.push("Categorize the deal with a tier (e.g., 1-OFF, System Development).");
    }

    // --- Next Best Action based on Stage ---
    switch (deal.stage) {
      case 'lead':
        suggestions.push("Schedule a discovery call with the lead.");
        break;
      case 'discovery_call':
        suggestions.push("Prepare a detailed proposal based on the discovery call.");
        break;
      case 'demo':
        suggestions.push("Follow up after the demo to address any questions.");
        break;
      case 'in_development':
        suggestions.push("Ensure development tasks are on track and communicate progress to the client.");
        break;
      case 'paid':
        suggestions.push("Send a thank you note and request a testimonial.");
        break;
      case 'completed':
        suggestions.push("Review the project for lessons learned and update client records.");
        break;
      case 'cancelled':
        suggestions.push("Analyze reasons for cancellation to improve future deals.");
        break;
    }

    // Deduplicate suggestions
    suggestions = [...new Set(suggestions)];

    // --- Placeholder for actual AI integration ---
    // If you want to integrate a real AI model (e.g., OpenAI's GPT),
    // you would typically make an API call here.
    // Example (requires OPENAI_API_KEY to be set as a Supabase secret):
    /*
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (OPENAI_API_KEY) {
      const aiPrompt = `Analyze the following CRM deal data and provide a list of missing critical information, next best actions, and identify if it's a potential deal breaker.
      Deal Data: ${JSON.stringify(deal, null, 2)}
      Output format: JSON with keys: missingFields (array of strings), suggestions (array of strings), dealBreakerWarning (boolean).`;

      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo", // Or gpt-4o, etc.
          messages: [{ role: "user", content: aiPrompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const aiInsights = JSON.parse(aiData.choices[0].message.content);
        missingFields = [...new Set([...missingFields, ...aiInsights.missingFields])];
        suggestions = [...new Set([...suggestions, ...aiInsights.suggestions])];
        dealBreakerWarning = dealBreakerWarning || aiInsights.dealBreakerWarning;
      } else {
        console.error("AI API call failed:", await aiResponse.text());
      }
    }
    */

    return new Response(JSON.stringify({ missingFields, suggestions, dealBreakerWarning }), {
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