import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
      suggestions.push("Assign a primary contact to this deal.");
    }
    if (!deal.assigned_to) {
      missingFields.push("Assigned User");
      suggestions.push("Assign a user responsible for this deal.");
    }
    if (!deal.expected_close_date) {
      missingFields.push("Expected Close Date");
      suggestions.push("Set an expected close date for better forecasting and pipeline management.");
    }
    if (!deal.description || deal.description.trim() === "") {
      missingFields.push("Description");
      suggestions.push("Add a detailed description to provide context for the deal.");
    }
    if (!deal.tier) {
      missingFields.push("Tier");
      suggestions.push("Assign a tier to the deal for better categorization and reporting.");
    }

    // --- Attachment Checks ---
    const hasContract = deal.attachments?.some((att: any) => att.attachment_type === 'contract');
    const hasReceipt = deal.attachments?.some((att: any) => att.attachment_type === 'receipt');

    const stagesRequiringContractOrReceipt = ['in_development', 'demo', 'paid', 'completed', 'cancelled'];

    if (stagesRequiringContractOrReceipt.includes(deal.stage)) {
      if (!hasContract) {
        missingFields.push("Contract Attachment");
        suggestions.push("Upload the signed contract for this deal.");
      }
      if (!hasReceipt) {
        missingFields.push("Receipt Attachment");
        suggestions.push("Upload the payment receipt for this deal.");
      }
    } else if (!deal.attachments || deal.attachments.length === 0) {
      suggestions.push("Consider uploading relevant attachments (e.g., initial proposal, brief, or meeting notes).");
    }

    // --- Stage-Specific Checks and Suggestions ---
    switch (deal.stage) {
      case 'lead':
        if (!deal.description || deal.description.length < 20) {
          suggestions.push("Expand the description to capture more initial lead details and potential needs.");
        }
        if (deal.value === 0) { // Only suggest if value is 0
          suggestions.push("Estimate an initial value range for this lead.");
        }
        break;
      case 'discovery_call':
        if (!deal.expected_close_date) {
          suggestions.push("Define a realistic expected close date after the discovery call.");
        }
        if (deal.value === 0) {
          suggestions.push("Update the deal value based on the discovery call outcome.");
        }
        suggestions.push("Summarize key findings from the discovery call in a business note.");
        break;
      case 'in_development':
      case 'demo':
        // Assigned user is already a general missing field, no need to duplicate suggestion here.
        if (deal.expected_close_date && new Date(deal.expected_close_date) < new Date()) {
          suggestions.push("The expected close date is in the past. Review and update the date or advance the deal stage.");
        }
        suggestions.push("Add development notes to document technical progress or challenges.");
        break;
      case 'paid':
      case 'completed':
        if (deal.value === 0) {
          suggestions.push("Verify the final deal value is accurate for this paid/completed deal.");
        }
        suggestions.push("Ensure all final documentation (e.g., project closure report, client feedback) is attached.");
        break;
      case 'cancelled':
        if (!deal.notes || deal.notes.length === 0 || !deal.notes.some((note: any) => note.content.toLowerCase().includes('cancellation reason'))) {
          suggestions.push("Document the specific reason for cancellation in a note for future analysis.");
        }
        break;
      default:
        // No specific suggestions for other stages
        break;
    }

    // --- Deal Breaker Logic (Refined) ---
    if (deal.stage === 'in_development' && (!deal.assigned_to || !deal.expected_close_date || !hasContract)) {
      dealBreakerWarning = true;
    }
    if (deal.stage === 'demo' && (!deal.assigned_to || deal.value === 0 || !hasContract)) {
      dealBreakerWarning = true;
    }
    if (deal.stage === 'paid' && (deal.value === 0 || !hasContract || !hasReceipt)) {
      dealBreakerWarning = true;
    }
    if (deal.stage === 'completed' && (deal.value === 0 || !hasContract || !hasReceipt)) {
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