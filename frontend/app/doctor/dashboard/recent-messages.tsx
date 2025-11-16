"use client";

import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";
import { userIdKey, tokenKey, apiUrl } from "@/lib/config";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

interface Message {
  id: string;
  senderName: string;
  senderImage?: string;
  content: string;
  time: string;
  isUnread: boolean;
}

interface RecentMessagesProps {
  messages?: Message[]; // Make messages optional, the component can load its own data
}

export function RecentMessages({ messages: externalMessages }: RecentMessagesProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>(externalMessages || []);
  const { toast } = useToast();

  // Initialize user data and fetch messages if not provided externally
  useEffect(() => {
    const storedUserId = localStorage.getItem(userIdKey);
    const storedToken = localStorage.getItem(tokenKey);

    setUserId(storedUserId);
    setToken(storedToken);

    // Only fetch if we don't have external messages
    if (!externalMessages && storedUserId && storedToken) {
      fetchRecentMessages(storedUserId, storedToken);
    }
  }, [externalMessages]);

  // Fetch recent messages from the API
  const fetchRecentMessages = async (userId: string, token: string) => {
    setLoading(true);
    setError(null);

    try {
      // Fetch conversations first
      const conversationsResponse = await fetch(
        `${apiUrl}/api/chat/conversations/${userId}?page=1&limit=5`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!conversationsResponse.ok) {
        throw new Error(`Failed to fetch conversations: ${conversationsResponse.status}`);
      }

      const conversationsData = await conversationsResponse.json();

      if (conversationsData.success && conversationsData.conversations) {
        // Map conversations to messages format
        const recentMessages: Message[] = [];

        // Process each conversation
        for (const conv of conversationsData.conversations) {
          // Skip conversations without last messages
          if (!conv.lastMessage) continue;

          // Find the participant who is not the current user
          const otherParticipant = conv.participants.find(
            (p: any) => (p.id || p.userId || p.user) !== userId
          );

          if (otherParticipant) {
            const name = otherParticipant.name || 
                        otherParticipant.fullName || 
                        otherParticipant.username || 
                        'Unknown User';

            recentMessages.push({
              id: conv.id || conv._id,
              senderName: name,
              senderImage: otherParticipant.profileImage,
              content: conv.lastMessage.content,
              time: conv.lastMessage.timestamp,
              isUnread: conv.unreadCount > 0
            });
          }
        }

        setMessages(recentMessages);
      }
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      setError("Failed to load recent messages");
      toast({
        title: "Error",
        description: "Could not load recent messages. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Format time helper
  const formatTime = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  // Calculate unread count
  const unreadCount = messages.filter(m => m.isUnread).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Messages</CardTitle>
        <CardDescription>
          You have {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-4">
            <Spinner />
          </div>
        ) : error ? (
          <div className="text-center text-muted-foreground p-4">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2 mx-auto block"
              onClick={() => userId && token && fetchRecentMessages(userId, token)}
            >
              Retry
            </Button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <MessageSquare className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Messages</h3>
            <p className="text-muted-foreground text-center mb-6">
              When patients send you messages, they'll appear here.
            </p>
            <Link href="/doctor/messages">
              <Button variant="outline">Go to Messages</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className="flex items-start space-x-4 rounded-md border p-4"
              >
                <Avatar>
                  <AvatarImage src={message.senderImage} />
                  <AvatarFallback>{message.senderName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{message.senderName}</p>
                    <span className="text-xs text-muted-foreground">{formatTime(message.time)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.content}</p>
                </div>
                {message.isUnread && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </div>
            ))}
            <Link href="/doctor/messages" passHref>
              <Button variant="outline" className="w-full">View All Messages</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}