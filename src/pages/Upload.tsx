import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UploadCloud, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/common/Card';
import { useProcessing } from '../hooks/useProcessing';

export default function Upload() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'camera' ? 'camera' : 'file';
  const [mode, setMode] = useState<'file' | 'camera'>(initialMode);
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { processFile, status, error } = useProcessing();

  // Switch mode when URL changes
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please select a smaller file.");
        return;
      }
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert("Invalid file format. Only PDF, JPG, and PNG are allowed.");
        return;
      }
      processFile(file, customName);
    }
  };

  const isProcessing = status !== 'idle' && status !== 'error' && status !== 'Complete';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Upload Document</h1>
        <p className="text-slate-500 mt-1">Digitize your medical records to extract structured information.</p>
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'file' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setMode('file')}
          disabled={isProcessing}
        >
          Upload File
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${mode === 'camera' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          onClick={() => setMode('camera')}
          disabled={isProcessing}
        >
          Scan Document
        </button>
      </div>

      <Card className="border-dashed border-2 border-slate-200">
        <CardHeader className="text-center pb-2">
          <CardTitle>{mode === 'file' ? 'Upload Document' : 'Scan physical document'}</CardTitle>
          <CardDescription>
            {mode === 'file' 
              ? 'Supports PDF, JPG, JPEG, and PNG up to 10MB.'
              : 'Use your mobile camera to take a clear photo of the document.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="rounded-full bg-brand-50 p-4 relative">
                <div className="absolute inset-0 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
                <UploadCloud className="h-8 w-8 text-brand-600 opacity-0" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">{status}</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm">
                Our AI is reading your document and extracting relevant medical information. This usually takes a few seconds.
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-red-50 p-4 text-red-600">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Upload Failed</h3>
              <p className="text-sm text-red-600 text-center max-w-sm">{error}</p>
              <Button onClick={() => window.location.reload()} variant="outline" className="mt-4">
                Try Again
              </Button>
            </div>
          ) : status === 'Complete' ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-green-50 p-4 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-900">Processing Complete</h3>
              <p className="text-sm text-slate-500 text-center max-w-sm">
                Your document has been successfully processed and added to your records.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-6 w-full max-w-sm">
              <div className="rounded-full bg-slate-100 p-6 text-slate-400">
                {mode === 'file' ? <UploadCloud className="h-10 w-10" /> : <Camera className="h-10 w-10" />}
              </div>
              
              <div className="w-full space-y-2">
                <label className="text-sm font-medium text-slate-700">Document Name (Optional)</label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Annual Blood Test 2026"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>

              {mode === 'file' ? (
                <>
                  <input 
                    type="file" 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange}
                  />
                  <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                    Select File
                  </Button>
                </>
              ) : (
                <>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    className="hidden" 
                    ref={cameraInputRef} 
                    onChange={handleFileChange}
                  />
                  <Button onClick={() => cameraInputRef.current?.click()} className="w-full">
                    Open Camera
                  </Button>
                  <p className="text-xs text-slate-500 text-center">
                    Note: Camera capture works best on mobile devices.
                  </p>
                </>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
