"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { apiUrl } from '@/lib/config';

export function ReportSubmission() {
  const { toast } = useToast();
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);

  // Get user ID on component mount
  useEffect(() => {
    try {
      // First try to get the mindguard_user_id (main ID format)
      let id = localStorage.getItem('mindguard_user_id');
      
      // If not found, try the 'userData' object
      if (!id) {
        const userData = localStorage.getItem('userData');
        if (userData) {
          try {
            const parsedData = JSON.parse(userData);
            id = parsedData.id || parsedData._id;
          } catch (err) {
            console.error('Error parsing user data:', err);
            setError('User authentication error. Please log in again.');
          }
        }
      }
      
      if (id) {
        setUserId(id);
      } else {
        // If no ID found, generate and store a new one
        const newId = crypto.randomUUID();
        localStorage.setItem('mindguard_user_id', newId);
        setUserId(newId);
      }
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      setError('Error accessing user data. Please refresh and try again.');
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "application/pdf") {
        setSelectedFile(file);
        setError("");
      } else {
        setError("Please upload a PDF file only");
        setSelectedFile(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError("Please select a file first");
      return;
    }

    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }

    setIsUploading(true);
    setError("");
    setProgress(10);
    console.log('Starting PDF upload and analysis for user:', userId);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("userId", userId);

      console.log('File details:', {
        name: selectedFile.name,
        size: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
        type: selectedFile.type
      });
      setProgress(30);
      
      // Use the full API endpoint URL that matches your backend
      console.log('Sending request to:', `${apiUrl}/api/health-tracking/pdf-analysis`);
      const response = await fetch(`${apiUrl}/api/health-tracking/pdf-analysis`, {
        method: 'POST',
        body: formData,
      });

      setProgress(60);
      setAnalyzing(true);
      console.log('Upload completed, analyzing PDF...');

      if (!response.ok) {
        let errorMessage = 'Failed to analyze the report';
        
        try {
          const errorData = await response.json();
          console.error('Error from server:', errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          console.error('Failed to parse error response:', jsonError, 'Status:', response.status, response.statusText);
          errorMessage = `Server error (${response.status}): ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }

      setProgress(90);

      const data = await response.json();
      console.log('=== PDF ANALYSIS COMPLETE ===');
      console.log('PDF analysis response:', data);
      
      // Check if we got a success response
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      
      // Fetch updated health data to show in console
      const healthDataResponse = await fetch(`${apiUrl}/api/health-tracking/${userId}`);
      if (healthDataResponse.ok) {
        const healthData = await healthDataResponse.json();
        console.log('=== UPDATED HEALTH DATA ===');
        console.log('Updated health data:', healthData);
        console.log('Insights:', healthData.insights);
        console.log('Progress data:', healthData.progress);
      }
      
      // Fetch interaction history to confirm the report was saved
      const historyResponse = await fetch(`${apiUrl}/api/health-tracking/history/${userId}?type=report&limit=1`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        console.log('=== REPORT SAVED IN HISTORY ===');
        console.log('Report interaction record:', historyData.interactions[0]);
      }
      
      setProgress(100);
      setSuccess(true);
      setSelectedFile(null);
      
      toast({
        title: "Report uploaded successfully",
        description: data.note || "Your medical report has been analyzed. Taking you to the insights tab to view results.",
      });

      // Navigate to insights tab after short delay
      setTimeout(() => {
        router.push('/patient/health-tracking?tab=insights');
      }, 2000);
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err instanceof Error ? err.message : "Failed to upload report. Please try again.";
      setError(errorMessage);
      
      toast({
        title: "Upload Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      setAnalyzing(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h3 className="text-lg font-semibold">Report Submitted Successfully!</h3>
            <p className="text-sm text-muted-foreground text-center">
              Your medical report has been successfully analyzed and insights are available.
            </p>
            <Button
              onClick={() => router.push('/patient/health-tracking?tab=insights')}
              className="mt-4"
            >
              View Insights
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Submit Medical Report</CardTitle>
        <CardDescription>
          Upload your medical reports in PDF format for review by your healthcare provider
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="file-upload"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PDF files only</p>
              </div>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm">{selectedFile.name}</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {(isUploading || analyzing) && (
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {analyzing ? 'Analyzing report...' : 'Uploading...'}
                </span>
                <span className="text-sm font-medium">{progress}%</span>
              </div>
              <Progress value={progress} />
              <p className="text-xs text-muted-foreground">
                {analyzing 
                  ? 'Our AI is analyzing your medical report to extract health insights.' 
                  : 'Uploading your file to our secure server.'}
              </p>
            </div>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {analyzing ? "Analyzing" : "Uploading..."}
              </>
            ) : (
              "Submit Report"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 