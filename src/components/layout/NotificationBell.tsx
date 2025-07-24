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

export function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteAllNotifications } = useNotifications();
  const navigate = useNavigate(); // Initialize useNavigate

  const handleNotificationClick = (notificationId: string, taskId?: string | null, kanbanItemId?: string | null) => {
    markAsRead(notificationId); // Mark as read first
    if (taskId) {
      navigate(`/tasks/${taskId}`); // Navigate to task details if task_id exists
    } else if (kanbanItemId) {
      // For Kanban items, we need to navigate to the Kanban board and potentially highlight the item
      // For simplicity, we'll navigate to the Kanban page with the boardId as a search param.
      // A more advanced implementation might require fetching the item's column and board to navigate precisely.
      // For now, we'll just go to the main Kanban page.
      navigate(`/kanban`); // Navigate to the Kanban board page
      // If you want to navigate to a specific board, you'd need to fetch the board_id from the kanban_item_id
      // For example: navigate(`/kanban?boardId=${boardId}`);
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
          {unreadCount > 0 && (
            <Button variant="link" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs">
              Mark all as read
            </Button>
          )}
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
                  onClick={() => handleNotificationClick(notification.id, notification.task_id, notification.kanban_item_id)} // Added kanban_item_id
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
        {notifications.length > 0 && (
          <div className="p-2 flex justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={deleteAllNotifications} 
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              title="Clear All Notifications"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}