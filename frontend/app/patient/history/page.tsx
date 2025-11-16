"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface QuestionResponse {
  questionId: string;
  questionText: string;
  response: string | number;
  timestamp: string;
}

interface UserInteraction {
  _id: string;
  sessionId: string;
  interactionType: 'chat' | 'questionnaire' | 'report';
  chatHistory: ChatMessage[];
  questionnaireResponses: QuestionResponse[];
  reportData?: {
    title: string;
    filename: string;
    filePath?: string;
    fileType: string;
    fileSize: number;
    uploadDate: string;
    analysisResults?: {
      summary?: {
        mood?: { value: number, change: number },
        anxiety?: { value: string, change: number },
        sleep?: { value: number, change: number }
      },
      insights?: Array<{
        area: string,
        insight: string,
        recommendation: string
      }>,
      riskFactors?: string[]
    }
  };
  startTime: string;
  endTime: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  pages: number;
}

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'questionnaire' | 'report'>('chat');
  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async (type: 'chat' | 'questionnaire' | 'report', page: number = 1) => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('mindguard_user_id');
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      
      if (!userId) {
        throw new Error('User ID not found');
      }

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch(
        `/api/health-tracking/history/${userId}?type=${type}&page=${page}&limit=10`,
        {
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': token
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setInteractions(data.interactions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      console.error('Error fetching history:', err);
      setInteractions([]);
      setPagination({ total: 0, page: 1, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(activeTab);
  }, [activeTab]);

  const handlePageChange = (page: number) => {
    fetchHistory(activeTab, page);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy h:mm a');
  };

  const getResponseDisplay = (response: string | number) => {
    if (typeof response === 'number') {
      return `${response}/10`;
    }
    if (typeof response === 'string' && response.length > 100) {
      return response.substring(0, 100) + '...';
    }
    return response;
  };

  const getSeverityColor = (response: string | number) => {
    if (typeof response === 'string') {
      switch (response.toLowerCase()) {
        case 'severe':
          return 'bg-destructive text-destructive-foreground';
        case 'moderate':
          return 'bg-warning text-warning-foreground';
        case 'mild':
          return 'bg-info text-info-foreground';
        default:
          return 'bg-secondary text-secondary-foreground';
      }
    }
    if (typeof response === 'number') {
      if (response >= 8) return 'bg-success text-success-foreground';
      if (response >= 5) return 'bg-warning text-warning-foreground';
      return 'bg-destructive text-destructive-foreground';
    }
    return 'bg-secondary text-secondary-foreground';
  };

  const handleViewReport = async (reportId: string) => {
    try {
      const userId = localStorage.getItem('mindguard_user_id');
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      
      if (!userId || !token) {
        alert('Authentication required to view report');
        return;
      }
      
      // Open in a new window/tab
      window.open(`/api/health-tracking/report/view/${reportId}?userId=${userId}`, '_blank');
    } catch (err) {
      console.error('Error viewing report:', err);
      alert('Failed to open report. Please try again later.');
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2">Interaction History</h1>
      <p className="text-muted-foreground mb-6">
        View your chat conversations and questionnaire responses
      </p>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chat' | 'questionnaire' | 'report')} className="space-y-4">
        {/* Mobile Dropdown View */}
        <div className="md:hidden w-full mb-4">
          <Select
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'chat' | 'questionnaire' | 'report')}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select history type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">Chat History</SelectItem>
              <SelectItem value="questionnaire">Questionnaire History</SelectItem>
              <SelectItem value="report">Report History</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Desktop Tabs View */}
        <TabsList className="grid w-full grid-cols-3 h-auto hidden md:grid">
          <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Chat History
          </TabsTrigger>
          <TabsTrigger value="questionnaire" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Questionnaire History
          </TabsTrigger>
          <TabsTrigger value="report" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Report History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Chat Conversations</CardTitle>
                  <CardDescription>Your conversations with the AI assistant</CardDescription>
                </div>
                <Badge variant="outline" className="md:hidden">{activeTab === 'chat' ? 'Chat' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading chat history...</div>
              ) : error ? (
                <div className="text-destructive text-center py-4">{error}</div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-4">No chat history found</div>
              ) : (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <Card key={interaction._id} className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          {/* <CardTitle className="text-sm font-medium">
                            Session {interaction.sessionId.substring(0, 8)}
                          </CardTitle> */}
                          <span className="text-xs text-muted-foreground">
                            {formatDate(interaction.startTime)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                          {interaction.chatHistory.map((message, idx) => (
                            <div
                              key={idx}
                              className={`mb-4 flex ${
                                message.role === 'user' ? 'justify-end' : 'justify-start'
                              }`}
                            >
                              <div
                                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                                  message.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-muted'
                                }`}
                              >
                                <p className="text-sm">{message.content}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                  {formatDate(message.timestamp)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questionnaire">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questionnaire Responses</CardTitle>
                  <CardDescription>Your health assessment responses over time</CardDescription>
                </div>
                <Badge variant="outline" className="md:hidden">{activeTab === 'questionnaire' ? 'Questionnaire' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading questionnaire history...</div>
              ) : error ? (
                <div className="text-destructive text-center py-4">{error}</div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-4">No questionnaire history found</div>
              ) : (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <Card key={interaction._id} className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium">
                            Assessment on {formatDate(interaction.startTime)}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[60%] md:w-auto">Question</TableHead>
                              <TableHead className="w-[40%] md:w-[200px]">Response</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {interaction.questionnaireResponses.map((response) => (
                              <TableRow key={response.questionId}>
                                <TableCell className="font-medium text-xs md:text-sm">
                                  {response.questionText}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`${getSeverityColor(response.response)} text-xs md:text-sm`}>
                                    {getResponseDisplay(response.response)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="report">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Report History</CardTitle>
                  <CardDescription>Your uploaded health reports and analysis results</CardDescription>
                </div>
                <Badge variant="outline" className="md:hidden">{activeTab === 'report' ? 'Report' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading report history...</div>
              ) : error ? (
                <div className="text-destructive text-center py-4">{error}</div>
              ) : interactions.length === 0 ? (
                <div className="text-center py-4">No report history found</div>
              ) : (
                <div className="space-y-4">
                  {interactions.map((interaction) => (
                    <Card key={interaction._id} className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-sm font-medium">
                            {interaction.reportData?.title || 'Untitled Report'} - {formatDate(interaction.startTime)}
                          </CardTitle>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs md:text-sm whitespace-nowrap"
                            onClick={() => handleViewReport(interaction._id)}
                          >
                            View PDF
                          </Button>
                        </div>
                        <CardDescription>
                          {interaction.reportData?.filename || 'No filename'} • 
                          {interaction.reportData?.fileSize ? `${(interaction.reportData.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {interaction.questionnaireResponses && interaction.questionnaireResponses.length > 0 ? (
                          <>
                            <h4 className="font-medium text-sm mb-2">Extracted Health Data</h4>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[60%] md:w-auto">Metric</TableHead>
                                  <TableHead className="w-[40%] md:w-[200px]">Value</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {interaction.questionnaireResponses.map((response) => (
                                  <TableRow key={response.questionId}>
                                    <TableCell className="font-medium text-xs md:text-sm">
                                      {response.questionText}
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={`${getSeverityColor(response.response)} text-xs md:text-sm`}>
                                        {getResponseDisplay(response.response)}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">No analysis data available for this report.</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {!loading && !error && interactions.length > 0 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pagination.page - 1);
                  }}
                  className={pagination.page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === pagination.page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePageChange(pagination.page + 1);
                  }}
                  className={pagination.page === pagination.pages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
} 