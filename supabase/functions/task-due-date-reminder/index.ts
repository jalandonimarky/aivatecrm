import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
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
    // Initialize Supabase client with service role key for full access
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase URL or Service Role Key not set in environment variables.');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const today = format(new Date(), 'yyyy-MM-dd');
    const tomorrow = format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

    // Fetch tasks that are due today, tomorrow, or are overdue and not completed
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, due_date, assigned_to, status')
      .neq('status', 'completed') // Exclude completed tasks
      .or(`due_date.eq.${today},due_date.eq.${tomorrow},due_date.lt.${today}`); // Due today, tomorrow, or overdue

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError.message);
      throw new Error(`Failed to fetch tasks: ${tasksError.message}`);
    }

    if (!tasks || tasks.length === 0) {
      return new Response(JSON.stringify({ message: 'No tasks found for reminders.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    const notificationsToInsert = [];
    for (const task of tasks) {
      if (task.assigned_to) {
        let message = '';
        const taskDueDate = task.due_date ? new Date(task.due_date) : null;
        const isOverdue = taskDueDate && taskDueDate < new Date(today);

        if (isOverdue) {
          message = `Task overdue: "${task.title}" was due on ${format(taskDueDate, 'MMM dd, yyyy')}.`;
        } else if (task.due_date === today) {
          message = `Reminder: Task "${task.title}" is due today!`;
        } else if (task.due_date === tomorrow) {
          message = `Heads up: Task "${task.title}" is due tomorrow.`;
        }

        if (message) {
          notificationsToInsert.push({
            user_id: task.assigned_to,
            task_id: task.id,
            message: message,
            is_read: false,
          });
        }
      }
    }

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notificationsToInsert);

      if (insertError) {
        console.error('Error inserting notifications:', insertError.message);
        throw new Error(`Failed to insert notifications: ${insertError.message}`);
      }
      console.log(`Inserted ${notificationsToInsert.length} due date notifications.`);
    } else {
      console.log('No new due date notifications to insert.');
    }

    return new Response(JSON.stringify({ message: 'Task due date reminders processed successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in task-due-date-reminder Edge Function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});