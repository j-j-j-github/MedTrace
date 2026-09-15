import React, { useEffect, useState } from 'react';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { Input } from '../components/common/Input';
import { RecordCard } from '../components/records/RecordCard';
import { recordService } from '../services/records';
import { ConfirmModal } from '../components/common/ConfirmModal';

export default function Records() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortType, setSortType] = useState<string>('date_desc');
  const [recordToDelete, setRecordToDelete] = useState<string | null>(null);

  const documentTypes = [
    { value: 'LAB_REPORT', label: 'Lab Report' },
    { value: 'PRESCRIPTION', label: 'Prescription' },
    { value: 'IMAGING_REPORT', label: 'Imaging Report' },
    { value: 'DISCHARGE_SUMMARY', label: 'Discharge Summary' },
    { value: 'CONSULTATION', label: 'Consultation' },
    { value: 'MEDICAL_CERTIFICATE', label: 'Medical Certificate' },
    { value: 'OTHER', label: 'Other' },
  ];

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

  const filteredAndSortedRecords = records.filter(record => {
    // 1. Check document type filter
    if (filterType && record.document_type !== filterType) {
      return false;
    }
    
    // 2. Check search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (record.file_name && record.file_name.toLowerCase().includes(q)) ||
      (record.hospital && record.hospital.toLowerCase().includes(q)) ||
      (record.document_type && record.document_type.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    // 3. Sort logic
    if (sortType === 'date_desc' || sortType === 'date_asc') {
      const dateA = a.record_date ? new Date(a.record_date).getTime() : new Date(a.created_at).getTime();
      const dateB = b.record_date ? new Date(b.record_date).getTime() : new Date(b.created_at).getTime();
      return sortType === 'date_desc' ? dateB - dateA : dateA - dateB;
    } else if (sortType === 'name_asc') {
      const nameA = a.file_name || a.document_type || '';
      const nameB = b.file_name || b.document_type || '';
      return nameA.localeCompare(nameB);
    } else if (sortType === 'name_desc') {
      const nameA = a.file_name || a.document_type || '';
      const nameB = b.file_name || b.document_type || '';
      return nameB.localeCompare(nameA);
    }
    return 0;
  });

  function handleDelete(id: string) {
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
        
        <div className="flex gap-2">
          {/* Sort Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setSortMenuOpen(!sortMenuOpen); setFilterMenuOpen(false); }}
              className="flex h-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort
            </button>
            
            {sortMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20 animate-fade-in">
                <div className="py-1">
                  {[
                    { value: 'date_desc', label: 'Newest First' },
                    { value: 'date_asc', label: 'Oldest First' },
                    { value: 'name_asc', label: 'Name (A-Z)' },
                    { value: 'name_desc', label: 'Name (Z-A)' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => { setSortType(option.value); setSortMenuOpen(false); }}
                      className={`block w-full text-left px-4 py-2 text-sm ${sortType === option.value ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => { setFilterMenuOpen(!filterMenuOpen); setSortMenuOpen(false); }}
              className="flex h-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none"
            >
            <Filter className="h-4 w-4" />
            {filterType ? documentTypes.find(t => t.value === filterType)?.label : 'All Filters'}
          </button>
          
          {filterMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in">
              <div className="py-1">
                <button
                  onClick={() => { setFilterType(null); setFilterMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-2 text-sm ${filterType === null ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}`}
                >
                  All Documents
                </button>
                {documentTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => { setFilterType(type.value); setFilterMenuOpen(false); }}
                    className={`block w-full text-left px-4 py-2 text-sm ${filterType === type.value ? 'bg-brand-50 text-brand-700' : 'text-slate-700 hover:bg-slate-100'}`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : filteredAndSortedRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <p className="text-slate-500">No medical records found.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedRecords.map((record) => (
            <RecordCard key={record.id} record={record} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <ConfirmModal 
        isOpen={!!recordToDelete}
        title="Delete Medical Record"
        message="Are you sure you want to permanently delete this medical record? This action cannot be undone and the file will be removed from your database."
        confirmText="Delete Record"
        onConfirm={confirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />
    </div>
  );
}
