'use client';

import { useState } from 'react';
import { SupabaseFileUpload } from '@/components/shared/SupabaseFileUpload';
import { STORAGE_BUCKETS } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, FileImage, Settings } from 'lucide-react';

interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

export default function SupabaseDemoPage() {
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);

  // Check if Supabase is configured
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Debug information
  const debugInfo = {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    urlStart: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) || 'none',
  };

  const handleSingleUploadComplete = (result: UploadResult) => {
    setUploadResults(prev => [result, ...prev]);
  };

  const handleMultipleUploadComplete = (results: UploadResult[]) => {
    setUploadResults(prev => [...results, ...prev]);
  };

  const clearResults = () => {
    setUploadResults([]);
  };

  const testSupabaseConnection = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}`
        }
      });
      
      if (response.ok) {
        alert('✅ Supabase connection successful!');
      } else {
        alert(`❌ Supabase connection failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      alert(`❌ Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getResultIcon = (result: UploadResult) => {
    if (result.success) {
      return <FileText className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-red-500" />;
  };

  const getResultBadge = (result: UploadResult) => {
    if (result.success) {
      return <Badge variant="default" className="bg-green-500">Success</Badge>;
    }
    return <Badge variant="destructive">Failed</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Supabase File Upload Demo</h1>
        <p className="text-muted-foreground">
          Test and demonstrate the Supabase file storage integration
        </p>
      </div>

      {/* Always Visible Test Button */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">🧪 Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={testSupabaseConnection}
              variant="outline"
              size="sm"
            >
              Test Supabase Connection
            </Button>
            <div className="text-sm text-blue-700">
              Click to test if Supabase is reachable
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Always Visible Debug Info */}
      <Card className="border-gray-200 bg-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-800">🔍 Current Configuration Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Environment Variables:</div>
              <div className="space-y-1 mt-2">
                <div>URL: {debugInfo.hasUrl ? '✅ Loaded' : '❌ Missing'}</div>
                <div>Key: {debugInfo.hasKey ? '✅ Loaded' : '❌ Missing'}</div>
              </div>
            </div>
            <div>
              <div className="font-medium">Connection Status:</div>
              <div className="space-y-1 mt-2">
                <div>Supabase: {isSupabaseConfigured ? '✅ Configured' : '❌ Not Configured'}</div>
                <div>Client: {isSupabaseConfigured ? '✅ Ready' : '❌ Not Ready'}</div>
              </div>
            </div>
          </div>
          {isSupabaseConfigured && (
            <div className="mt-3 p-2 bg-green-100 rounded text-xs">
              <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 50)}...</div>
              <div>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30)}...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Warning */}
      {!isSupabaseConfigured && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">⚠️ Supabase Not Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              To use Supabase file uploads, you need to configure the following environment variables:
            </p>
            <div className="bg-yellow-100 p-3 rounded-md font-mono text-sm">
              <div>NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key</div>
            </div>
            <p className="text-yellow-700 mt-4 text-sm">
              Add these to your <code className="bg-yellow-200 px-1 rounded">.env.local</code> file and restart your development server.
            </p>
            
            <div className="mt-4">
              <Button 
                onClick={testSupabaseConnection}
                variant="outline"
                size="sm"
                className="w-full"
              >
                🧪 Test Supabase Connection
              </Button>
            </div>
            
            {/* Debug Information */}
            <div className="mt-4 p-3 bg-yellow-200 rounded-md">
              <h4 className="font-medium text-yellow-800 mb-2">Debug Information:</h4>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>Has URL: {debugInfo.hasUrl ? '✅ Yes' : '❌ No'}</div>
                <div>Has Key: {debugInfo.hasKey ? '✅ Yes' : '❌ No'}</div>
                <div>URL Length: {debugInfo.urlLength}</div>
                <div>Key Length: {debugInfo.keyLength}</div>
                <div>URL Start: {debugInfo.urlStart}...</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single">Single Upload</TabsTrigger>
          <TabsTrigger value="multiple">Multiple Upload</TabsTrigger>
          <TabsTrigger value="results">Upload Results</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Employee Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <SupabaseFileUpload
                   bucket={STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS}
                   path="demo-employee"
                   onUploadComplete={handleSingleUploadComplete}
                   multiple={false}
                   title="Upload Employee Document"
                   description="Upload a single employee document"
                   disabled={!isSupabaseConfigured}
                 />
              </CardContent>
            </Card>

            {/* Equipment Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Equipment Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <SupabaseFileUpload
                   bucket={STORAGE_BUCKETS.EQUIPMENT_DOCUMENTS}
                   path="demo-equipment"
                   onUploadComplete={handleSingleUploadComplete}
                   multiple={false}
                   title="Upload Equipment Document"
                   description="Upload a single equipment document"
                   disabled={!isSupabaseConfigured}
                 />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="multiple" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Multiple Employee Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Multiple Employee Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <SupabaseFileUpload
                   bucket={STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS}
                   path="demo-employee-batch"
                   onMultipleUploadComplete={handleMultipleUploadComplete}
                   multiple={true}
                   maxFiles={10}
                   title="Upload Multiple Employee Documents"
                   description="Upload multiple employee documents at once"
                   disabled={!isSupabaseConfigured}
                 />
              </CardContent>
            </Card>

            {/* General Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  General Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                                 <SupabaseFileUpload
                   bucket={STORAGE_BUCKETS.GENERAL}
                   path="demo-general"
                   onMultipleUploadComplete={handleMultipleUploadComplete}
                   multiple={true}
                   maxFiles={5}
                   title="Upload General Documents"
                   description="Upload various types of documents"
                   disabled={!isSupabaseConfigured}
                 />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Upload Results</CardTitle>
                <Button variant="outline" onClick={clearResults}>
                  Clear Results
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {uploadResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No uploads yet. Try uploading some files!
                </div>
              ) : (
                <div className="space-y-3">
                  {uploadResults.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      {getResultIcon(result)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {result.filename || 'Unknown file'}
                          </span>
                          {getResultBadge(result)}
                        </div>
                        {result.success ? (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">
                              URL: {result.url}
                            </p>
                            <p className="text-xs text-green-600">
                              {result.filename} uploaded successfully
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-red-600">
                            Error: {result.error || 'Unknown error'}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uploadResults.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Successful</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {uploadResults.filter(r => r.success).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {uploadResults.filter(r => !r.success).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Storage Buckets</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{STORAGE_BUCKETS.DOCUMENTS}</Badge>
                  <span className="text-sm text-muted-foreground">General documents</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS}</Badge>
                  <span className="text-sm text-muted-foreground">Employee files</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{STORAGE_BUCKETS.EQUIPMENT_DOCUMENTS}</Badge>
                  <span className="text-sm text-muted-foreground">Equipment files</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{STORAGE_BUCKETS.GENERAL}</Badge>
                  <span className="text-sm text-muted-foreground">Miscellaneous</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Features</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div>✅ File type validation</div>
                <div>✅ File size validation (10MB max)</div>
                <div>✅ Progress tracking</div>
                <div>✅ Multiple file uploads</div>
                <div>✅ Drag and drop interface</div>
                <div>✅ Automatic bucket selection</div>
                <div>✅ Error handling</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
