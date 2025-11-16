"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Paperclip, Send, ChevronLeft, Search, AlertCircle, RefreshCw, UserPlus, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { userIdKey, userTypeKey, tokenKey, apiUrl } from "@/lib/config";
import useChatWebSocket, { Message as WebSocketMessage } from "@/hooks/useChatWebSocket";
import * as chatService from "@/services/chatService";
import { formatDistanceToNow } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

// Types 
interface Participant {
  id: string;
  name: string;
  role: string;
  profileImage: string | null;
  specialty?: string | null;
}

interface Conversation {
  id: string;
  _id?: string;
  participants: Participant[];
  lastMessage: {
    content: string;
    timestamp: string;
    senderId: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
  createdAt: string;
  title: string;
}

interface ChatMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    role: string;
  };
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  error?: boolean;
}

interface UserInfo {
  id: string;
  name: string;
  role: string;
  profileImage?: string | null;
  email?: string;
  specialty?: string;
}

export function SecureChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showConversations, setShowConversations] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [userType, setUserType] = useState<"patient" | "doctor" | "admin">("patient");
  const [token, setToken] = useState<string>("");
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [networkStatus, setNetworkStatus] = useState({
    apiConnected: false,
    wsConnected: false,
    lastChecked: null as Date | null
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [showUsersList, setShowUsersList] = useState(false);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [messageDrafts, setMessageDrafts] = useState<{[conversationId: string]: string}>({});
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const messagePageRef = useRef<number>(1);
  const hasMoreMessagesRef = useRef<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket Message Handler callbacks with useCallback
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'chat' && message.conversationId && message.senderId) {
      // Check if this is for the currently selected conversation
      if (selectedConversation && selectedConversation.id === message.conversationId) {
        // Add the message to the current conversation
        const newMessage: ChatMessage = {
          id: message.messageId || crypto.randomUUID(),
          sender: {
            id: message.senderId,
            name: message.senderName || 'Unknown',
            role: message.senderType || 'unknown'
          },
          content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content || ''),
          timestamp: message.timestamp,
          status: 'delivered'
        };
        
        setMessages(prev => [...prev, newMessage]);
        
        // Mark as read
        if (message.senderId !== userId) {
          sendReadReceipt(message.conversationId, message.messageId || '', message.senderId);
        }
      }
      
      // Update the conversations list
      updateConversationWithNewMessage(
        message.conversationId,
        message.senderId,
        typeof message.content === 'string' ? message.content : JSON.stringify(message.content || ''),
        message.timestamp
      );
    }
  }, [selectedConversation, userId]);

  // Typing Indicator Handler
  const handleTypingIndicator = useCallback((data: { conversationId: string; senderId: string; isTyping: boolean }) => {
    if (data.senderId !== userId) {
      setTypingUsers(prev => ({
        ...prev,
        [data.senderId]: data.isTyping
      }));
      
      // Clear any existing timeout for this user
      if (typingTimeoutRef.current[data.senderId]) {
        clearTimeout(typingTimeoutRef.current[data.senderId]);
      }
      
      // Set a timeout to clear the typing indicator after 3 seconds
      if (data.isTyping) {
        typingTimeoutRef.current[data.senderId] = setTimeout(() => {
          setTypingUsers(prev => ({
            ...prev,
            [data.senderId]: false
          }));
        }, 3000);
      }
    }
  }, [userId]);

  // Read Receipt Handler
  const handleReadReceipt = useCallback((data: { conversationId: string; messageId: string; readBy: string }) => {
    if (data.conversationId === selectedConversation?.id) {
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === data.messageId ? { ...msg, status: 'read' } : msg
        )
      );
    }
  }, [selectedConversation]);

  // Connection Change Handler
  const handleConnectionChange = useCallback((isConnected: boolean) => {
    console.log("WebSocket connection status changed:", isConnected);
    setNetworkStatus(prev => ({ ...prev, wsConnected: isConnected }));
    
    if (!isConnected) {
      toast({
        title: "Connection Lost",
        description: "Trying to reconnect to chat server...",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Connected",
        description: "Chat connection established",
        variant: "default"
      });
    }
  }, [toast]);

  // WebSocket Error Handler
  const handleWebSocketError = useCallback((error: string) => {
    console.error("WebSocket error:", error);
    toast({ 
      variant: "destructive", 
      title: "Connection Error", 
      description: error 
    });
  }, [toast]);

  // Set up WebSocket connection
  const {
    isConnected,
    error: wsError,
    wsDisabled,
    enableWebSocket,
    disableWebSocket,
    sendMessage: wsSendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect: wsReconnect
  } = useChatWebSocket({
    token,
    userType,
    onMessage: handleWebSocketMessage,
    onTyping: handleTypingIndicator,
    onReadReceipt: handleReadReceipt,
    onConnectionChange: handleConnectionChange,
    onError: handleWebSocketError
  });

  // Initialize user data
  useEffect(() => {
    // Get user info from local storage
    const storedUserId = localStorage.getItem(userIdKey);
    const storedUserType = localStorage.getItem(userTypeKey) as "patient" | "doctor" | "admin";
    const storedToken = localStorage.getItem(tokenKey);

    if (storedUserId && storedUserType && storedToken) {
      setUserId(storedUserId);
      setUserType(storedUserType);
      setToken(storedToken);
      console.log("User data found:", { userId: storedUserId, userType: storedUserType, hasToken: !!storedToken });
    } else {
      console.error("Missing user data:", { 
        hasUserId: !!storedUserId, 
        hasUserType: !!storedUserType, 
        hasToken: !!storedToken 
      });
      setFetchError("Authentication required. Please log in again.");
      setIsLoading(false);
      toast({
        title: "Authentication Error",
        description: "You need to log in to use the chat",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Test API connection
  useEffect(() => {
    if (userId) {
      checkConnections();
    }
  }, [userId]);

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

  // Fix the fetchUsers function to match the actual database structure and work with available debug data
  const fetchUsers = useCallback(async () => {
    setUsersLoading(true);
    let doctorUsers: UserInfo[] = [];
    let patientUsers: UserInfo[] = [];
    let adminUsers: UserInfo[] = [];
    
    try {
      console.log("Fetching users directly from database tables...");
      
      // Step 1: Try to fetch doctors
      try {
        const doctorsResponse = await fetch(`${apiUrl}/api/debug/doctors`);
        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          
          if (doctorsData.success && doctorsData.doctors && Array.isArray(doctorsData.doctors)) {
            doctorUsers = doctorsData.doctors.map((doctor: any) => ({
              id: doctor._id || doctor.id,
              name: doctor.fullName || doctor.name || 'Unknown Doctor',
              role: 'doctor',
              email: doctor.email || '',
              profileImage: doctor.profileImage || null,
              specialty: doctor.specialization || doctor.specialty || null
            }));
            console.log(`Found ${doctorUsers.length} doctors`);
          }
        } else {
          console.warn("Failed to fetch doctors:", await doctorsResponse.text());
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      }
      
      // Step 2: Fetch patients using the new endpoint
      try {
        const patientsResponse = await fetch(`${apiUrl}/api/debug/patients`);
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          
          if (patientsData.success && patientsData.patients && Array.isArray(patientsData.patients)) {
            patientUsers = patientsData.patients.map((patient: any) => ({
              id: patient._id || patient.id,
              name: patient.username || patient.name || 'Unknown Patient',
              role: 'patient',
              email: patient.email || '',
              profileImage: patient.profileImage || null
            }));
            console.log(`Found ${patientUsers.length} patients`);
          }
        } else {
          console.warn("Failed to fetch patients:", await patientsResponse.text());
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
      
      // Step 3: Fetch admins using the new endpoint
      try {
        const adminsResponse = await fetch(`${apiUrl}/api/debug/admins`);
        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json();
          
          if (adminsData.success && adminsData.admins && Array.isArray(adminsData.admins)) {
            adminUsers = adminsData.admins.map((admin: any) => ({
              id: admin._id || admin.id,
              name: admin.fullName || admin.name || 'Unknown Admin',
              role: 'admin',
              email: admin.email || '',
              profileImage: admin.profileImage || null
            }));
            console.log(`Found ${adminUsers.length} admins`);
          }
        } else {
          console.warn("Failed to fetch admins:", await adminsResponse.text());
        }
      } catch (error) {
        console.error("Error fetching admins:", error);
      }
      
      // Combine all found users
      const combinedUsers = [...doctorUsers, ...patientUsers, ...adminUsers];
      
      // Filter out current user
      const filteredUsers = combinedUsers.filter(user => user.id !== userId);
      
      // Log user breakdown
      console.log("User breakdown:", {
        doctors: doctorUsers.length,
        patients: patientUsers.length, 
        admins: adminUsers.length,
        total: combinedUsers.length,
        filteredTotal: filteredUsers.length
      });
      
      setUsers(filteredUsers);
      
      if (filteredUsers.length === 0) {
        toast({
          title: "No users found",
          description: "Could not find any users to chat with.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUsersLoading(false);
    }
  }, [userId, apiUrl, toast]);

  // Fetch conversations when user ID is available
  useEffect(() => {
    if (userId) {
      fetchConversations();
    }
  }, [userId]);

  // Fetch messages when a conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      const conversationId = getConversationId(selectedConversation);
      if (conversationId) {
        console.log(`Fetching messages for conversation ID: ${conversationId}`);
        fetchMessages(conversationId);
        
        // Mark messages as read
        if (selectedConversation.unreadCount > 0) {
          markMessagesAsRead(conversationId);
        }
        
        // Restore draft message if exists
        if (messageDrafts[conversationId]) {
          setNewMessage(messageDrafts[conversationId]);
        } else {
          setNewMessage("");
        }
      } else {
        console.warn("Selected conversation has no valid ID", selectedConversation);
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

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Helper function to get conversation ID regardless of format
  const getConversationId = (conversation: any): string | undefined => {
    if (!conversation) return undefined;
    return conversation.id || conversation._id;
  };

  // Fetch conversations
  const fetchConversations = async () => {
    if (!userId) return;
    
    console.log("Fetching conversations for user:", userId);
    setIsLoading(true);
    setFetchError(null);
    
    try {
      const response = await fetch(
        `${apiUrl}/api/chat/conversations/${userId}?page=1&limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Add token for auth
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
      console.log("Raw conversations data:", data);
      
      if (data.success) {
        if (data.conversations && data.conversations.length > 0) {
          // Format conversations to ensure participants are properly structured
          const formattedConversations = data.conversations.map((conv: any) => {
            console.log("Processing conversation:", conv);
            
            // Filter out current user from participants - fix admin identification issue
            const otherParticipants = Array.isArray(conv.participants) 
              ? conv.participants.filter((p: any) => {
                  // Standardize participant ID format to handle various field formats
                  const participantId = p.id || p.userId || p.user;
                  console.log(`Comparing participant ID ${participantId} with current user ID ${userId}`);
                  return participantId !== userId;
                })
              : [];
            
            console.log("Other participants after filtering:", otherParticipants);
            
            // Ensure each participant has the required fields with proper handling for admins
            const formattedParticipants = otherParticipants.map((p: any) => {
              // Extract participant ID from various possible fields
              const id = p.id || p.userId || p.user;
              
              // Extract name from various possible fields with proper fallbacks
              const name = p.name || p.fullName || p.username || 'Unknown User';
              
              // Ensure role is properly identified, especially for admins
              const role = p.role || (p.model === 'Admin' ? 'admin' : p.model === 'Doctor' ? 'doctor' : 'patient');
              
              return {
                id,
                name,
                role,
                profileImage: p.profileImage || null,
                specialty: p.specialty || p.specialization || null
              };
            });

            console.log("Formatted participants:", formattedParticipants);

            return {
              ...conv,
              participants: formattedParticipants
            };
          });

          console.log("Final formatted conversations:", formattedConversations);
          setConversations(formattedConversations);
          setSelectedConversation(formattedConversations[0]);
        } else {
          console.log("No conversations found");
          // Create a test conversation automatically for first-time users if needed
          if (userType === 'patient') {
            await createTestConversation();
          }
        }
      } else {
        throw new Error("API returned success: false");
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setFetchError(`Error fetching conversations: ${errorMessage}`);
      
      toast({
        title: "Error",
        description: `Failed to load conversations: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Create a test conversation with a doctor (for first-time users)
  const createTestConversation = async () => {
    try {
      // First fetch available doctors
      const doctorsResponse = await fetch(`${apiUrl}/api/debug/doctors`);
      const doctorsData = await doctorsResponse.json();
      
      if (!doctorsResponse.ok || !doctorsData.success || doctorsData.doctors.length === 0) {
        console.error("No doctors available for test conversation");
        return;
      }
      
      // Use the first available doctor
      const doctor = doctorsData.doctors[0];
      const doctorId = doctor._id;
      
      const response = await fetch(`${apiUrl}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          participants: [
            {
              userId: doctorId,
              role: 'doctor'
            }
          ],
          title: "Healthcare Consultation"
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        console.log("Test conversation created:", data);
        
        // Create a properly formatted conversation object with the doctor info
        if (data.conversation) {
          const newConversation = {
            ...data.conversation,
            participants: [{
              id: doctorId,
              name: doctor.fullName || 'Healthcare Provider',
              role: 'doctor',
              profileImage: doctor.profileImage || null,
              specialty: doctor.specialization || null
            }]
          };
          
          // Add to conversations list and select it
          setConversations(prev => [newConversation, ...prev]);
          setSelectedConversation(newConversation);
        } else {
          // If conversation data isn't returned properly, just refresh all conversations
          fetchConversations();
        }
        
        toast({
          title: "Welcome!",
          description: "We've connected you with a healthcare provider.",
        });
      }
    } catch (error) {
      console.error("Error creating test conversation:", error);
      toast({
        title: "Error",
        description: "Could not create test conversation. Please try again later.",
        variant: "destructive",
      });
    }
  };

  // Create a new conversation with a user
  const createConversation = async (targetUser: UserInfo) => {
    if (!userId) return;
    
    console.log("Creating conversation with targetUser:", targetUser);
    
    try {
      const response = await fetch(`${apiUrl}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          participants: [
            {
              userId: targetUser.id,
              role: targetUser.role
            }
          ],
          title: `Chat with ${targetUser.name}`
        })
      });
      
      const data = await response.json();
      console.log("Create conversation API response:", data);
      
      if (response.ok && data.success) {
        // Create a properly formatted conversation object with the target user info
        if (data.conversation) {
          console.log("Raw conversation data:", data.conversation);
          
          const newConversation = {
            ...data.conversation,
            id: data.conversation._id || data.conversation.id, // Ensure id is set properly
            participants: [{
              id: targetUser.id,
              name: targetUser.name,
              role: targetUser.role,
              profileImage: targetUser.profileImage || null,
              specialty: targetUser.specialty || null
            }]
          };
          
          console.log("Formatted new conversation with participant:", newConversation);
          
          // Add to conversations list and select it
          setConversations(prev => [newConversation, ...prev]);
          setSelectedConversation(newConversation);
          
          // Explicitly fetch messages with the correct conversation ID
          setTimeout(() => {
            // Using setTimeout to ensure state updates have completed
            const conversationId = getConversationId(newConversation);
            if (conversationId) {
              console.log("Attempting to fetch messages for new conversation:", conversationId);
              fetchMessages(conversationId, 1);
            }
          }, 500);
          
          // Hide users list and go back to conversations
          setShowUsersList(false);
        } else {
          // If conversation data isn't returned properly, just refresh all conversations
          fetchConversations();
        }
        
        toast({
          title: "Conversation Created",
          description: `You can now chat with ${targetUser.name}`,
        });
      } else {
        throw new Error(data.message || "Failed to create conversation");
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast({
        title: "Error",
        description: `Could not create conversation: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string, page = 1) => {
    if (!userId || !conversationId) {
      console.log(`Missing required data: userId=${userId}, conversationId=${conversationId}`);
      return;
    }
    
    messagePageRef.current = page;
    console.log(`Fetching messages for conversation ${conversationId}...`);
    
    setIsLoading(true);
    try {
      const response = await chatService.getMessages(conversationId, userId, page);
      
      console.log("Messages data:", response);
      
      if (response.success) {
        const formattedMessages = response.data.map(msg => ({
          id: msg._id,
          sender: {
            id: msg.sender.id,
            name: msg.sender.name,
            role: msg.sender.model === 'User' ? 'patient' : 
                 msg.sender.model === 'Doctor' ? 'doctor' : 'admin'
          },
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content || ''),
          timestamp: msg.createdAt,
          status: msg.readBy.some(r => r.user !== userId) ? 'read' : 'delivered'
        }));
        
        if (page === 1) {
          setMessages(formattedMessages as ChatMessage[]);
        } else {
          setMessages(prev => [...formattedMessages, ...prev] as ChatMessage[]);
        }
        
        // Update if there are more messages to load
        hasMoreMessagesRef.current = response.pagination.page < response.pagination.pages;
      } else {
        console.log("No messages found or unexpected response format:", response);
        // Set empty messages array to avoid showing stale messages
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
      // Set empty messages array to avoid showing stale messages
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load more messages (pagination)
  const handleLoadMoreMessages = () => {
    if (hasMoreMessagesRef.current && selectedConversation) {
      fetchMessages(selectedConversation.id, messagePageRef.current + 1);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = async (conversationId: string) => {
    if (!userId) return;
    
    try {
      await chatService.markAsRead(conversationId, userId);
      
      // Update the unread count in the conversations list
      setConversations(prevConversations => 
        prevConversations.map(conv => 
          conv.id === conversationId ? { ...conv, unreadCount: 0 } : conv
        )
      );
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  // Update conversation list with a new message
  const updateConversationWithNewMessage = (
    conversationId: string,
    senderId: string,
    content: string,
    timestamp: string
  ) => {
    setConversations(prevConversations => {
      // Find the conversation
      const conversationIndex = prevConversations.findIndex(c => c.id === conversationId);
      
      if (conversationIndex === -1) {
        // If the conversation doesn't exist in our list, fetch all conversations
        fetchConversations();
        return prevConversations;
      }
      
      // Create a copy of the conversations array
      const updatedConversations = [...prevConversations];
      const conversation = { ...updatedConversations[conversationIndex] };
      
      // Update the last message
      conversation.lastMessage = {
        content,
        timestamp,
        senderId
      };
      
      // Increment unread count if the message is not from the current user
      // and this is not the currently selected conversation
      if (senderId !== userId && 
          (!selectedConversation || selectedConversation.id !== conversationId)) {
        conversation.unreadCount += 1;
      }
      
      // Update the conversation in the array
      updatedConversations[conversationIndex] = conversation;
      
      // Move this conversation to the top
      updatedConversations.splice(conversationIndex, 1);
      updatedConversations.unshift(conversation);
      
      return updatedConversations;
    });
  };

  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !userId || sendingMessage) return;
    
    const messageContent = newMessage.trim();
    setNewMessage("");
    setSendingMessage(true);
    
    // Optimistically add the message to the UI
    const tempMessageId = crypto.randomUUID();
    const tempMessage: ChatMessage = {
      id: tempMessageId,
      sender: {
        id: userId,
        name: "You", // This will be replaced with the actual user name
        role: userType
      },
      content: messageContent,
      timestamp: new Date().toISOString(),
      status: 'sent'
    };
    
    setMessages(prev => [...prev, tempMessage]);
    
    // Clear draft for this conversation
    setMessageDrafts(prev => {
      const drafts = {...prev};
      delete drafts[selectedConversation.id];
      return drafts;
    });
    
    let success = false;
    
    try {
      // Get recipient IDs
      const recipientIds = selectedConversation.participants
        .filter(p => p.id !== userId)
        .map(p => p.id);
      
      // First try WebSocket if connected
      if (isConnected && !wsDisabled) {
        success = wsSendMessage(selectedConversation.id, messageContent, recipientIds);
      }
      
      // Always send via REST API to persist (even if WebSocket succeeded)
      const response = await chatService.sendMessage(
        selectedConversation.id, 
        userId,
        messageContent
      );
      
      if (response.success) {
        // Update the message status and ID
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempMessageId ? { ...msg, id: response.message._id, status: 'delivered' } : msg
          )
        );
        
        // Update the conversation list
        updateConversationWithNewMessage(
          selectedConversation.id,
          userId,
          messageContent,
          new Date().toISOString()
        );
        
        success = true;
      }
    } catch (error) {
      console.error("Error sending message:", error);
      success = false;
    } finally {
      setSendingMessage(false);
    }
    
    if (!success) {
      // Mark message as failed
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessageId 
          ? { ...msg, error: true, status: 'sent' } 
          : msg
      ));
      
      // Save the failed message as draft
      setMessageDrafts(prev => ({
        ...prev,
        [selectedConversation.id]: messageContent
      }));
      
      toast({
        title: "Failed to send message",
        description: "Your message was saved as a draft. Please try again later.",
        variant: "destructive"
      });
    }
  };

  // Retry sending failed message
  const retryFailedMessage = (failedMessage: any) => {
    if (!selectedConversation) return;
    
    // Remove the failed message
    setMessages(prev => prev.filter(msg => msg.id !== failedMessage.id));
    
    // Set the content back to input
    setNewMessage(failedMessage.content);
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!selectedConversation || !isConnected || wsDisabled) return;
    
    const recipientIds = selectedConversation.participants
      .filter(p => p.id !== userId)
      .map(p => p.id);
    
    sendTypingIndicator(selectedConversation.id, true, recipientIds);
    
    // Clear typing after 3 seconds
    setTimeout(() => {
      if (selectedConversation) {
        sendTypingIndicator(selectedConversation.id, false, recipientIds);
      }
    }, 3000);
  };

  // Time formatting helper
  const formatTime = (timestamp: string): string => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return "Unknown time";
    }
  };

  // Filter conversations and users based on search query
  const filteredConversations = searchQuery
    ? conversations.filter(conv => {
        // Check if any participant's name contains the search query
        return conv.participants.some(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
    : conversations;
    
  const filteredUsers = searchQuery
    ? users.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  // User tab content with better debug info
  const renderUsersList = () => {
  return (
      <div>
        <div className="p-3 border-b flex items-center justify-between bg-muted/50">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
            <Button
              variant="ghost"
              size="icon"
            className="ml-2" 
            onClick={fetchUsers} 
            title="Refresh users"
            >
            <RefreshCw className="h-5 w-5" />
            </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-300px)] md:h-[500px]">
          {usersLoading ? (
            <div className="flex justify-center p-4">
              <Spinner />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchQuery ? "No users match your search" : "No users found"}
              <div className="mt-2 text-xs text-muted-foreground">
                Total users loaded: {users.length}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchUsers} 
                className="mt-2"
              >
                <RefreshCw className="mr-2 h-3 w-3" /> Refresh Users
            </Button>
            </div>
          ) : (
            <div>
              {/* Debug info */}
              <div className="p-2 bg-amber-50 text-xs text-amber-800">
                <p>User counts: Doctors: {filteredUsers.filter(u => u.role === 'doctor').length}, 
                   Patients: {filteredUsers.filter(u => u.role === 'patient').length}, 
                   Admins: {filteredUsers.filter(u => u.role === 'admin').length}</p>
                <p>Total users: {filteredUsers.length}</p>
              </div>
              
              {/* Group users by role */}
              {['doctor', 'patient', 'admin'].map(role => {
                const roleUsers = filteredUsers.filter(u => u.role === role);
                if (roleUsers.length === 0) return null;
                
                return (
                  <div key={role} className="mb-2">
                    <div className="px-3 py-1 bg-muted/60">
                      <p className="font-medium capitalize">{role}s ({roleUsers.length})</p>
                    </div>
                    {roleUsers.map(user => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer border-b transition-colors
                          ${selectedUserId === user.id ? "bg-accent" : ""}`}
                        onClick={() => {
                          setSelectedUserId(user.id);
                          createConversation(user);
                        }}
                      >
                        <Avatar className="h-9 w-9">
                          {user.profileImage ? (
                            <AvatarImage src={user.profileImage} />
                          ) : null}
                          <AvatarFallback>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.id}</p>
                          {user.email && (
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          )}
                          {user.specialty && (
                            <Badge variant="outline" className="mt-1">
                              {user.specialty}
                            </Badge>
          )}
        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </div>
    );
  };

  // Modified renderConversationList function to use Tabs with new renderUsersList 
  const renderConversationList = () => {
    return (
      <>
        <div className="p-3 border-b flex items-center justify-between bg-muted/50">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2"
            onClick={() => setShowUsersList(true)}
            title="New conversation"
          >
            <UserPlus className="h-5 w-5" />
          </Button>
        </div>
        
        <Tabs defaultValue="conversations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="conversations">Conversations</TabsTrigger>
            <TabsTrigger value="users" onClick={fetchUsers}>Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="conversations" className="mt-0">
            <ScrollArea className="h-[calc(100vh-300px)] md:h-[500px]">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  {searchQuery ? "No conversations match your search" : "No conversations yet"}
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  // Get the other participant (assuming 1-1 chats for now)
                  const otherParticipant = conversation.participants[0] || {
                    name: "Unknown",
                    role: "unknown",
                    profileImage: null
                  };
                  
                  return (
            <div
              key={conversation.id}
              className={`flex cursor-pointer items-center gap-3 border-b p-3 transition-colors hover:bg-accent/50 ${
                        selectedConversation?.id === conversation.id ? "bg-accent" : ""
              }`}
              onClick={() => {
                setSelectedConversation(conversation);
                if (isMobile) setShowConversations(false);
                        if (conversation.unreadCount > 0) {
                          markMessagesAsRead(conversation.id);
                        }
              }}
            >
              <Avatar className="h-10 w-10">
                        {otherParticipant.profileImage ? (
                          <AvatarImage src={otherParticipant.profileImage} />
                        ) : null}
                        <AvatarFallback>
                          {otherParticipant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                          <p className="font-medium truncate">{otherParticipant.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {conversation.lastMessage ? formatTime(conversation.lastMessage.timestamp) : "New"}
                          </p>
                </div>
                        <p className="text-xs text-muted-foreground capitalize">
                          {otherParticipant.role}
                        </p>
                        <p className={`text-xs truncate ${conversation.unreadCount > 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                          {messageDrafts[conversation.id] ? 
                            <span className="text-amber-500">Draft: {messageDrafts[conversation.id]}</span> :
                            (conversation.lastMessage && typeof conversation.lastMessage === 'object' && conversation.lastMessage.content) ? 
                              (typeof conversation.lastMessage.content === 'object' ? 
                                JSON.stringify(conversation.lastMessage.content) : conversation.lastMessage.content) : 
                              "No messages yet"
                          }
                </p>
              </div>
                      {conversation.unreadCount > 0 && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center text-xs text-primary-foreground">
                          {conversation.unreadCount}
                        </div>
              )}
            </div>
                  );
                })
              )}
        </ScrollArea>
          </TabsContent>
          
          <TabsContent value="users" className="mt-0">
            {renderUsersList()}
          </TabsContent>
        </Tabs>
      </>
    );
  };

  // Render chat loading state
  if (isLoading && conversations.length === 0 && !fetchError) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center">
        <Spinner size="lg" />
        <p className="mt-4 text-muted-foreground">Loading your conversations...</p>
      </div>
    );
  }
  
  // Render error state
  if (fetchError) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center p-4">
        <Alert variant="destructive" className="mb-4 max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{fetchError}</AlertDescription>
        </Alert>
        <Button onClick={checkConnections}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry Connection
        </Button>
      </div>
    );
  }

  // Render empty state - no conversations
  if (!isLoading && conversations.length === 0) {
    return (
      <div className="flex flex-col h-[600px] items-center justify-center p-4">
        <h3 className="text-lg font-medium mb-2">No Conversations Found</h3>
        <p className="text-muted-foreground text-center mb-4 max-w-md">
          You don't have any conversations yet. If you're a patient, we can connect you with a healthcare provider.
        </p>
        
        <div className="flex gap-2">
          {userType === 'patient' && (
            <Button onClick={createTestConversation} disabled={isLoading}>
              {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
              Start a Conversation with Doctor
            </Button>
          )}
          
          <Button variant="outline" onClick={() => setShowUsersList(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> New Conversation
          </Button>
            </div>
      </div>
    );
  }

  // Render conversation details
  const renderConversationDetails = () => {
    // Ensure selectedConversation is not null
    if (!selectedConversation) return null;
    
    // Safely access the participant
    const participant = selectedConversation.participants && 
                       selectedConversation.participants.length > 0 ? 
                       selectedConversation.participants[0] : null;
    
    // Debug log to see what data we have
    console.log("Selected conversation:", selectedConversation);
    console.log("Participant data:", participant);
    
    return (
      <>
        {/* Chat Header */}
        <div className="flex items-center gap-3 border-b p-3 bg-muted/50">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowConversations(true)}
              className="md:hidden"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          {participant ? (
            <>
          <Avatar className="h-10 w-10">
                {participant.profileImage ? (
                  <AvatarImage src={participant.profileImage} />
                ) : null}
                <AvatarFallback>
                  {participant.name ? participant.name.split(' ').map(n => n[0]).join('') : 'U'}
                </AvatarFallback>
          </Avatar>
          <div>
                <p className="font-medium">{participant.name || 'Unknown User'}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {participant.role || 'user'}
                  {participant.specialty 
                    ? ` • ${participant.specialty}` 
                    : ''}
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-center">
              <Avatar className="h-10 w-10 mr-2">
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <p className="font-medium">No recipient information</p>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1">
            {isConnected ? (
              <>
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-muted-foreground">Connected</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-xs text-muted-foreground">Disconnected</span>
              </>
            )}
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3">
          {hasMoreMessagesRef.current && (
            <div className="text-center mb-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleLoadMoreMessages}
                disabled={isLoading}
              >
                {isLoading ? <Spinner size="sm" /> : "Load More"}
              </Button>
            </div>
          )}
          
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
                key={message.id}
                  className={`flex ${message.sender.id === userId ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] md:max-w-[70%] rounded-lg p-3 ${
                      message.sender.id === userId
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                    } ${message.status === 'sent' ? "opacity-70" : ""} ${message.error ? "border-red-500 border" : ""}`}
                >
                    {message.sender.id !== userId && (
                      <p className="text-xs font-medium mb-1">{message.sender.name}</p>
                    )}
                  <p className="text-sm break-words">{message.content}</p>
                    <div className="mt-1 flex items-center justify-end gap-2">
                      <p className="text-right text-xs opacity-70">{formatTime(message.timestamp)}</p>
                      {message.sender.id === userId && (
                        <span className="text-xs opacity-70">
                          {message.status === 'sent' ? '✓' : message.status === 'delivered' ? '✓✓' : '✓✓'}
                        </span>
                      )}
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
            
            {/* Typing indicator */}
            {Object.values(typingUsers).some(Boolean) && (
              <div className="flex justify-start">
                <div className="max-w-[85%] md:max-w-[70%] rounded-lg p-3 bg-muted">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Empty div for scrolling to bottom */}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="p-3 border-t bg-background">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <Paperclip className="h-4 w-4" />
            </Button>
            <Input
              placeholder={!isConnected ? "Reconnecting to chat server..." : 
                          messageDrafts[selectedConversation.id] ? "You have a draft message..." : 
                          "Type your message..."}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyUp={handleTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              className="flex-1"
              disabled={sendingMessage}
            />
            <Button 
              size="icon" 
              className="h-9 w-9"
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sendingMessage}
            >
              {sendingMessage ? <Spinner size="sm" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          
          {/* Simple error message with no WebSocket controls */}
          {!isConnected && (
            <p className="text-xs text-amber-600 mt-2">
              Currently in offline mode. Messages will sync when connection is restored.
            </p>
          )}
          
          <p className="mt-2 text-xs text-muted-foreground">
            This is a secure, HIPAA-compliant messaging system. Your conversation is encrypted and private.
          </p>
        </div>
      </>
    );
  };

  return (
    <div className="flex h-[calc(100vh-200px)] md:h-[600px] flex-col md:flex-row border rounded-md overflow-hidden bg-background">
      {/* Conversations List */}
      <div className={`w-full border-r md:w-1/3 ${!showConversations && isMobile ? 'hidden' : 'block'}`}>
        {renderConversationList()}
      </div>
      
      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${showConversations && isMobile ? 'hidden' : 'block'}`}>
        {selectedConversation ? (
          renderConversationDetails()
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <h3 className="text-lg font-medium">No conversation selected</h3>
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
      
      {/* Simplified Network Status - Hide WebSocket controls */}
      <div className="text-xs p-1 bg-muted text-muted-foreground flex justify-between items-center">
        <div>
          <span className={networkStatus.apiConnected ? "text-green-500" : "text-red-500"}>●</span> 
          {networkStatus.apiConnected ? "Connected" : "Offline"}
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
        </div>
      </div>
    </div>
  );
}