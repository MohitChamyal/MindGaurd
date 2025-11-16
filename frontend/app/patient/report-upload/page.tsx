"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/config';

export default function ReportUploadPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError(null);
      } else {
        setError('Only PDF files are allowed.');
        setFile(null);
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError(null);
      } else {
        setError('Only PDF files are allowed.');
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    if (!userId) {
      setError('User ID not found. Please log in again.');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', userId); // Use 'userId' as param name to match backend

      console.log('Uploading file for user:', userId);
      setProgress(30);
      
      // Use the full API endpoint URL that matches your backend
      const response = await fetch(`${apiUrl}/api/health-tracking/pdf-analysis`, {
        method: 'POST',
        body: formData,
      });

      setProgress(60);
      setAnalyzing(true);

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
      console.log('PDF analysis complete:', data);
      
      setProgress(100);
      setSuccess(true);
      
      toast({
        title: "Report uploaded successfully",
        description: "Your medical report has been analyzed. Taking you to the insights tab to view results.",
      });

      // Use router for redirection
      setTimeout(() => {
        router.push('/patient/health-tracking?tab=insights');
      }, 1500);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
      setLoading(false);
      setProgress(0);
      setAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Medical Report Upload</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Upload Medical Report</CardTitle>
            <CardDescription>
              Upload your medical report in PDF format to get insights about your mental and physical health.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {success && (
              <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>Your report has been uploaded and analyzed successfully.</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit}>
              <div 
                className={`border-2 border-dashed rounded-lg p-10 text-center mb-4 ${
                  dragging ? 'border-primary bg-primary/10' : 'border-border'
                } ${file ? 'bg-secondary/20' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-10 w-10 text-primary" />
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFile(null)}
                      className="mt-2"
                      type="button"
                    >
                      Select Different File
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p className="text-sm font-medium">Drag and drop your PDF file here</p>
                    <p className="text-xs text-muted-foreground">
                      or click the button below to browse
                    </p>
                    <Label 
                      htmlFor="file-upload" 
                      className="mt-2 cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                    >
                      Select File
                    </Label>
                    <Input 
                      id="file-upload" 
                      type="file" 
                      accept=".pdf" 
                      onChange={handleFileChange} 
                      className="hidden"
                    />
                  </div>
                )}
              </div>
              
              {(loading || analyzing) && (
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
                type="submit" 
                className="w-full" 
                disabled={!file || loading || success}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {analyzing ? 'Analyzing' : 'Uploading'}
                  </>
                ) : (
                  <>Upload and Analyze</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About Medical Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Uploading your medical reports helps us provide more accurate insights about your mental health.
                We extract key information related to your diagnoses, medications, and treatment plans.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Data Privacy</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your medical data is encrypted and securely stored. We follow HIPAA compliance guidelines to ensure
                your health information remains private and protected.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Supported Files</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Medical lab reports
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Psychological assessments
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Therapy session notes
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                  Hospital discharge summaries
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 