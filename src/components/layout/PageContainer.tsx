import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Plus, Camera, Upload } from 'lucide-react';

export function PageContainer() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

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

          {/* Floating Action Button */}
          <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex flex-col items-end space-y-3">
            {fabOpen && (
              <div className="flex flex-col items-end space-y-3 animate-fade-in">
                <button
                  onClick={() => { navigate('/upload'); setFabOpen(false); }}
                  className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-slate-700 shadow-lg border border-slate-100 hover:bg-white hover:text-brand-600 transition-colors"
                >
                  <span className="bg-slate-100 p-1.5 rounded-full"><Camera className="h-4 w-4" /></span>
                  Scan Document
                </button>
                <button
                  onClick={() => { navigate('/upload?mode=file'); setFabOpen(false); }}
                  className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md px-4 py-2.5 text-sm font-medium text-slate-700 shadow-lg border border-slate-100 hover:bg-white hover:text-brand-600 transition-colors"
                >
                  <span className="bg-slate-100 p-1.5 rounded-full"><Upload className="h-4 w-4" /></span>
                  Upload File
                </button>
              </div>
            )}
            <button
              onClick={() => setFabOpen(!fabOpen)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-[0_8px_30px_rgb(37,99,235,0.4)] hover:bg-brand-700 hover:shadow-[0_8px_30px_rgb(37,99,235,0.6)] transition-all duration-300"
            >
              <Plus className={`h-6 w-6 transition-transform duration-300 ${fabOpen ? 'rotate-45' : ''}`} />
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
