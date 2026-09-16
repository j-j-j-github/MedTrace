import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { HeartPulse, Building2, Calendar, FileText, Download, AlertTriangle } from 'lucide-react';
import { sharingService } from '../services/sharing';
import { storageService } from '../services/storage';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { DocumentViewer } from '../components/common/DocumentViewer';

export default function PublicShare() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareData, setShareData] = useState<any>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const fetchSharedRecord = async () => {
      if (!token) return;
      try {
        const data = await sharingService.getSharedRecordByToken(token);
        setShareData(data);
        
        // Fetch signed URL if possible (Note: RLS needs to allow this for public, or we need a secure edge function. 
        // For hackathon MVP, if RLS allows selecting objects by path for the token, we can get it.
        // Actually, Supabase Storage createSignedUrl doesn't check RLS for the *creation*, but we need the service role
        // OR we can make the bucket public, but requirements say private.
        // For MVP, if we use RLS, anonymous users can't generate signed urls easily unless we use a Postgres function with SECURITY DEFINER
        // or we just skip the iframe for the MVP doctor view and just show the AI extraction, OR we assume the frontend can somehow fetch it.
        // Let's attempt to get it using the same function, if it fails, we catch it.
        try {
           const url = await storageService.getDocumentUrl(data.medical_records.file_path);
           setDocUrl(url);
        } catch (e) {
           console.log("Could not generate signed url for public viewer", e);
        }
      } catch (err: any) {
        setError(err.message || 'Invalid or expired link');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSharedRecord();
  }, [token]);

  useEffect(() => {
    if (!shareData) return;
    
    const interval = setInterval(() => {
      const diff = new Date(shareData.expires_at).getTime() - new Date().getTime();
      if (diff <= 0) {
        setError('This link has expired');
        setShareData(null);
        clearInterval(interval);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [shareData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error || !shareData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Share Link Expired</h1>
          <p className="text-slate-500">
            {error || 'This medical record is no longer available through this link.'}
          </p>
        </div>
      </div>
    );
  }

  const record = shareData.medical_records;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Public Header */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-brand-600">
            <HeartPulse className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight text-slate-900">MedTrace</span>
          </div>
          <div className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Expires in {timeRemaining}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Shared Medical Record</h1>
            <p className="text-slate-500 mt-1">Shared by {record.profiles?.full_name || 'Patient'}</p>
          </div>
          {shareData.allow_download && (
             <Button variant="outline">
               <Download className="h-4 w-4 mr-2" />
               Download Document
             </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: AI Extraction */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-white border-b border-slate-100">
                <CardTitle className="text-lg">Record Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6 bg-slate-50/50">
                
                <div className="grid grid-cols-2 gap-y-4 gap-x-2">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Document</p>
                    <p className="font-medium text-sm text-slate-900">{record.file_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Type</p>
                    <p className="font-medium text-sm text-slate-900">{record.document_type?.replace('_', ' ')}</p>
                  </div>
                  {record.hospital && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center"><Building2 className="h-3 w-3 mr-1"/> Hospital</p>
                      <p className="font-medium text-sm text-slate-900">{record.hospital}</p>
                    </div>
                  )}
                  {record.record_date && (
                    <div>
                      <p className="text-xs text-slate-500 mb-1 flex items-center"><Calendar className="h-3 w-3 mr-1"/> Date</p>
                      <p className="font-medium text-sm text-slate-900">{new Date(record.record_date).toLocaleDateString()}</p>
                    </div>
                  )}
                </div>

                {record.summary && (
                  <div className="bg-white rounded-lg p-4 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Summary</h4>
                    <p className="text-sm text-slate-700 leading-relaxed">{record.summary}</p>
                  </div>
                )}

                {/* Lab Results Table */}
                {record.lab_results && record.lab_results.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-3">Extracted Lab Values</h4>
                    <div className="overflow-x-auto rounded-lg border border-slate-200">
                      <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3">Test</th>
                            <th className="px-4 py-3">Value</th>
                            <th className="px-4 py-3">Unit</th>
                            <th className="px-4 py-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {record.lab_results.map((lab: any) => (
                            <tr key={lab.id} className="border-b border-slate-100 last:border-0 bg-white">
                              <td className="px-4 py-3 font-medium text-slate-900">{lab.test_name}</td>
                              <td className="px-4 py-3">{lab.value}</td>
                              <td className="px-4 py-3 text-slate-500">{lab.unit}</td>
                              <td className="px-4 py-3">
                                {lab.status && (
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                                    lab.status.toLowerCase().includes('normal') ? 'bg-green-100 text-green-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {lab.status.replace('_', ' ')}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
                
                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="text-[10px] text-slate-400">
                    AI-generated explanation. This does not constitute medical advice.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Document Preview */}
          <Card className="flex flex-col h-[600px] lg:h-auto overflow-hidden">
             <CardHeader className="bg-slate-50 border-b border-slate-100 py-3">
               <CardTitle className="text-sm font-medium flex items-center text-slate-700">
                 <FileText className="h-4 w-4 mr-2" />
                 Original Document
               </CardTitle>
             </CardHeader>
              <CardContent className="p-0 flex-1 bg-slate-900 overflow-hidden relative">
                {docUrl ? (
                  <DocumentViewer 
                    url={docUrl} 
                    fileType={shareData?.records?.file_type} 
                    fileName={shareData?.records?.file_name || shareData?.records?.title} 
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-slate-500 flex-col">
                     <FileText className="h-12 w-12 text-slate-300 mb-4" />
                     <p>Document preview requires authenticated access.</p>
                     {shareData.allow_download && (
                       <p className="text-sm mt-2">You can download the document using the button above.</p>
                     )}
                  </div>
                )}
              </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
