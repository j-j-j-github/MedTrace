import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation } from 'react-router-dom';

export function PageContainer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen flex-col bg-slate-50 overflow-hidden">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-50 bg-slate-900/40 lg:hidden backdrop-blur-md transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-72 transform bg-white/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden flex flex-col ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="flex h-16 items-center px-6 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2 text-brand-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/></svg>
              <span className="text-xl font-bold tracking-tight text-slate-900">MedTrace</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar onItemClick={() => setSidebarOpen(false)} />
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:block h-full z-10 shadow-sm relative">
          <Sidebar />
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto w-full bg-slate-50/50 relative">
          <div key={location.pathname} className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8 animate-page pb-24">
            <Outlet />
          </div>

        </main>
      </div>
    </div>
  );
}
