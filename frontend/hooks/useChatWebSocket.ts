import { useState, useEffect, useRef, useCallback } from 'react';
import { apiUrl } from '@/lib/config';

// Storage key for WebSocket disabled state
const WS_DISABLED_KEY = 'mindguard_ws_disabled';

// Types
export interface Message {
  type: 'chat' | 'system';
  messageId?: string;
  conversationId?: string;
  senderId?: string;
  senderName?: string;
  senderType?: string;
  recipientIds?: string[];
  content?: string;
  timestamp: string;
}

// Check if WebSocket is disabled in localStorage
const isWebSocketDisabled = () => {
  try {
    return localStorage.getItem(WS_DISABLED_KEY) === 'true';
  } catch (e) {
    return false;
  }
};

interface ChatWebSocketOptions {
  token: string;
  userType: string;
  onMessage: (message: Message) => void;
  onTyping: (data: { conversationId: string; senderId: string; isTyping: boolean }) => void;
  onReadReceipt: (data: { conversationId: string; messageId: string; readBy: string }) => void;
  onConnectionChange?: (isConnected: boolean) => void;
  onError?: (error: string) => void;
}

export default function useChatWebSocket({
  token,
  userType,
  onMessage,
  onTyping,
  onReadReceipt,
  onConnectionChange,
  onError
}: ChatWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wsDisabled, setWsDisabled] = useState(isWebSocketDisabled());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const consecutiveFailures = useRef(0);

  // Function to disable WebSocket and use HTTP fallback only
  const disableWebSocket = useCallback(() => {
    try {
      localStorage.setItem(WS_DISABLED_KEY, 'true');
      setWsDisabled(true);
      console.log("WebSocket connections disabled. Using HTTP fallback only.");
    } catch (e) {
      console.error("Failed to save WebSocket disabled state:", e);
    }
  }, []);

  // Function to enable WebSocket
  const enableWebSocket = useCallback(() => {
    try {
      localStorage.removeItem(WS_DISABLED_KEY);
      setWsDisabled(false);
      console.log("WebSocket connections enabled.");
      reconnectAttempts.current = 0;
      consecutiveFailures.current = 0;
      createWebSocketConnection();
    } catch (e) {
      console.error("Failed to save WebSocket enabled state:", e);
    }
  }, []);

  // Helper to create WebSocket connection
  const createWebSocketConnection = useCallback(() => {
    // Skip if WebSockets are disabled
    if (wsDisabled) {
      console.log("WebSocket connections are disabled. Using HTTP fallback.");
      return null;
    }
    
    if (isConnecting || (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING)) {
      console.log("WebSocket connection attempt already in progress. Skipping.");
      return;
    }
    
    setIsConnecting(true);
    setError(null);
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    try {
      if (!token) {
        setError('No authentication token available');
        setIsConnecting(false);
        return;
      }

      if (wsRef.current) {
        console.log("Closing existing WebSocket connection before reconnecting...");
        wsRef.current.close(1000, "Initiating new connection"); 
        wsRef.current = null;
      }

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = '127.0.0.1:5000';
      const wsUrl = `${wsProtocol}//${wsHost}/api/chat/ws?token=${token}&userType=${userType}`;

      console.log(`WebSocket connection attempt:
- Protocol: ${wsProtocol}
- Host: ${wsHost}
- Full URL: ${wsUrl.split('?')[0]}
- Current location: ${window.location.href}
- API URL config: ${apiUrl}
`);

      const connectWithFallback = () => {
        try {
          console.log(`Attempting direct WebSocket connection to: ${wsUrl.split('?')[0]}`);
          const ws = new WebSocket(wsUrl);
          
          // Add early error logging
          ws.addEventListener('error', (event) => {
            console.error('WebSocket connection error details:', {
              readyState: ws.readyState,
              url: wsUrl.split('?')[0],
              timestamp: new Date().toISOString()
            });
            
            // Track consecutive failures to detect if WebSocket should be disabled
            consecutiveFailures.current += 1;
            console.log(`WebSocket consecutive failures: ${consecutiveFailures.current}`);
          });
          
          wsRef.current = ws;
          setupWebSocketHandlers(ws);
          return ws;
        } catch (err) {
          console.error("WebSocket connection creation failed:", err);
          throw err;
        }
      };
      
      // Check for consecutive failures and notify
      if (consecutiveFailures.current >= 10 && !wsDisabled) {
        const autoDisableMsg = "WebSocket connection failed repeatedly. Consider using HTTP fallback only.";
        console.warn(autoDisableMsg);
        if (onError) onError(autoDisableMsg);
      }

      // Only after 10+ failures, consider auto-disabling (but don't auto-disable)
      if (consecutiveFailures.current >= 15 && !wsDisabled) {
        console.error("WebSocket auto-disabled after 15 consecutive failures");
        disableWebSocket();
        const autoDisableMsg = "WebSocket connections disabled after repeated failures. Using HTTP fallback only.";
        if (onError) onError(autoDisableMsg);
        setIsConnecting(false);
        return null;
      }

      const setupWebSocketHandlers = (ws: WebSocket) => {
        ws.onopen = () => {
          console.log('WebSocket connected');
          setIsConnected(true);
          setIsConnecting(false);
          setError(null);
          reconnectAttempts.current = 0;
          consecutiveFailures.current = 0; // Reset consecutive failures on success
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
          if (onConnectionChange) onConnectionChange(true);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'ping') {
              ws.send(JSON.stringify({ type: 'pong' }));
              return;
            }
            
            if (data.type === 'typing') {
              onTyping({
                conversationId: data.conversationId,
                senderId: data.senderId,
                isTyping: data.isTyping
              });
              return;
            }
            
            if (data.type === 'read_receipt') {
              onReadReceipt({
                conversationId: data.conversationId,
                messageId: data.messageId,
                readBy: data.readBy
              });
              return;
            }
            
            onMessage(data);
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        ws.onerror = (event) => {
          console.error('WebSocket error:', event);
          const errorMessage = getConnectionErrorDetails(event);
          setError(errorMessage);
          setIsConnecting(false);
          if (onError) onError(errorMessage);
        };

        const getConnectionErrorDetails = (error: Event) => {
          let errorDetails = 'WebSocket connection failed';
          
          // Add information about the endpoint
          errorDetails += `\nEndpoint: ${wsUrl.split('?')[0]}`;
          
          // Add information about potential CORS issues
          if (window.location.hostname !== '127.0.0.1' && window.location.hostname !== 'localhost') {
            errorDetails += '\nPossible CORS issue: Your frontend hostname doesn\'t match the backend.';
          }
          
          // Add information about WebSocket support
          if (!window.WebSocket) {
            errorDetails += '\nYour browser doesn\'t support WebSockets.';
          }
          
          // Add diagnostic information
          errorDetails += '\nUse HTTP fallback for now - check server logs for WebSocket errors.';
          
          return errorDetails;
        };

        ws.onclose = (event) => {
          console.log('WebSocket disconnected', event.code, event.reason);
          setIsConnected(false);
          setIsConnecting(false);
          if (onConnectionChange) onConnectionChange(false);
          
          if (event.code !== 1000 && 
              reconnectAttempts.current < maxReconnectAttempts && 
              !reconnectTimeoutRef.current) {
            
            const timeout = 5000;
            console.log(`Attempting to reconnect in ${timeout/1000} seconds... (Attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current += 1;
              reconnectTimeoutRef.current = null;
              createWebSocketConnection();
            }, timeout);
          } else if (reconnectAttempts.current >= maxReconnectAttempts) {
            const maxAttemptsMsg = 'Maximum reconnection attempts reached';
            setError(maxAttemptsMsg);
            if (onError) onError('Failed to establish a stable connection after multiple attempts');
          }
        };
      };

      return connectWithFallback();
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError(`Failed to create WebSocket connection: ${err instanceof Error ? err.message : String(err)}`);
      if (onError) onError(`Failed to create WebSocket connection: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setIsConnecting(false);
    }
  }, [onMessage, onTyping, onReadReceipt, onConnectionChange, onError, wsDisabled, disableWebSocket]);

  useEffect(() => {
    if (token && !isConnected && !isConnecting && !wsDisabled) {
      console.log("Token available, initiating WebSocket connection...");
      createWebSocketConnection();
    } else if (!token) {
      console.log("No token found, skipping WebSocket connection.");
    } else if (wsDisabled) {
      console.log("WebSocket is disabled. Using HTTP fallback only.");
    }
    
    return () => {
      if (wsRef.current) {
        console.log("Cleaning up WebSocket connection on effect cleanup or token removal.");
        wsRef.current.close(1000, "Component unmounting or token lost");
        wsRef.current = null;
        setIsConnected(false);
        setIsConnecting(false);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [Boolean(token), createWebSocketConnection, wsDisabled]);

  const sendMessage = useCallback((conversationId: string, content: string, recipientIds: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('WebSocket is not connected');
      return false;
    }

    try {
      const message = {
        type: 'chat',
        conversationId,
        content,
        recipientIds,
        timestamp: new Date().toISOString()
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      setError(`Failed to send message: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }, []);

  const sendTypingIndicator = useCallback((conversationId: string, isTyping: boolean, recipientIds: string[]) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = {
        type: 'typing',
        conversationId,
        isTyping,
        recipientIds,
        timestamp: new Date().toISOString()
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending typing indicator:', err);
      return false;
    }
  }, []);

  const sendReadReceipt = useCallback((conversationId: string, messageId: string, senderId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const message = {
        type: 'read_receipt',
        conversationId,
        messageId,
        senderId,
        timestamp: new Date().toISOString()
      };

      wsRef.current.send(JSON.stringify(message));
      return true;
    } catch (err) {
      console.error('Error sending read receipt:', err);
      return false;
    }
  }, []);

  const reconnect = useCallback(() => {
    console.log("Manual reconnect attempt initiated");
    
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.error("Error closing existing connection:", e);
      }
      wsRef.current = null;
    }
    
    reconnectAttempts.current = 0;
    
    createWebSocketConnection();
  }, [createWebSocketConnection]);

  return {
    isConnected,
    error,
    wsDisabled,
    enableWebSocket,
    disableWebSocket,
    sendMessage,
    sendTypingIndicator,
    sendReadReceipt,
    reconnect
  };
} 