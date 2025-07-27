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
    const { noteContent, itemId, itemTitle, creatorId } = await req.json();

    if (!noteContent || !itemId || !itemTitle || !creatorId) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase URL or Service Role Key not set in environment variables.');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Regex to find all mentions in the format @[DisplayName](user:uuid)
    const mentionRegex = /@\[([^\]]+)\]\(user:([a-fA-F0-9-]+)\)/g;
    const mentionedUserIds = new Set<string>();
    let match;
    while ((match = mentionRegex.exec(noteContent)) !== null) {
      mentionedUserIds.add(match[2]);
    }

    if (mentionedUserIds.size === 0) {
      return new Response(JSON.stringify({ message: 'No mentions found.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    // Fetch creator's name for the notification message
    const { data: creatorProfile, error: creatorError } = await supabaseAdmin
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', creatorId)
      .single();

    if (creatorError) throw new Error(`Failed to fetch creator profile: ${creatorError.message}`);
    
    const creatorName = `${creatorProfile.first_name || ''} ${creatorProfile.last_name || ''}`.trim() || 'Someone';

    const notificationsToInsert = Array.from(mentionedUserIds)
      .filter(id => id !== creatorId) // Don't notify the user for mentioning themselves
      .map(userId => ({
        user_id: userId,
        kanban_item_id: itemId,
        message: `${creatorName} mentioned you in a note on the item "${itemTitle}".`,
        is_read: false,
      }));

    if (notificationsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('notifications')
        .insert(notificationsToInsert);

      if (insertError) throw new Error(`Failed to insert notifications: ${insertError.message}`);
    }

    return new Response(JSON.stringify({ message: 'Notifications processed successfully.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error: any) {
    console.error('Error in create-mention-notification Edge Function:', error.message);
    return new Response(JSON.stringify({ error: 'Internal server error.', details: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});