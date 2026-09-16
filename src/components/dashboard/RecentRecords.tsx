import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, Activity, Calendar, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { recordService } from '../../services/records';
import { storageService } from '../../services/storage';
import { ConfirmModal } from '../common/ConfirmModal';

export function RecentRecords() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecords() {
      try {
        const data = await recordService.getRecords();
        // Sort by record_date (from AI) if available, else created_at
        const sorted = data.sort((a, b) => {
          const dateA = a.record_date ? new Date(a.record_date).getTime() : new Date(a.created_at).getTime();
          const dateB = b.record_date ? new Date(b.record_date).getTime() : new Date(b.created_at).getTime();
          return dateB - dateA;
        });
        
        // Fetch signed URLs for all thumbnails in a single batch request
        const top5 = sorted.slice(0, 5);
        const filePaths = top5.map(r => r.file_path).filter(Boolean);
        let urlMap: Record<string, string> = {};
        
        if (filePaths.length > 0) {
          try {
            urlMap = await storageService.getDocumentUrls(filePaths);
          } catch (e) {
            console.error('Failed to batch fetch thumbnails', e);
          }
        }

        const withThumbnails = top5.map((record) => ({
          ...record,
          thumbnail: record.file_path ? urlMap[record.file_path] || null : null
        }));
        
        setRecords(withThumbnails);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadRecords();
  }, []);

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    setRecordToDelete(id);
  }

  async function confirmDelete() {
    if (recordToDelete) {
      try {
        await recordService.deleteRecord(recordToDelete);
        setRecords(records.filter(r => r.id !== recordToDelete));
      } catch (error) {
        console.error(error);
      } finally {
        setRecordToDelete(null);
      }
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <CardTitle className="text-lg font-bold text-slate-900">Recent Documents</CardTitle>
        <Button variant="ghost" className="h-8 px-3 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50" onClick={() => navigate('/records')}>
          View all
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600"></div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-slate-200 border-dashed bg-slate-50">
            <p className="text-sm text-slate-500">No records uploaded yet.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/upload')}>
              Upload Record
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {records.map((record) => (
              <div
                key={record.id}
                className="group relative flex flex-col rounded-3xl bg-slate-50 overflow-hidden transition-all duration-300 shadow-[var(--shadow-neu-flat)] hover:shadow-[var(--shadow-neu-pressed)] hover:scale-[0.98] cursor-pointer animate-fade-in"
                onClick={() => navigate(`/records/${record.id}`)}
              >
                {/* Header Area */}
                <div className="flex items-center justify-between px-4 py-3 bg-transparent">
                  <div className="flex items-center text-xs font-medium text-slate-500">
                    <Calendar className="h-3.5 w-3.5 mr-1.5" />
                    {new Date(record.record_date || record.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded-md border border-brand-100/50">
                    <Activity className="h-3 w-3 mr-1" />
                    <span className="line-clamp-1 max-w-[120px]">{record.hospital || 'Provider'}</span>
                  </div>
                </div>

                {/* Thumbnail Area (Landscape) */}
                <div className="relative aspect-[4/3] sm:aspect-video md:aspect-[4/3] w-full bg-slate-100 overflow-hidden flex items-center justify-center group-hover:bg-slate-200 transition-colors">
                  {record.thumbnail ? (
                    record.file_type === 'application/pdf' ? (
                      <iframe 
                        src={`${record.thumbnail}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                        className="absolute inset-0 w-full h-full border-none pointer-events-none scale-105"
                        title={record.file_name}
                      />
                    ) : (
                      <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-900/5">
                        <img 
                          src={record.thumbnail} 
                          alt="" 
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-xl opacity-30 scale-110" 
                        />
                        <img 
                          src={record.thumbnail} 
                          alt={record.file_name} 
                          className="relative max-w-[90%] max-h-[90%] object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-105" 
                        />
                      </div>
                    )
                  ) : (
                    <div className="text-slate-300 transition-transform duration-500 group-hover:scale-110 group-hover:text-brand-300">
                      <FileText className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-brand-900/0 group-hover:bg-brand-900/5 transition-colors duration-300"></div>

                  {/* Delete Button */}
                  <button 
                    onClick={(e) => handleDelete(e, record.id)}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-slate-200"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Footer Area */}
                <div className="px-4 py-3 bg-transparent">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-800 line-clamp-1 group-hover:text-brand-700 transition-colors">
                      {record.file_name || record.document_type || 'Document'}
                    </p>
                    <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-brand-600 transition-colors shrink-0 ml-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ConfirmModal 
        isOpen={!!recordToDelete}
        title="Delete Medical Record"
        message="Are you sure you want to permanently delete this medical record? This action cannot be undone and the file will be removed from your database."
        confirmText="Delete Record"
        onConfirm={confirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />
    </Card>
  );
}
