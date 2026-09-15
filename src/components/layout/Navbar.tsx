import React, { useState, useRef, useEffect } from 'react';
import { HeartPulse, Menu, User, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/auth';

export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || 'Patient';
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md px-4 sm:px-6 shadow-sm">
      <div className="flex items-center">
        <button
          type="button"
          className="mr-4 -ml-2 rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden transition-colors"
          onClick={onMenuClick}
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2 text-brand-600">
          <HeartPulse className="h-7 w-7" />
          <span className="text-xl font-bold tracking-tight text-slate-900">MedTrace</span>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full transition-colors focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600 ring-2 ring-white shadow-sm">
              <User className="h-5 w-5" />
            </div>
            <span className="hidden sm:inline-block text-sm font-medium text-slate-700 ml-1">{userName}</span>
            <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 z-50">
              <div className="px-4 py-2 border-b border-slate-50 sm:hidden">
                <p className="text-sm font-medium text-slate-900">{userName}</p>
              </div>
              <button
                onClick={() => authService.signOut()}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
