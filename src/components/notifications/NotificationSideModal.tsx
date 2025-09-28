import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Loader2, 
  X, 
  AlertCircle, 
  Info, 
  CheckCircle, 
  XCircle,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { socketManager } from '@/lib/socketManager';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  source_entity?: {
    entity_type: string;
    entity_id: string;
    entity_data: any;
  };
}

interface NotificationSideModalProps {
  children: React.ReactNode;
}

const NotificationSideModal: React.FC<NotificationSideModalProps> = ({ children }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterType, setFilterType] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const [connected, setConnected] = useState(false);

  // Check notification socket connection state
  const getNotificationSocketConnection = () => {
    const notificationSocket = socketManager.getNotificationSocket();
    return notificationSocket?.isConnected() || false;
  };

  useEffect(() => {
    const checkConnection = () => {
      const isConnected = getNotificationSocketConnection();
      setConnected(isConnected);
    };
    checkConnection();
    const connectionCheckInterval = setInterval(checkConnection, 1000);
    return () => {
      clearInterval(connectionCheckInterval);
    };
  }, []);

  // Initialize notification socket connection
  useEffect(() => {
    const initNotificationSocket = async () => {
      try {
        await socketManager.connectNotificationSocket();
        const notificationSocket = socketManager.getNotificationSocket();
        
        if (notificationSocket) {
          notificationSocket.on('notification_connected', (data) => {
            console.log('Notification socket connected:', data);
            setConnected(true);
            notificationSocket.emit('get_unread_count');
          });
          notificationSocket.on('notifications_data', (data) => {
            setNotifications(data.notifications);
            setUnreadCount(data.unread_count);
            setTotalPages(data.pagination.total_pages);
            setLoading(false);
          });

          notificationSocket.on('new_notification', (data) => {
            setNotifications(prev => [data.notification, ...prev]);
            setUnreadCount(data.unread_count);
            toast({
              title: data.notification.title,
              description: data.notification.message,
              duration: 5000,
            });
          });

          notificationSocket.on('unread_count_update', (data) => {
            setUnreadCount(data.unread_count);
          });

          notificationSocket.on('notification_marked_read', (data) => {
            setNotifications(prev => 
              prev.map(n => 
                n._id === data.notification_id ? { ...n, is_read: true } : n
              )
            );
            setUnreadCount(data.unread_count);
          });

          notificationSocket.on('all_notifications_marked_read', (data) => {
            setNotifications(prev => 
              prev.map(n => ({ ...n, is_read: true }))
            );
            setUnreadCount(0);
            toast({
              title: 'Success',
              description: `${data.modified_count} notifications marked as read`,
            });
          });

          notificationSocket.on('notification_deleted', (data) => {
            setNotifications(prev => 
              prev.filter(n => n._id !== data.notification_id)
            );
            setUnreadCount(data.unread_count);
            toast({
              title: 'Success',
              description: 'Notification deleted',
            });
          });

          notificationSocket.on('notification_error', (error) => {
            console.error('Notification socket error:', error);
            toast({
              title: 'Error',
              description: error.message,
              variant: 'destructive',
            });
            setLoading(false);
          });

          notificationSocket.on('disconnect', () => {
            setConnected(false);
            console.log('Notification socket disconnected');
          });

          notificationSocket.on('connect', () => {
            setConnected(true);
            console.log('Notification socket reconnected');
          });
        }
      } catch (error) {
        console.error('Failed to initialize notification socket:', error);
        setConnected(false);
      }
    };

    initNotificationSocket();

    return () => {
      // Clean up event listeners
      const notificationSocket = socketManager.getNotificationSocket();
      if (notificationSocket) {
        notificationSocket.off('notification_connected');
        notificationSocket.off('notifications_data');
        notificationSocket.off('new_notification');
        notificationSocket.off('unread_count_update');
        notificationSocket.off('notification_marked_read');
        notificationSocket.off('all_notifications_marked_read');
        notificationSocket.off('notification_deleted');
        notificationSocket.off('notification_error');
        notificationSocket.off('disconnect');
        notificationSocket.off('connect');
      }
    };
  }, [toast]);

  // Fetch notifications when modal opens or filters change
  useEffect(() => {
    if (isOpen && connected) {
      fetchNotifications();
    }
  }, [isOpen, connected, currentPage, filterType, filterRead]);

  const fetchNotifications = () => {
    setLoading(true);
    const notificationSocket = socketManager.getNotificationSocket();
    if (notificationSocket) {
      notificationSocket.emit('get_notifications', {
        page: currentPage,
        limit: 20,
        type: filterType,
        is_read: filterRead
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    const notificationSocket = socketManager.getNotificationSocket();
    if (notificationSocket) {
      notificationSocket.emit('mark_notification_read', {
        notification_id: notificationId
      });
    }
  };

  const markAllAsRead = () => {
    const notificationSocket = socketManager.getNotificationSocket();
    if (notificationSocket) {
      notificationSocket.emit('mark_all_notifications_read');
    }
  };

  const deleteNotification = (notificationId: string) => {
    const notificationSocket = socketManager.getNotificationSocket();
    if (notificationSocket) {
      notificationSocket.emit('delete_notification', {
        notification_id: notificationId
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'default';
      case 'low':
        return 'outline';
      default:
        return 'default';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification._id);
    }
    
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="relative">
          {children}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </div>
      </SheetTrigger>
      
      <SheetContent side="right" className="w-[450px] sm:w-[500px] p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 pb-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {unreadCount} unread
                  </Badge>
                )}
              </SheetTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  Mark all read
                </Button>
              )}
            </div>
            
            {/* Connection Status */}
            <div className="flex items-center gap-2 text-sm mt-2">
              <div className={`h-2 w-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-muted-foreground">
                {connected ? 'Connected' : 'Disconnected - Trying to reconnect...'}
              </span>
            </div>
          </SheetHeader>

          <Separator />

          {/* Filters */}
          <div className="p-4 space-y-3 flex-shrink-0">
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterRead} onValueChange={setFilterRead}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="false">Unread</SelectItem>
                  <SelectItem value="true">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Notifications List */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span className="ml-2">Loading notifications...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notification) => (
                      <div
                        key={notification._id}
                        className={`p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                          !notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-background'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium break-words">
                                  {notification.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1 break-words">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Badge variant={getPriorityColor(notification.priority) as any} className="text-xs">
                                  {notification.priority}
                                </Badge>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {!notification.is_read && (
                                      <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation();
                                        markAsRead(notification._id);
                                      }}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as read
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteNotification(notification._id);
                                      }}
                                      className="text-destructive"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              
                              {notification.source_entity && (
                                <Badge variant="outline" className="text-xs">
                                  {notification.source_entity.entity_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <>
              <Separator />
              <div className="p-4 flex justify-between items-center flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationSideModal;