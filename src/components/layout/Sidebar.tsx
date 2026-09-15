import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Clock, Share2, Upload } from 'lucide-react';
import { cn } from '../common/Button';

export function Sidebar() {
  const navItems = [
    { name: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { name: 'Medical Records', to: '/records', icon: FileText },
    { name: 'Timeline', to: '/timeline', icon: Clock },
    { name: 'Shared Records', to: '/shared', icon: Share2 },
    { name: 'Upload / Scan', to: '/upload', icon: Upload },
  ];

  return (
    <aside className="flex h-full w-64 flex-col border-r border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="flex-1 overflow-y-auto py-8 px-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
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
    </aside>
  );
}
