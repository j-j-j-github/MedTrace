import React from 'react';
import { Card, CardContent } from '../common/Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  onClick?: () => void;
}

export function StatCard({ title, value, icon, description, onClick }: StatCardProps) {
  return (
    <Card 
      onClick={onClick} 
      className={onClick ? "cursor-pointer transition-all hover:border-brand-200 hover:shadow-md active:scale-[0.98]" : ""}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="tracking-tight text-sm font-medium text-slate-500">{title}</p>
          <div className="h-4 w-4 text-brand-600 opacity-80">{icon}</div>
        </div>
        <div className="flex flex-col">
          <div className="text-2xl font-bold text-slate-900">{value}</div>
          {description && (
            <p className="text-xs text-slate-500 mt-1">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
