import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Camera } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../common/Card';
import { Button } from '../common/Button';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Button 
          className="h-24 flex-col gap-2 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:text-brand-800 border border-brand-200" 
          variant="ghost"
          onClick={() => navigate('/upload?mode=file')}
        >
          <Upload className="h-6 w-6" />
          <span>Upload Document</span>
        </Button>
        <Button 
          className="h-24 flex-col gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200" 
          variant="ghost"
          onClick={() => navigate('/upload')}
        >
          <Camera className="h-6 w-6" />
          <span>Scan Document</span>
        </Button>
      </CardContent>
    </Card>
  );
}
