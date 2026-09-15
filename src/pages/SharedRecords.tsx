import React, { useEffect, useState } from 'react';
import { Share2, Clock, Trash2, ShieldAlert } from 'lucide-react';
import { sharingService } from '../services/sharing';
import { Card, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';

export default function SharedRecords() {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShares = async () => {
    try {
      const data = await sharingService.getActiveShares();
      setShares(data || []);
    } catch (error) {
      console.error('Error fetching shares:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShares();
  }, []);

  const handleRevoke = async (id: string) => {
    try {
      await sharingService.revokeShare(id);
      // Remove from list
      setShares(shares.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error revoking share:', error);
    }
  };

  const getTimeRemaining = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Active Shares</h1>
        <p className="text-slate-500 mt-1">Manage temporary access links you've created for your medical records.</p>
      </div>

      <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 flex items-start space-x-3">
        <ShieldAlert className="h-5 w-5 text-brand-600 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-semibold text-brand-900">Secure Sharing</h4>
          <p className="text-xs text-brand-700 mt-1">
            Links automatically expire after the set duration. Revoking access immediately invalidates the link, preventing any further access to the document.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : shares.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
          <Share2 className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-lg font-medium text-slate-900">No active shares</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
            You don't have any active shared links. You can share records securely from the record details page.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {shares.map((share) => (
            <Card key={share.id} className="overflow-hidden">
              <CardContent className="p-0 sm:flex items-center justify-between">
                <div className="p-5 flex-1">
                  <h3 className="font-semibold text-slate-900 line-clamp-1">
                    {share.medical_records?.file_name || 'Medical Document'}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                    <span className="inline-flex items-center text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full text-xs font-medium border border-brand-200">
                      {share.medical_records?.document_type?.replace('_', ' ')}
                    </span>
                    <span>{share.medical_records?.hospital}</span>
                  </div>
                </div>
                
                <div className="bg-slate-50 p-5 sm:w-72 flex flex-col justify-center sm:border-l border-slate-200 border-t sm:border-t-0">
                  <div className="flex items-center text-sm font-medium text-amber-600 mb-3">
                    <Clock className="mr-1.5 h-4 w-4" />
                    Expires in {getTimeRemaining(share.expires_at)}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300"
                    onClick={() => handleRevoke(share.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revoke Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
