import React, { useState } from 'react';
import { Share2, Clock, Download, CheckCircle2, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../common/Card';
import { Button } from '../common/Button';
import { sharingService } from '../../services/sharing';

interface ShareDialogProps {
  record: any;
  onClose: () => void;
}

export function ShareDialog({ record, onClose }: ShareDialogProps) {
  const [expiresIn, setExpiresIn] = useState<number>(1);
  const [allowDownload, setAllowDownload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const token = await sharingService.generateShareLink(record.id, expiresIn, allowDownload);
      const url = `${window.location.origin}/share/${token}`;
      setShareLink(url);
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in duration-200">
        <CardHeader>
          <CardTitle className="text-xl flex items-center">
            <Share2 className="mr-2 h-5 w-5 text-brand-600" />
            Share Medical Record
          </CardTitle>
          <CardDescription>
            Create a secure, temporary link for healthcare professionals.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!shareLink ? (
            <>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="font-semibold text-slate-900 line-clamp-1">{record.file_name}</p>
                <p className="text-sm text-slate-500 mt-1 flex justify-between">
                  <span>{record.hospital}</span>
                  <span>{record.record_date ? new Date(record.record_date).toLocaleDateString() : ''}</span>
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-900 flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-slate-500" />
                  Expiration Time
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 6, 24].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setExpiresIn(hours)}
                      className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                        expiresIn === hours 
                        ? 'bg-brand-50 border-brand-200 text-brand-700 font-medium' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="allowDownload"
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                />
                <label htmlFor="allowDownload" className="text-sm font-medium text-slate-700 flex items-center cursor-pointer">
                  <Download className="mr-1 h-4 w-4 text-slate-400" />
                  Allow recipient to download original file
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
                <Button onClick={handleShare} isLoading={loading}>Generate Secure Link</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center py-4 space-y-4">
              <div className="rounded-full bg-green-50 p-3 text-green-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-slate-900 text-center">Link Generated Successfully</h3>
              
              <div className="w-full flex items-center space-x-2 bg-slate-50 p-2 rounded-md border border-slate-200">
                <input 
                  type="text" 
                  readOnly 
                  value={shareLink} 
                  className="flex-1 bg-transparent text-sm text-slate-600 outline-none px-2"
                />
                <Button onClick={copyToClipboard} variant="outline" className="h-8 px-3 shrink-0">
                  {copied ? <CheckCircle2 className="h-4 w-4 mr-1 text-green-600" /> : <Copy className="h-4 w-4 mr-1" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              
              <p className="text-xs text-slate-500 text-center max-w-xs">
                This link will automatically expire in {expiresIn} {expiresIn === 1 ? 'hour' : 'hours'}. You can revoke it anytime from the Shared Records tab.
              </p>
              
              <Button className="w-full mt-4" onClick={onClose} variant="ghost">Close</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
