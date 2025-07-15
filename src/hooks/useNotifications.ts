import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Notification } from "@/types/crm";

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notifications:", error);
      toast({ title: "Error", description: "Failed to load notifications.", variant: "destructive" });
    } else {
      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      toast({ title: "Error", description: "Failed to mark notification as read.", variant: "destructive" });
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false); // Only update unread ones

      if (error) throw error;

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      toast({ title: "Error", description: "Failed to mark all notifications as read.", variant: "destructive" });
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
      setUnreadCount(0);
      toast({
        title: "Notifications cleared",
        description: "All your notifications have been removed.",
      });
    } catch (error: any) {
      console.error("Error deleting all notifications:", error);
      toast({ title: "Error", description: "Failed to clear notifications.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Set up Realtime listener for new notifications
    const channel = supabase
      .channel('notifications_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          // Re-fetch all notifications to ensure we get the latest state and correct unread count
          // This is simpler than trying to filter by user_id in the Realtime listener directly
          // and relies on RLS to only send relevant data if configured.
          fetchNotifications(); 
          toast({
            title: "New Notification!",
            description: (payload.new as Notification).message,
            duration: 5000,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]); // Depend on toast to avoid lint warnings, though it's stable

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteAllNotifications, // Export the new function
    refetchNotifications: fetchNotifications,
  };
}