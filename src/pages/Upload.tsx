import React, { useRef, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UploadCloud, Camera, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useProcessing } from '../hooks/useProcessing';

export default function Upload() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'camera' ? 'camera' : 'file';
  const [mode, setMode] = useState<'file' | 'camera'>(initialMode);
  const [customName, setCustomName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { processFiles, status, error } = useProcessing();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const validateAndProcessFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    
    const files = Array.from(fileList);
    
    if (files.length === 0) return;
    
    if (files.length > 3) {
      alert("You can only upload up to 3 files at once.");
      return;
    }

    const validFiles: File[] = [];
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit. Please select smaller files.`);
        return;
      }
      if (!allowedTypes.includes(file.type)) {
        alert(`Invalid file format for ${file.name}. Only PDF, JPG, and PNG are allowed.`);
        return;
      }
      validFiles.push(file);
    }

    // Pass customName only if 1 file is selected, otherwise it doesn't make sense to name all 3 the same
    const customNames = validFiles.length === 1 && customName.trim() !== '' ? [customName] : [];
    processFiles(validFiles, customNames);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    validateAndProcessFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndProcessFiles(e.dataTransfer.files);
  };

  const isProcessing = status !== 'idle' && status !== 'error' && status !== 'Complete';

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Upload Document</h1>
        <p className="text-slate-500 mt-2 text-lg">Digitize your medical records to extract structured information instantly.</p>
      </div>

      {/* Premium Sliding Segment Control */}
      <div className="relative grid grid-cols-2 w-full max-w-sm mx-auto sm:mx-0 p-1 bg-slate-100/80 rounded-2xl backdrop-blur-sm shadow-[var(--shadow-neu-pressed)] border border-slate-200/60">
        <div 
          className="absolute inset-y-1 left-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-sm border border-slate-100 transition-transform duration-300 ease-in-out"
          style={{ transform: mode === 'file' ? 'translateX(0)' : 'translateX(100%)' }}
        />
        <button
          className={`relative flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors duration-300 z-10 ${mode === 'file' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setMode('file')}
          disabled={isProcessing}
        >
          <UploadCloud className="h-4 w-4" />
          Upload File
        </button>
        <button
          className={`relative flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-colors duration-300 z-10 ${mode === 'camera' ? 'text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          onClick={() => setMode('camera')}
          disabled={isProcessing}
        >
          <Camera className="h-4 w-4" />
          Scan Document
        </button>
      </div>

      <div className="relative overflow-hidden rounded-3xl shadow-[var(--shadow-neu-flat)] bg-slate-50 min-h-[400px]">
        {/* Processing State Overlay */}
        {(isProcessing || error || status === 'Complete') && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-50/95 backdrop-blur-sm animate-in fade-in duration-300">
            {isProcessing ? (
              <div className="flex flex-col items-center space-y-6">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-50 shadow-[var(--shadow-neu-pressed)]">
                  <div className="absolute inset-0 rounded-full border-4 border-brand-100 border-t-brand-600 animate-[spin_1.5s_linear_infinite]" />
                  <UploadCloud className="h-10 w-10 text-brand-600 animate-pulse" />
                </div>
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-slate-900">{status}</h3>
                  <p className="text-slate-500 max-w-sm px-4">Our AI is reading your document(s) and securely extracting relevant medical data.</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center space-y-6 text-center px-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-[var(--shadow-neu-flat)]">
                  <AlertCircle className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Upload Failed</h3>
                  <p className="text-red-600 max-w-sm mx-auto bg-red-50 px-4 py-3 rounded-lg border border-red-100">{error}</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="min-w-[120px]">Try Again</Button>
              </div>
            ) : status === 'Complete' ? (
              <div className="flex flex-col items-center space-y-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 shadow-[var(--shadow-neu-flat)]">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Processing Complete</h3>
                  <p className="text-slate-500">Your documents were successfully analyzed.</p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Content Sliders */}
        <div className="relative h-[480px] w-full">
          
          {/* File Upload Mode */}
          <div 
            className="absolute inset-0 flex flex-col justify-center px-6 py-10 sm:px-12 transition-all duration-500 ease-in-out"
            style={{ 
              transform: mode === 'file' ? 'translateX(0)' : 'translateX(-100%)',
              opacity: mode === 'file' ? 1 : 0,
              pointerEvents: mode === 'file' ? 'auto' : 'none'
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Upload a File</h2>
              <p className="text-slate-500 mt-2">Supports PDF, JPG, and PNG up to 5MB (Max 3 files).</p>
            </div>
            
            <div className="flex flex-col items-center space-y-6 max-w-sm mx-auto w-full">
              <div className="w-full space-y-2">
                <label className="text-sm font-semibold text-slate-700">Document Name <span className="text-slate-400 font-normal">(Optional, applies to single upload)</span></label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Annual Blood Test"
                  className="w-full rounded-xl bg-slate-50 shadow-[var(--shadow-neu-pressed)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                />
              </div>

              <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-3xl transition-all duration-300 ${
                  isDragging 
                  ? 'border-brand-500 bg-brand-50 shadow-[var(--shadow-neu-pressed)]' 
                  : 'border-slate-300 hover:border-brand-500 hover:bg-slate-50 shadow-[var(--shadow-neu-flat)] hover:shadow-[var(--shadow-neu-pressed)]'
                }`}
              >
                <div className={`rounded-full p-4 transition-all duration-300 ${isDragging ? 'bg-brand-100 scale-110' : 'bg-slate-100 group-hover:bg-brand-100 group-hover:scale-110'}`}>
                  <UploadCloud className={`h-8 w-8 ${isDragging ? 'text-brand-600' : 'text-slate-500 group-hover:text-brand-600'}`} />
                </div>
                <p className={`mt-4 font-semibold ${isDragging ? 'text-brand-700' : 'text-slate-700 group-hover:text-brand-700'}`}>
                  {isDragging ? 'Drop files here' : 'Click or Drag & Drop to browse files'}
                </p>
                <p className="text-xs text-slate-400 mt-2">Up to 3 files at once</p>
              </button>
            </div>
          </div>

          {/* Camera Mode */}
          <div 
            className="absolute inset-0 flex flex-col justify-center px-6 py-10 sm:px-12 transition-all duration-500 ease-in-out"
            style={{ 
              transform: mode === 'camera' ? 'translateX(0)' : 'translateX(100%)',
              opacity: mode === 'camera' ? 1 : 0,
              pointerEvents: mode === 'camera' ? 'auto' : 'none'
            }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Scan Document</h2>
              <p className="text-slate-500 mt-2">Use your device camera to take a clear photo.</p>
            </div>
            
            <div className="flex flex-col items-center space-y-6 max-w-sm mx-auto w-full">
              <div className="w-full space-y-2">
                <label className="text-sm font-semibold text-slate-700">Document Name <span className="text-slate-400 font-normal">(Optional)</span></label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Prescription"
                  className="w-full rounded-xl bg-slate-50 shadow-[var(--shadow-neu-pressed)] px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                />
              </div>

              <input type="file" accept="image/*" capture="environment" className="hidden" ref={cameraInputRef} onChange={handleFileChange} />
              
              <button 
                onClick={() => cameraInputRef.current?.click()} 
                className="group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 shadow-[var(--shadow-neu-flat)] hover:shadow-[var(--shadow-neu-pressed)] hover:border-brand-500 hover:bg-slate-50 rounded-3xl transition-all duration-300"
              >
                <div className="rounded-full bg-slate-100 p-4 group-hover:bg-brand-100 group-hover:scale-110 transition-all duration-300">
                  <Camera className="h-8 w-8 text-slate-500 group-hover:text-brand-600" />
                </div>
                <p className="mt-4 font-semibold text-slate-700 group-hover:text-brand-700">Open Camera</p>
                <p className="text-xs text-slate-400 mt-1">Best on mobile devices</p>
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
