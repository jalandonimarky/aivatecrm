import React from "react";
import { Bell, XCircle, Trash2 } from "lucide-react"; // Import Trash2 icon
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNowStrict } from "date-fns";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import type { Notification } from "@/types/crm";

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAllNotifications } = useNotifications();
  const navigate = useNavigate(); // Initialize useNavigate

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    // Prioritize navigating to the Kanban item detail page if a kanban_item_id exists
    if (notification.kanban_item_id) {
      navigate(`/kanban/items/${notification.kanban_item_id}`);
    } else if (notification.task_id) {
      navigate(`/tasks/${notification.task_id}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center rounded-full text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex space-x-2"> {/* Group buttons */}
            {unreadCount > 0 && (
              <Button variant="link" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs">
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="link" 
                size="sm" 
                onClick={deleteAllNotifications} 
                className="h-auto p-0 text-xs text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </div>
        </div>
        <Separator />
        <ScrollArea className="h-72">
          <div className="p-4">
            {notifications.length === 0 ? (
              <p className="text-center text-muted-foreground text-sm py-4">No notifications yet.</p>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`flex items-start space-x-3 py-2 ${!notification.is_read ? 'bg-muted/20 rounded-md' : ''} px-2 cursor-pointer hover:bg-muted/50 transition-colors`} // Added cursor-pointer and hover effect
                  onClick={() => handleNotificationClick(notification)} // Updated onClick handler
                >
                  <div className="flex-1">
                    <p className={`text-sm ${!notification.is_read ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNowStrict(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notification.is_read && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} // Stop propagation to prevent parent div click
                      title="Mark as read"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}