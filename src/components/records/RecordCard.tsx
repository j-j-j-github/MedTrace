import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Building2, Calendar, FileSymlink, Trash2 } from 'lucide-react';
import { Card, CardContent } from '../common/Card';

interface RecordCardProps {
  record: any;
  onDelete?: (id: string) => void;
}

export function RecordCard({ record, onDelete }: RecordCardProps) {
  const navigate = useNavigate();

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-brand-200 group"
      onClick={() => navigate(`/records/${record.id}`)}
    >
      <CardContent className="p-5 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="rounded-full bg-brand-50 p-3 text-brand-600 group-hover:bg-brand-100 transition-colors">
            {record.document_type === 'LAB_REPORT' ? <FileSymlink className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
              {record.document_type?.replace('_', ' ') || 'Document'}
            </span>
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(record.id); }}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                title="Delete record"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-1">
          <h3 className="font-semibold text-lg text-slate-900 mb-1 line-clamp-1">
            {record.title || record.file_name || 'Medical Record'}
          </h3>
          <div className="space-y-2 mt-3">
            {record.hospital && (
              <div className="flex items-center text-sm text-slate-500">
                <Building2 className="mr-2 h-4 w-4" />
                <span className="line-clamp-1">{record.hospital}</span>
              </div>
            )}
            {record.record_date && (
              <div className="flex items-center text-sm text-slate-500">
                <Calendar className="mr-2 h-4 w-4" />
                <span>{new Date(record.record_date).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
          <span className={`font-medium ${
            record.processing_status === 'COMPLETED' ? 'text-green-600' :
            record.processing_status === 'FAILED' ? 'text-red-600' : 'text-amber-600'
          }`}>
            {record.processing_status}
          </span>
          <span className="text-brand-600 font-medium group-hover:underline">
            View Details
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
