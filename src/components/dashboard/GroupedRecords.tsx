import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, Calendar, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../common/Card';
import { recordService } from '../../services/records';

export function GroupedRecords() {
  const navigate = useNavigate();
  const [groupedRecords, setGroupedRecords] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAndGroupRecords() {
      try {
        const data = await recordService.getRecords();
        
        // Sort all by record_date desc
        const sorted = data.sort((a, b) => {
          const dateA = a.record_date ? new Date(a.record_date).getTime() : new Date(a.created_at).getTime();
          const dateB = b.record_date ? new Date(b.record_date).getTime() : new Date(b.created_at).getTime();
          return dateB - dateA;
        });

        // Group by hospital
        const groups: Record<string, any[]> = {};
        sorted.forEach(record => {
          const hospitalName = record.hospital || 'Other Providers';
          if (!groups[hospitalName]) {
            groups[hospitalName] = [];
          }
          groups[hospitalName].push(record);
        });

        setGroupedRecords(groups);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    loadAndGroupRecords();
  }, []);

  if (loading) return null;
  if (Object.keys(groupedRecords).length === 0) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-8 mb-4 flex items-center gap-2">
        <Building2 className="h-6 w-6 text-brand-600" />
        Records by Provider
      </h2>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groupedRecords).map(([hospital, records], index) => (
          <Card key={hospital} className={`animate-fade-in stagger-${(index % 5) + 1}`}>
            <CardHeader className="pb-3 bg-transparent rounded-t-3xl">
              <CardTitle className="text-base text-slate-800 flex items-center justify-between">
                <span className="line-clamp-1">{hospital}</span>
                <span className="text-xs font-medium bg-slate-50 px-3 py-1 rounded-full text-brand-700 shadow-[var(--shadow-neu-pressed)]">
                  {records.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[280px] overflow-y-auto p-4 space-y-3">
                {records.map(record => (
                  <div 
                    key={record.id}
                    onClick={() => navigate(`/records/${record.id}`)}
                    className="group flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 hover:shadow-[var(--shadow-neu-pressed)] cursor-pointer transition-all"
                  >
                    <div className="p-2 rounded-xl bg-slate-50 shadow-[var(--shadow-neu-flat)] text-brand-600 transition-colors">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {record.file_name || record.document_type || 'Document'}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="h-3 w-3" />
                        {new Date(record.record_date || record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
