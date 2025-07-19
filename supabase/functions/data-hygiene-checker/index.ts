import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// No need to import createClient here as we are not interacting with the database directly from this function.

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

    // --- General Checks ---
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

    // Check for attachments
    if (!deal.attachments || deal.attachments.length === 0) {
      suggestions.push("Consider uploading relevant attachments (e.g., contract, proposal).");
    } else {
      // Check for specific attachment types if deal is in later stages
      const hasContractOrReceipt = deal.attachments.some((att: any) => 
        att.attachment_type === 'contract' || att.attachment_type === 'receipt'
      );
      if ((deal.stage === 'paid' || deal.stage === 'completed') && !hasContractOrReceipt) {
        suggestions.push("Upload the contract or receipt for this deal.");
      }
    }

    // --- Stage-Specific Checks ---
    switch (deal.stage) {
      case 'lead':
        if (!deal.description || deal.description.length < 20) {
          suggestions.push("Expand the description to capture more lead details.");
        }
        break;
      case 'discovery_call':
        if (!deal.expected_close_date) {
          suggestions.push("Set an expected close date after the discovery call.");
        }
        if (deal.value === 0) {
          suggestions.push("Update deal value after the discovery call.");
        }
        break;
      case 'in_development':
      case 'demo':
        if (!deal.assigned_to) {
          dealBreakerWarning = true;
          suggestions.push("This deal is in a critical stage but has no assigned user.");
        }
        if (!deal.tasks || deal.tasks.length === 0) {
          suggestions.push("Create tasks to track progress for this development/demo stage.");
        }
        if (deal.expected_close_date && new Date(deal.expected_close_date) < new Date()) {
          suggestions.push("The expected close date is in the past. Update it or move to the next stage.");
        }
        break;
      case 'paid':
      case 'completed':
        if (deal.value === 0) {
          dealBreakerWarning = true;
          suggestions.push("Paid/Completed deal has a value of 0. Please verify.");
        }
        break;
      case 'cancelled':
        if (!deal.notes || deal.notes.length === 0 || !deal.notes.some((note: any) => note.content.toLowerCase().includes('cancellation reason'))) {
          suggestions.push("Add a note explaining the reason for cancellation.");
        }
        break;
      default:
        // No specific suggestions for other stages
        break;
    }

    // --- Deal Breaker Logic (Refined) ---
    if (deal.stage === 'in_development' && (!deal.assigned_to || !deal.expected_close_date)) {
      dealBreakerWarning = true;
    }
    if (deal.stage === 'demo' && (!deal.assigned_to || deal.value === 0)) {
      dealBreakerWarning = true;
    }
    if (deal.stage === 'paid' && deal.value === 0) {
      dealBreakerWarning = true;
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