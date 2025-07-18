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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Fetch deals data
    const { data: deals, error: dealsError } = await supabaseClient
      .from('deals')
      .select('contact_id, assigned_to, expected_close_date');

    if (dealsError) {
      console.error('Error fetching deals:', dealsError);
      throw new Error('Failed to fetch deals data.');
    }

    // Fetch tasks data
    const { data: tasks, error: tasksError } = await supabaseClient
      .from('tasks')
      .select('due_date, assigned_to, status');

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw new Error('Failed to fetch tasks data.');
    }

    // Calculate hygiene insights
    let dealsMissingContact = 0;
    let dealsMissingAssignedUser = 0;
    let dealsMissingCloseDate = 0;

    deals.forEach(deal => {
      if (!deal.contact_id) dealsMissingContact++;
      if (!deal.assigned_to) dealsMissingAssignedUser++;
      if (!deal.expected_close_date) dealsMissingCloseDate++;
    });

    let tasksMissingDueDate = 0;
    let tasksMissingAssignedUser = 0;

    tasks.forEach(task => {
      if (!task.due_date) tasksMissingDueDate++;
      if (!task.assigned_to) tasksMissingAssignedUser++;
    });

    const totalIssues =
      dealsMissingContact +
      dealsMissingAssignedUser +
      dealsMissingCloseDate +
      tasksMissingDueDate +
      tasksMissingAssignedUser;

    const insights = {
      dealsMissingContact,
      dealsMissingAssignedUser,
      dealsMissingCloseDate,
      tasksMissingDueDate,
      tasksMissingAssignedUser,
      totalIssues,
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