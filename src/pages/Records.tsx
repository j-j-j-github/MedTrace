import React, { useEffect, useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '../components/common/Input';
import { RecordCard } from '../components/records/RecordCard';
import { recordService } from '../services/records';

export default function Records() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await recordService.getRecords();
        setRecords(data);
      } catch (error) {
        console.error('Error fetching records:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(record => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (record.file_name && record.file_name.toLowerCase().includes(q)) ||
      (record.hospital && record.hospital.toLowerCase().includes(q)) ||
      (record.document_type && record.document_type.toLowerCase().includes(q))
    );
  });

  async function handleDelete(id: string) {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await recordService.deleteRecord(id);
        setRecords(records.filter(r => r.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Medical Records</h1>
          <p className="text-slate-500 mt-1">Manage and view all your digitized health documents.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            className="pl-10" 
            placeholder="Search by hospital, document type, or name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <p className="text-slate-500">No medical records found.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredRecords.map((record) => (
            <RecordCard key={record.id} record={record} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
