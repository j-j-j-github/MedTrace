import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Building2, FileText, FileSymlink } from 'lucide-react';
import { recordService } from '../services/records';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function Timeline() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await recordService.getRecords();
        // Sort by record_date descending
        const sorted = data.sort((a, b) => {
          const dateA = a.record_date ? new Date(a.record_date).getTime() : 0;
          const dateB = b.record_date ? new Date(b.record_date).getTime() : 0;
          return dateB - dateA;
        });
        setRecords(sorted);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  // Group by year
  const groupedByYear = records.reduce((acc, record) => {
    const dateToUse = record.record_date || record.created_at;
    if (!dateToUse) return acc;
    const year = new Date(dateToUse).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(record);
    return acc;
  }, {} as Record<number, any[]>);

  const years = Object.keys(groupedByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medical Timeline</h1>
        <p className="text-slate-500 mt-1">Your health history arranged chronologically.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <p className="text-slate-500 mb-4">Your timeline is empty.</p>
          <Button onClick={() => navigate('/upload')}>Upload your first record</Button>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-10 md:ml-12 space-y-12">
          {years.map((year) => (
            <div key={year} className="relative">
              {/* Year Marker */}
              <div className="absolute -left-12 md:-left-14 flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold border-4 border-white shadow-sm text-sm md:text-base z-10">
                {year.toString().slice(2)}'
              </div>
              
              <div className="ml-8 md:ml-10 space-y-6">
                <h2 className="text-xl font-bold text-slate-900 pt-1">{year}</h2>
                
                {groupedByYear[year].map((record: any) => {
                  const date = new Date(record.record_date || record.created_at);
                  const monthName = date.toLocaleString('default', { month: 'long' });
                  const day = date.getDate();
                  
                  return (
                    <div key={record.id} className="relative group">
                      <div className="absolute -left-[37px] md:-left-[45px] top-5 h-3 w-3 rounded-full bg-slate-300 border-2 border-white group-hover:bg-brand-500 group-hover:scale-125 transition-all z-10"></div>
                      
                      <Card 
                        className="cursor-pointer transition-all hover:shadow-md hover:border-brand-200"
                        onClick={() => navigate(`/records/${record.id}`)}
                      >
                        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          <div className="flex-shrink-0 text-center bg-slate-50 rounded-lg p-2 min-w-[60px] border border-slate-100">
                            <div className="text-xs font-semibold text-slate-500 uppercase">{monthName.slice(0, 3)}</div>
                            <div className="text-lg font-bold text-slate-900 leading-none mt-1">{day}</div>
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{record.file_name}</h3>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                              <span className="inline-flex items-center text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full font-medium">
                                {record.document_type?.replace('_', ' ')}
                              </span>
                              {record.hospital && (
                                <span className="flex items-center">
                                  <Building2 className="mr-1 h-3 w-3" />
                                  {record.hospital}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="hidden sm:block text-slate-400 group-hover:text-brand-600 transition-colors">
                            {record.document_type === 'LAB_REPORT' ? <FileSymlink className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
