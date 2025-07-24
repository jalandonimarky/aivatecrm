import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { format } from 'https://esm.sh/date-fns@3.6.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { item } = await req.json();

    if (!item || !item.id) {
      return new Response(JSON.stringify({ error: 'Missing Kanban item data in request body.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const missingFields: string[] = [];
    const suggestions: string[] = [];
    let criticalItemAlert = false; // Renamed from dealBreakerWarning

    // --- General Checks ---
    if (!item.description || item.description.trim() === "") {
      missingFields.push("Description");
      suggestions.push("Add a detailed description to provide context for this item.");
    }
    if (!item.category) {
      missingFields.push("Category");
      suggestions.push("Assign a category to help organize and filter this item.");
    }
    if (!item.priority_level) {
      missingFields.push("Priority Level");
      suggestions.push("Set a priority level to indicate the urgency of this item.");
    }
    if (!item.assigned_to) {
      missingFields.push("Assigned To");
      suggestions.push("Assign a user responsible for this item.");
    }
    if (!item.due_date) {
      missingFields.push("Due Date");
      suggestions.push("Set a due date for better tracking and timely completion.");
    } else {
      const itemDueDate = new Date(item.due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize today's date to start of day

      if (itemDueDate < today) {
        suggestions.push(`The due date (${format(itemDueDate, 'MMM dd, yyyy')}) is in the past. Consider updating it or marking the item as complete.`);
      }
    }
    
    // If due date is set but time is not
    if (item.due_date && (!item.event_time || item.event_time.trim() === "")) {
      suggestions.push("Consider adding a specific time for the due date.");
    }

    // --- Critical Item Alert Logic ---
    // A high-priority item (P0 or P1) is critical if it's missing an assignee or a due date, or if the due date is in the past.
    if (item.priority_level && ['p0', 'p1'].includes(item.priority_level.toLowerCase())) {
      if (!item.assigned_to || !item.due_date || (item.due_date && new Date(item.due_date) < new Date())) {
        criticalItemAlert = true;
      }
    }

    const insights = {
      missingFields,
      suggestions,
      criticalItemAlert,
    };

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in kanban-item-hygiene-checker Edge Function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});