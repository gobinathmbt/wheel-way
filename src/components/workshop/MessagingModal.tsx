import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { workshopServices } from '@/api/services';
import { Send, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface MessagingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  field: any;
}

const MessagingModal: React.FC<MessagingModalProps> = ({
  open,
  onOpenChange,
  field
}) => {
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();

  // Fetch messages for the field
  const { data: messagesData, isLoading } = useQuery({
    queryKey: ['field-messages', field?.vehicle_type, field?.vehicle_stock_id, field?.field_id],
    queryFn: async () => {
      if (!field) return [];
      // This would be a new API endpoint to get messages
      // For now, return mock data
      return [];
    },
    enabled: open && !!field
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      // This would be a new API endpoint to send messages
      // For now, just simulate success
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Message sent successfully');
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['field-messages'] });
    },
    onError: (error: any) => {
      toast.error('Failed to send message');
    }
  });

  const handleSendMessage = () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    sendMessageMutation.mutate({
      field_id: field?.field_id,
      vehicle_stock_id: field?.vehicle_stock_id,
      vehicle_type: field?.vehicle_type,
      message: newMessage,
      sender_type: 'company'
    });
  };

  const messages = messagesData || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Messages for {field?.field_name}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 space-y-4">
          {/* Messages Area */}
          <Card className="flex-1">
            <CardHeader>
              <CardTitle className="text-sm">Conversation with Approved Supplier</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64 p-4">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : messages.length > 0 ? (
                  <div className="space-y-4">
                    {messages.map((message: any, index: number) => (
                      <div
                        key={index}
                        className={`flex ${
                          message.sender_type === 'company' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`flex items-start gap-2 max-w-[70%] ${
                            message.sender_type === 'company' ? 'flex-row-reverse' : ''
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {message.sender_type === 'company' ? 'C' : 'S'}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`p-3 rounded-lg ${
                              message.sender_type === 'company'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p
                              className={`text-xs mt-1 ${
                                message.sender_type === 'company'
                                  ? 'text-primary-foreground/70'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {new Date(message.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground">
                      Start a conversation with the approved supplier
                    </p>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Input */}
          <div className="space-y-2">
            <Textarea
              placeholder="Type your message to the supplier..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="min-h-[80px]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Press Shift+Enter for new line, Enter to send
              </p>
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || sendMessageMutation.isPending}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendMessageMutation.isPending ? 'Sending...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MessagingModal;