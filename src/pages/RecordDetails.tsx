import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Calendar, User as UserIcon, FileText, Download, Share2 } from 'lucide-react';
import { recordService } from '../services/records';
import { storageService } from '../services/storage';
import { aiService } from '../services/ai';
import { Button } from '../components/common/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { ShareDialog } from '../components/sharing/ShareDialog';
import { DocumentViewer } from '../components/common/DocumentViewer';

export default function RecordDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<any>(null);
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  const handleRetryAI = async () => {
    if (!record || !record.id || !record.file_path) return;
    setIsRetrying(true);
    setRetryError(null);
    try {
      const aiResponse = await aiService.processMedicalDocument(record.id, record.file_path);
      await recordService.saveAIProcessingResults(record.id, aiResponse);
      const updatedRecord = await recordService.getRecordById(record.id);
      setRecord(updatedRecord);
    } catch (err: any) {
      setRetryError(err.message || 'Failed to retry AI analysis.');
    } finally {
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    const fetchRecordDetails = async () => {
      if (!id) return;
      try {
        const data = await recordService.getRecordById(id);
        setRecord(data);
        if (data.file_path) {
          const url = await storageService.getDocumentUrl(data.file_path);
          setDocUrl(url);
        }
      } catch (error) {
        console.error('Error fetching record details:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecordDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (!record) {
    return <div className="text-center py-12">Record not found.</div>;
  }

  return (
    <div className="flex flex-col space-y-4 lg:h-[calc(100vh-8rem)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/records')} className="px-2">
            <ArrowLeft className="h-5 w-5 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 line-clamp-1">
            {record.file_name}
          </h1>
        </div>
        <div className="flex items-center space-x-2">
          {docUrl && (
            <a 
              href={docUrl} 
              download={record.file_name || 'medical-document'}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </a>
          )}
          <Button className="bg-brand-600 hover:bg-brand-700 p-2 sm:px-4 sm:py-2" onClick={() => setShowShareDialog(true)}>
            <Share2 className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Share Record</span>
          </Button>
        </div>
      </div>

      {showShareDialog && (
        <ShareDialog record={record} onClose={() => setShowShareDialog(false)} />
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:min-h-0">
        {/* LEFT PANEL: Original Document */}
        <Card className="flex flex-col overflow-hidden h-[60vh] lg:h-full min-h-[400px]">
          <CardHeader className="border-b border-slate-100 bg-slate-50 py-3">
            <CardTitle className="text-sm font-medium flex items-center text-slate-700">
              <FileText className="h-4 w-4 mr-2" />
              Original Document
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 bg-slate-900 overflow-hidden relative">
            <DocumentViewer
              url={docUrl}
              fileType={record.file_type}
              fileName={record.file_name || record.title}
            />
          </CardContent>
        </Card>

        {/* RIGHT PANEL: AI Analysis */}
        <div className="flex flex-col space-y-6 overflow-y-auto pr-2 pb-10">
          <Card>
            <CardHeader className="border-b border-slate-100 bg-brand-50 py-3">
              <CardTitle className="text-sm font-medium flex items-center text-brand-800">
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                {record.hospital && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1 flex items-center"><Building2 className="h-3 w-3 mr-1"/> Hospital</p>
                    <p className="font-medium text-sm text-slate-900">{record.hospital}</p>
                  </div>
                )}
                {record.doctor && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1 flex items-center"><UserIcon className="h-3 w-3 mr-1"/> Doctor</p>
                    <p className="font-medium text-sm text-slate-900">{record.doctor}</p>
                  </div>
                )}
                {record.record_date && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1 flex items-center"><Calendar className="h-3 w-3 mr-1"/> Date</p>
                    <p className="font-medium text-sm text-slate-900">{new Date(record.record_date).toLocaleDateString()}</p>
                  </div>
                )}
                {record.document_type && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Document Type</p>
                    <p className="font-medium text-sm text-slate-900">{record.document_type.replace('_', ' ')}</p>
                  </div>
                )}
              </div>

              {/* No AI Data Fallback */}
              {!record.summary && !record.lab_results?.length && !record.medications?.length && (
                <div className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-lg text-center space-y-3">
                  <p className="text-sm text-slate-600">No AI analysis data found for this document.</p>
                  {retryError && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded w-full">{retryError}</p>
                  )}
                  <Button 
                    onClick={handleRetryAI} 
                    disabled={isRetrying}
                    variant="outline"
                    className="text-brand-600 border-brand-200 hover:bg-brand-50"
                  >
                    {isRetrying ? 'Analyzing...' : 'Try AI Analysis Again'}
                  </Button>
                </div>
              )}

              {/* Summary */}
              {record.summary && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
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
                      <thead className="text-xs text-slate-700 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Test</th>
                          <th className="px-4 py-3">Value</th>
                          <th className="px-4 py-3">Unit</th>
                          <th className="px-4 py-3">Ref Range</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.lab_results.map((lab: any) => (
                          <tr key={lab.id} className="border-b border-slate-100 last:border-0 bg-white">
                            <td className="px-4 py-3 font-medium text-slate-900">{lab.test_name}</td>
                            <td className="px-4 py-3">{lab.value}</td>
                            <td className="px-4 py-3 text-slate-500">{lab.unit}</td>
                            <td className="px-4 py-3 text-slate-500">{lab.reference_range}</td>
                            <td className="px-4 py-3">
                              {lab.status && (
                                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
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

              {/* Medications List */}
              {record.medications && record.medications.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">Prescribed Medications</h4>
                  <div className="space-y-3">
                    {record.medications.map((med: any) => (
                      <div key={med.id} className="p-3 border border-slate-200 rounded-lg bg-white">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-brand-700">{med.name}</span>
                          {med.duration && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{med.duration}</span>}
                        </div>
                        <div className="text-sm text-slate-600 grid grid-cols-2 gap-2 mt-2">
                          {med.dosage && <div><span className="text-slate-400">Dosage:</span> {med.dosage}</div>}
                          {med.frequency && <div><span className="text-slate-400">Frequency:</span> {med.frequency}</div>}
                        </div>
                        {med.instructions && (
                          <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-2 rounded">
                            {med.instructions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-center mt-6 pt-6 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 max-w-md mx-auto">
                  AI-generated explanation. This is intended to help you understand information contained in your medical records and does not constitute medical advice, diagnosis, or treatment.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
