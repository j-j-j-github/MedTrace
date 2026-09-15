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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="group relative flex flex-col rounded-2xl border border-slate-100 bg-white overflow-hidden transition-all shadow-md hover:border-brand-200 hover:shadow-2xl cursor-pointer animate-fade-in aspect-square"
                onClick={() => navigate(`/records/${record.id}`)}
              >
                {/* Thumbnail Area */}
                <div className="flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                  {record.thumbnail ? (
                    record.file_type === 'application/pdf' ? (
                      <iframe 
                        src={`${record.thumbnail}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                        className="absolute inset-0 w-full h-full border-none pointer-events-none scale-105"
                        title={record.file_name}
                      />
                    ) : (
                      <img src={record.thumbnail} alt={record.file_name} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    )
                  ) : (
                    <div className="text-brand-300 transition-transform duration-500 group-hover:scale-110">
                      <FileText className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-60"></div>
                  
                  {/* Delete Button */}
                  <button 
                    onClick={(e) => handleDelete(e, record.id)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                    title="Delete record"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                
                {/* Info Area */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                  <p className="font-semibold text-sm line-clamp-1 mb-0.5">{record.file_name || record.document_type || 'Document'}</p>
                  <div className="flex items-center text-[10px] text-white/80 space-x-2">
                    {record.hospital && (
                      <span className="flex items-center gap-1">
                        <Activity className="h-2.5 w-2.5" />
                        <span className="line-clamp-1">{record.hospital}</span>
                      </span>
                    )}
                    {!record.hospital && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(record.record_date || record.created_at).toLocaleDateString()}
                      </span>
                    )}
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
