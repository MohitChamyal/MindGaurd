"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { userIdKey, userTypeKey, tokenKey, apiUrl } from "@/lib/config";
import { Spinner } from "@/components/ui/spinner";

export function ChatDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [userType, setUserType] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [testData, setTestData] = useState<any>(null);

  // Add a log function
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Initialize user data
  useEffect(() => {
    addLog("Component mounted, checking authentication data...");
    
    // Get user info from local storage
    const storedUserId = localStorage.getItem(userIdKey);
    const storedUserType = localStorage.getItem(userTypeKey);
    const storedToken = localStorage.getItem(tokenKey);

    if (storedUserId) {
      setUserId(storedUserId);
      addLog(`Found userId: ${storedUserId}`);
    } else {
      addLog("ERROR: No userId found in localStorage");
    }

    if (storedUserType) {
      setUserType(storedUserType);
      addLog(`Found userType: ${storedUserType}`);
    } else {
      addLog("ERROR: No userType found in localStorage");
    }

    if (storedToken) {
      setToken(storedToken);
      addLog("Found token in localStorage");
    } else {
      addLog("ERROR: No token found in localStorage");
    }
  }, []);

  // Test API connection
  const testAPI = async () => {
    addLog("Testing API connection...");
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/health`);
      const data = await response.json();
      addLog(`API health response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`ERROR: API connection failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test conversations endpoint
  const testConversations = async () => {
    if (!userId) {
      addLog("ERROR: Cannot test conversations without userId");
      return;
    }

    addLog(`Testing conversations endpoint for user ${userId}...`);
    setIsLoading(true);
    
    try {
      const response = await fetch(
        `${apiUrl}/api/chat/conversations/${userId}?page=1&limit=10`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      addLog(`Conversations response status: ${response.status}`);
      
      if (!response.ok) {
        throw new Error(`Status ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTestData(data);
      addLog(`Conversations data: ${JSON.stringify(data, null, 2)}`);
      
      if (data.conversations && data.conversations.length === 0) {
        addLog("No conversations found. This might be expected for new users.");
      }
    } catch (error) {
      addLog(`ERROR: Conversations fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test WebSocket connection
  const testWebSocket = () => {
    if (!token) {
      addLog("ERROR: Cannot test WebSocket without token");
      return;
    }

    addLog("Testing WebSocket connection...");
    
    try {
      const wsUrl = `ws://localhost:5000?token=${token}&userType=${userType}`;
      addLog(`Connecting to WebSocket at: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        addLog("WebSocket connected successfully! ✅");
      };
      
      ws.onmessage = (event) => {
        addLog(`WebSocket message received: ${event.data}`);
      };
      
      ws.onerror = (event) => {
        addLog(`ERROR: WebSocket connection error: ${JSON.stringify(event)}`);
      };
      
      ws.onclose = () => {
        addLog("WebSocket connection closed");
      };
      
      // Close after 5 seconds for clean up
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
          addLog("WebSocket connection closed after 5 seconds");
        }
      }, 5000);
    } catch (error) {
      addLog(`ERROR: WebSocket setup failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Create test conversation with a doctor (for patients)
  const createTestConversation = async () => {
    if (!userId || !userType) {
      addLog("ERROR: Cannot create test conversation without userId and userType");
      return;
    }

    addLog("Creating test conversation...");
    setIsLoading(true);
    
    try {
      // In a real scenario, you'd have a way to select a doctor
      // This is just a test to see if the API endpoint works
      const requestBody = {
        userId,
        participants: [
          {
            // Using an actual doctor ID from your database
            userId: "67fa13c49ccfee17423cddce", // Actual doctor ID
            role: "doctor"
          }
        ],
        title: "Test Conversation"
      };
      
      addLog(`Creating conversation with request: ${JSON.stringify(requestBody)}`);
      
      const response = await fetch(`${apiUrl}/api/chat/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      addLog(`Create conversation response status: ${response.status}`);
      
      const data = await response.json();
      addLog(`Create conversation response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`ERROR: Create conversation failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test for backend MongoDB models
  const checkModels = async () => {
    addLog("Checking if models and collections exist...");
    setIsLoading(true);
    
    try {
      // This would require a special endpoint on your backend
      // Let's assume you create one for debugging
      const response = await fetch(`${apiUrl}/api/debug/models`);
      
      if (!response.ok) {
        addLog(`Model check failed with status: ${response.status}`);
        addLog("You may need to add a debug endpoint to your backend.");
        return;
      }
      
      const data = await response.json();
      addLog(`Models check response: ${JSON.stringify(data)}`);
    } catch (error) {
      addLog(`ERROR: Models check failed: ${error instanceof Error ? error.message : String(error)}`);
      addLog("You may need to add a debug endpoint to your backend.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check for available doctors
  const listDoctors = async () => {
    addLog("Checking for available doctors...");
    setIsLoading(true);
    
    try {
      const response = await fetch(`${apiUrl}/api/debug/doctors`);
      
      if (!response.ok) {
        addLog(`Doctor check failed with status: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      addLog(`Available doctors: ${JSON.stringify(data, null, 2)}`);
      
      if (data.doctors && data.doctors.length > 0) {
        addLog(`Use doctor ID: ${data.doctors[0]._id} for testing`);
      }
    } catch (error) {
      addLog(`ERROR: Doctor check failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] border rounded-md overflow-hidden bg-background p-4 gap-4">
      <h2 className="text-xl font-bold">Chat Debugging Panel</h2>
      
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p><strong>User ID:</strong> {userId || "Not found"}</p>
          <p><strong>User Type:</strong> {userType || "Not found"}</p>
          <p><strong>Token:</strong> {token ? "Found (hidden)" : "Not found"}</p>
        </div>
        
        <div className="flex flex-col gap-2">
          <Button onClick={testAPI} disabled={isLoading} size="sm">
            Test API Connection
          </Button>
          <Button onClick={testConversations} disabled={isLoading || !userId} size="sm">
            Test Conversations Endpoint
          </Button>
          <Button onClick={testWebSocket} disabled={isLoading || !token} size="sm">
            Test WebSocket Connection
          </Button>
          <Button onClick={createTestConversation} disabled={isLoading || !userId || !userType} size="sm">
            Create Test Conversation
          </Button>
          <Button onClick={checkModels} disabled={isLoading} size="sm">
            Check Database Models
          </Button>
          <Button onClick={listDoctors} disabled={isLoading} size="sm">
            List Available Doctors
          </Button>
        </div>
      </div>
      
      <div className="flex-1 border rounded-md p-2 overflow-auto bg-black text-green-400 font-mono text-sm">
        <div className="space-y-1">
          {logs.length === 0 ? (
            <p>Logs will appear here...</p>
          ) : (
            logs.map((log, index) => (
              <p key={index}>{log}</p>
            ))
          )}
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center">
          <Spinner size="sm" />
        </div>
      )}
      
      <Button onClick={() => setLogs([])} variant="outline" size="sm">
        Clear Logs
      </Button>
    </div>
  );
} 