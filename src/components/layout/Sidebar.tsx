import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Clock, Share2, Upload, HeartPulse, Camera } from 'lucide-react';
import { cn } from '../common/Button';

interface SidebarProps {
  onItemClick?: () => void;
}

export function Sidebar({ onItemClick }: SidebarProps) {
  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'My Health', to: '/my-health', icon: HeartPulse },
    { name: 'Medical Records', to: '/records', icon: FileText },
    { name: 'Timeline', to: '/timeline', icon: Clock },
    { name: 'Shared Records', to: '/shared', icon: Share2 },
    { name: 'Upload / Scan', to: '/upload', icon: Upload },
  ];

  return (
    <aside className="flex h-full w-full lg:w-64 flex-col bg-slate-50 shadow-[var(--shadow-neu-flat)] z-10 relative">
      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            onClick={onItemClick}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all',
                isActive
                  ? 'bg-brand-50/80 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:shadow-[var(--shadow-neu-flat)] hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                    isActive ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 bg-slate-50 space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-1 mb-2">Quick Actions</p>
        <NavLink
          to="/upload?mode=camera"
          onClick={onItemClick}
          className="flex items-center justify-center gap-2 w-full bg-brand-600 hover:bg-brand-700 text-white rounded-full py-2.5 px-4 text-sm font-medium transition-all shadow-[var(--shadow-neu-brand)] active:shadow-[var(--shadow-neu-brand-pressed)]"
        >
          <Camera className="h-4 w-4" />
          Take Photo
        </NavLink>
        <NavLink
          to="/upload?mode=file"
          onClick={onItemClick}
          className="flex items-center justify-center gap-2 w-full bg-slate-50 text-slate-700 rounded-full py-2.5 px-4 text-sm font-medium transition-all shadow-[var(--shadow-neu-flat)] active:shadow-[var(--shadow-neu-pressed)]"
        >
          <Upload className="h-4 w-4" />
          Upload Document
        </NavLink>
      </div>
    </aside>
  );
}
