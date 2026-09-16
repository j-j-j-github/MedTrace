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
            className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden backdrop-blur-sm transition-opacity" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Mobile sidebar */}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white/90 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:hidden ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}`}>
          <div className="flex h-full flex-col pt-16">
            <Sidebar />
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
