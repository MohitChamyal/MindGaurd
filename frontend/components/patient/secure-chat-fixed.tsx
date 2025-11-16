"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, ChevronLeft, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { userIdKey, userTypeKey, tokenKey, apiUrl } from "@/lib/config";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import useChatWebSocket, { Message } from "@/hooks/useChatWebSocket";
import * as chatService from "@/services/chatService";

export function SecureChatFixed() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState({
    apiConnected: false,
    wsConnected: false,
    lastChecked: null as Date | null
  });
  const [userData, setUserData] = useState({
    userId: "",
    userType: "",
    token: ""
  });
  const [messageDrafts, setMessageDrafts] = useState<{[conversationId: string]: string}>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [typing, setTyping] = useState<{[key: string]: boolean}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // --- Stabilized WebSocket Callbacks ---
  const handleWsMessage = useCallback((message: Message) => {
    console.log("Received message:", message);
    if (message.conversationId === selectedConversation?.id) {
      setMessages(prev => [...prev, message]);
    }
    // Update conversation with last message
    if (message.conversationId) {
      setConversations(prev => 
        prev.map(conv => 
          conv.id === message.conversationId 
            ? { ...conv, lastMessage: message.content, updatedAt: message.timestamp } 
            : conv
        )
      );
    }
  }, [selectedConversation?.id]); // Dependency: selectedConversation ID

  const handleWsTyping = useCallback((data: { senderId: string; isTyping: boolean }) => {
    console.log("Typing indicator:", data);
    setTyping(prev => ({ ...prev, [data.senderId]: data.isTyping }));
  }, []); // No dependencies needed

  const handleWsReadReceipt = useCallback((data: any) => {
    console.log("Read receipt:", data);
    // Implement read receipt handling if needed
  }, []); // No dependencies needed

  const handleWsConnectionChange = useCallback((connected: boolean) => {
    console.log("WebSocket connection status changed:", connected);
    setNetworkStatus(prev => ({ ...prev, wsConnected: connected }));
  }, []); // No dependencies needed

  const handleWsError = useCallback((error: string) => {
    console.error("WebSocket error:", error);
    toast({ 
      variant: "destructive", 
      title: "Connection Error", 
      description: error 
    });
  }, [toast]); // Dependency: toast
  // --- End Stabilized Callbacks ---

  // WebSocket connection
  const { 
    isConnected: wsIsConnected, 
    error: wsError, 
    wsDisabled,
    enableWebSocket,
    disableWebSocket,
    sendMessage: wsSendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect: wsReconnect
  } = useChatWebSocket({
    token: userData.token,
    userType: userData.userType,
    onMessage: handleWsMessage,
    onTyping: handleWsTyping,
    onReadReceipt: handleWsReadReceipt,
    onConnectionChange: handleWsConnectionChange,
    onError: handleWsError
  });

  // Fetch user data
  useEffect(() => {
    // Get user info from local storage
    const storedUserId = localStorage.getItem(userIdKey);
    const storedUserType = localStorage.getItem(userTypeKey);
    const storedToken = localStorage.getItem(tokenKey);

    if (storedUserId && storedUserType && storedToken) {
      setUserData({
        userId: storedUserId,
        userType: storedUserType,
        token: storedToken
      });
      console.log("User data found:", { userId: storedUserId, userType: storedUserType, hasToken: !!storedToken });
    } else {
      console.error("Missing user data:", { 
        hasUserId: !!storedUserId, 
        hasUserType: !!storedUserType, 
        hasToken: !!storedToken 
      });
      setFetchError("Authentication required. Please log in again.");
      setIsLoading(false);
    }
  }, []);

  // Test API connection
  useEffect(() => {
    if (userData.userId) {
      checkConnections();
    }
  }, [userData.userId]);

  // Check connections
  const checkConnections = async () => {
    console.log("Checking API connection...");
    // Check API
    try {
      const response = await fetch(`${apiUrl}/api/health`);
      if (response.ok) {
        setNetworkStatus(prev => ({ ...prev, apiConnected: true, lastChecked: new Date() }));
        console.log("API connection successful");
        
        // Now fetch conversations
        fetchConversations();
      } else {
        console.error("API health check failed with status:", response.status);
        setNetworkStatus(prev => ({ ...prev, apiConnected: false, lastChecked: new Date() }));
        setFetchError("Backend API is not responding properly. Please try again later.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("API connection error:", error);
      setNetworkStatus(prev => ({ ...prev, apiConnected: false, lastChecked: new Date() }));
      setFetchError("Cannot connect to the backend server. Please check your network connection.");
      setIsLoading(false);
    }
  };

  // Fetch conversations
  const fetchConversations = async () => {
    if (!userData.userId) return;
    
    console.log("Fetching conversations for user:", userData.userId);
    setIsLoading(true);
    setFetchError(null);
    
    try {
      // Try the debug endpoint first to see what conversations exist
      const modelResponse = await fetch(`${apiUrl}/api/debug/models`);
      const modelData = await modelResponse.json();
      console.log("Database model info:", modelData);
      
      const response = await fetch(
        `${apiUrl}/api/chat/conversations/${userData.userId}?page=1&limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userData.token}` // Add token for auth
          },
        }
      );
      
      console.log("Conversations response status:", response.status);
      
      if (!response.ok) {
        // Try to get response text for more details
        let errorText = "";
        try {
          const errorData = await response.json();
          errorText = JSON.stringify(errorData);
        } catch (e) {
          errorText = await response.text();
        }
        
        console.error("Error response:", errorText);
        throw new Error(`Status ${response.status}: ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
      }
      
      const data = await response.json();
      console.log("Conversations data:", data);
      
      if (data.success) {
        if (data.conversations && data.conversations.length > 0) {
          setConversations(data.conversations);
          setSelectedConversation(data.conversations[0]);
        } else {
          console.log("No conversations found");
        }
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setFetchError(`Error fetching conversations: ${errorMessage}`);
      
      // If we failed to get conversations but we know we created one,
      // suggest refreshing or creating a new one
      if (networkStatus.apiConnected) {
        setFetchError(`Error fetching conversations: ${errorMessage}. Try creating a new conversation or refreshing the page.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle sending messages
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userData.userId || sendingMessage) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      type: 'chat',
      messageId: tempId,
      conversationId: selectedConversation.id,
      senderId: userData.userId,
      senderName: 'You',
      senderType: userData.userType,
      content: messageContent,
      timestamp: new Date().toISOString(),
      pending: true
    };
    
    // Add message to UI immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Clear draft for this conversation
    setMessageDrafts(prev => {
      const drafts = {...prev};
      delete drafts[selectedConversation.id];
      return drafts;
    });
    
    // Get recipient IDs
    const recipients = selectedConversation.participants
      .filter((p: any) => p.userId !== userData.userId)
      .map((p: any) => p.userId);

    let success = false;
    
    // First try WebSocket
    if (wsIsConnected) {
      success = wsSendMessage(
        selectedConversation.id,
        messageContent,
        recipients
      );
    }
    
    // If WebSocket fails or is not connected, try HTTP fallback
    if (!success) {
      try {
        console.log("Using HTTP fallback for sending message");
        
        // Use chatService directly
        const response = await chatService.sendMessage(
          selectedConversation.id,
          userData.userId,
          messageContent
        );
        
        if (response.success) {
          console.log("Message sent via HTTP successfully:", response);
          success = true;
          // Update the message ID from temporary to the real one
          setMessages(prev => prev.map(msg => 
            msg.messageId === tempId 
              ? { ...msg, messageId: response.message._id, pending: false } 
              : msg
          ));
        } else {
          console.log("Message sending failed:", response);
        }
      } catch (error) {
        console.error("HTTP message sending failed:", error);
      }
    }
    
    if (!success) {
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.messageId === tempId 
          ? { ...msg, error: true, pending: false } 
          : msg
      ));
      
      // Save the failed message as draft
      setMessageDrafts(prev => ({
        ...prev,
        [selectedConversation.id]: messageContent
      }));
      
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Your message was saved as a draft. The server might be experiencing issues with the chat endpoint. Please try again later.",
      });
    }
    
    setSendingMessage(false);
  };

  // Retry sending failed message
  const retryFailedMessage = (failedMessage: any) => {
    if (!wsIsConnected || !selectedConversation) return;
    
    // Remove the failed message
    setMessages(prev => prev.filter(msg => msg.messageId !== failedMessage.messageId));
    
    // Set the content back to input
    setNewMessage(failedMessage.content);
  };

  // Send typing indicators
  useEffect(() => {
    if (selectedConversation && newMessage && userData.userId) {
      const recipients = selectedConversation.participants
        .filter((p: any) => p.userId !== userData.userId)
        .map((p: any) => p.userId);
      
      sendTypingIndicator(selectedConversation.id, true, recipients);
      
      // Clear typing indicator after 3 seconds of no typing
      const timeout = setTimeout(() => {
        sendTypingIndicator(selectedConversation.id, false, recipients);
      }, 3000);
      
      return () => clearTimeout(timeout);
    }
  }, [newMessage, selectedConversation, userData.userId, sendTypingIndicator]);

  // Load conversation messages when selecting a conversation
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      
      // Restore draft message if exists
      if (messageDrafts[selectedConversation.id]) {
        setNewMessage(messageDrafts[selectedConversation.id]);
      } else {
        setNewMessage("");
      }
    }
  }, [selectedConversation, messageDrafts]);

  // Save draft when changing conversations or typing
  useEffect(() => {
    if (selectedConversation && newMessage.trim()) {
      setMessageDrafts(prev => ({
        ...prev,
        [selectedConversation.id]: newMessage
      }));
    }
  }, [newMessage, selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    if (!userData.userId || !userData.token) return;
    
    try {
      console.log(`Fetching messages for conversation ${conversationId}...`);
      
      // Use chatService directly
      const response = await chatService.getMessages(conversationId, userData.userId, 1, 50);
      
      console.log("Messages data:", response);
      
      if (response.success && response.data) {
        // Format messages to match our expected structure
        const formattedMessages = response.data.map(msg => ({
          type: 'chat',
          messageId: msg._id,
          conversationId: msg.conversationId,
          senderId: msg.sender.id,
          senderName: msg.sender.name || 'Unknown',
          senderType: msg.sender.model === 'User' ? 'patient' : 
                   msg.sender.model === 'Doctor' ? 'doctor' : 'admin',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || ''),
          timestamp: msg.createdAt
        }));
        
        setMessages(formattedMessages);
      } else {
        console.log("No messages found or unexpected response format:", response);
        // Set empty messages array to avoid showing stale messages
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load messages. Please try again.",
      });
      // Set empty messages array to avoid showing stale messages
      setMessages([]);
    }
  };

  // If loading takes too long, show a retry button
  useEffect(() => {
    if (isLoading) {
      timeoutRef.current = setTimeout(() => {
        if (isLoading) {
          setFetchError("Loading is taking longer than expected. The server might be busy.");
        }
      }, 8000);
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading]);

  // Check mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Function to create a test conversation with a doctor
  const createTestConversation = async () => {
    setIsLoading(true);
    setFetchError(null);
    
    try {
      // Use the debug endpoint to get a list of doctors
      const response = await fetch(`${apiUrl}/api/debug/models`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error("Failed to get model information");
      }
      
      // Check if we have doctors in the system
      console.log("Database model info:", data);
      
      if (data.counts && data.counts.doctors > 0) {
        // Now use the other debug endpoint to create a test conversation
        // Using one of the actual doctor IDs from your database
        const createResponse = await fetch(`${apiUrl}/api/debug/create-test-conversation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userData.userId,
            targetId: "67fa13c49ccfee17423cddce", // Use the doctor ID from your screenshot
            targetType: "doctor"
          })
        });
        
        const createData = await createResponse.json();
        console.log("Test conversation creation response:", createData);
        
        if (createData.success) {
          toast({
            title: "Test conversation created",
            description: "Refreshing conversation list...",
          });
          fetchConversations();
        } else {
          setFetchError(`Failed to create test conversation: ${createData.error}`);
        }
      } else {
        setFetchError("No doctors found in the system. Please create a doctor account first.");
      }
    } catch (error) {
      console.error("Error creating test conversation:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setFetchError(`Error creating test conversation: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Chat UI rendering
  const renderChat = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <Spinner size="lg" />
          <p className="mt-4 text-gray-500">Loading conversations...</p>
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-4">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{fetchError}</AlertDescription>
          </Alert>
          <Button onClick={checkConnections}>Retry Connection</Button>
        </div>
      );
    }

    if (isMobile && !selectedConversation) {
      return (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b">
            <h2 className="font-semibold text-lg">Conversations</h2>
          </div>
          {renderConversationList()}
        </div>
      );
    }

    if (!isMobile && !selectedConversation) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          <div className="border-r">
            <div className="p-3 border-b">
              <h2 className="font-semibold text-lg">Conversations</h2>
            </div>
            {renderConversationList()}
          </div>
          <div className="col-span-2 flex items-center justify-center p-4 text-center text-gray-500">
            <div>
              <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
              <p>Choose a conversation from the list to start chatting</p>
            </div>
          </div>
        </div>
      );
    }

    if (isMobile && selectedConversation) {
      return (
        <div className="flex flex-col h-full">
          <div className="p-3 border-b flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              className="mr-2" 
              onClick={() => setSelectedConversation(null)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={selectedConversation.avatarUrl} />
              <AvatarFallback>{selectedConversation.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{selectedConversation.name}</h2>
              {typing[selectedConversation.participants[0]?.userId] && (
                <p className="text-xs text-muted-foreground">Typing...</p>
              )}
            </div>
          </div>
          {renderConversationDetails()}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 h-full">
        <div className="border-r hidden md:block">
          <div className="p-3 border-b">
            <h2 className="font-semibold text-lg">Conversations</h2>
          </div>
          {renderConversationList()}
        </div>
        <div className="col-span-2 flex flex-col h-full">
          <div className="p-3 border-b flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarImage src={selectedConversation.avatarUrl} />
              <AvatarFallback>{selectedConversation.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold">{selectedConversation.name}</h2>
              {typing[selectedConversation.participants[0]?.userId] && (
                <p className="text-xs text-muted-foreground">Typing...</p>
              )}
            </div>
          </div>
          {renderConversationDetails()}
        </div>
      </div>
    );
  };

  const renderConversationList = () => {
    if (conversations.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          <p>No conversations yet</p>
          <Button 
            className="mt-2" 
            onClick={createTestConversation}
            disabled={!networkStatus.apiConnected}
          >
            Start test conversation
          </Button>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[calc(100vh-200px)]">
        <div className="p-3 space-y-2">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`p-2 rounded-lg cursor-pointer hover:bg-gray-100 ${
                selectedConversation?.id === conversation.id ? "bg-gray-100" : ""
              }`}
              onClick={() => setSelectedConversation(conversation)}
            >
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-2">
                  <AvatarImage src={conversation.avatarUrl} />
                  <AvatarFallback>{conversation.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-sm truncate">{conversation.name}</h3>
                    <span className="text-xs text-gray-500">
                      {conversation.updatedAt && new Date(conversation.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {messageDrafts[conversation.id] ? 
                      <span className="text-amber-500">Draft: {messageDrafts[conversation.id]}</span> :
                      (conversation.lastMessage && typeof conversation.lastMessage === 'object') ? conversation.lastMessage.content : 
                      conversation.lastMessage || "No messages yet"
                    }
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const renderConversationDetails = () => {
    return (
      <>
        <ScrollArea className="flex-1 p-3">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 my-8">
                <p>No messages yet</p>
                <p className="text-sm">Send a message to start the conversation</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => fetchMessages(selectedConversation.id)}
                >
                  <RefreshCw className="h-3 w-3 mr-2" /> Retry Loading Messages
                </Button>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.messageId}
                  className={`flex ${
                    message.senderId === userData.userId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.senderId === userData.userId
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary"
                    } ${message.pending ? "opacity-70" : ""} ${message.error ? "border-red-500 border" : ""}`}
                  >
                    {message.senderId !== userData.userId && (
                      <p className="text-xs font-medium mb-1">{message.senderName}</p>
                    )}
                    <p>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</p>
                    <div className="flex justify-end items-center mt-1 text-xs opacity-70">
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      {message.error && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-4 w-4 ml-1 text-red-500"
                          onClick={() => retryFailedMessage(message)}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            {Object.values(typing).some(Boolean) && (
              <div className="flex justify-start">
                <div className="max-w-[80%] p-3 rounded-lg bg-secondary">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "600ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <Paperclip className="h-5 w-5" />
            </Button>
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={!wsIsConnected ? "Reconnecting to chat server..." : messageDrafts[selectedConversation?.id] ? "You have a draft message..." : "Type a message..."}
              className="flex-1"
              disabled={!wsIsConnected || sendingMessage}
            />
            <Button 
              size="icon" 
              className="shrink-0"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || !wsIsConnected || sendingMessage}
            >
              {sendingMessage ? <Spinner size="sm" /> : <Send className="h-5 w-5" />}
            </Button>
          </div>
          {wsError && (
            <div className="mt-2 border border-amber-200 bg-amber-50 p-2 rounded-md">
              <p className="text-xs text-amber-800 font-medium">
                {wsDisabled ? 
                  "WebSocket disabled. Using HTTP fallback mode for messages." :
                  "Using HTTP fallback mode for messages."
                }
                {!wsDisabled && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-amber-800 underline ml-1" 
                    onClick={wsReconnect}
                  >
                    Try reconnecting
                  </Button>
                )}
                {wsDisabled && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-amber-800 underline ml-1" 
                    onClick={enableWebSocket}
                  >
                    Enable WebSocket
                  </Button>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Messages will still work but may not update in real-time.
              </p>
            </div>
          )}
          {(!networkStatus.wsConnected && !wsError && !wsDisabled) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full mt-2" 
              onClick={wsReconnect}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Reconnect to chat server
            </Button>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="h-[calc(100vh-100px)] bg-card rounded-lg border shadow-sm overflow-hidden">
      {renderChat()}
      {networkStatus && (
        <div className="text-xs p-1 bg-muted text-muted-foreground flex justify-between items-center">
          <div>
            <span className={networkStatus.apiConnected ? "text-green-500" : "text-red-500"}>●</span> API: {networkStatus.apiConnected ? "Connected" : "Disconnected"}
            <span className="mx-2">|</span>
            <span className={wsIsConnected ? "text-green-500" : "text-red-500"}>●</span> Chat: {
              wsDisabled ? 
                <span className="text-amber-500">Disabled</span> : 
                (wsIsConnected ? "Connected" : wsError ? "Error" : "Disconnected")
            }
            {!wsIsConnected && !wsDisabled && (
              <span className="text-amber-500 ml-1">
                (Using HTTP fallback - messages will still work but won't update in real-time)
              </span>
            )}
            {wsDisabled && (
              <span className="text-amber-500 ml-1">
                (WebSocket disabled - using HTTP fallback)
                <Button 
                  variant="link" 
                  className="h-auto p-0 ml-2 text-xs text-blue-500 underline" 
                  onClick={enableWebSocket}
                >
                  Enable real-time updates
                </Button>
              </span>
            )}
          </div>
          <div className="flex items-center">
            {networkStatus.lastChecked && `Last checked: ${networkStatus.lastChecked.toLocaleTimeString()}`}
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-2 h-5 w-5" 
              onClick={checkConnections}
              title="Check connections"
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
            {wsError && !wsDisabled && (
              <Button
                variant="ghost"
                size="sm"
                className="ml-2 h-5 text-xs text-amber-700"
                onClick={disableWebSocket}
                title="Disable WebSocket"
              >
                Disable WebSocket
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 