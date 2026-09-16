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

          <div 
            className={`absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-lg border border-slate-100 py-2 z-50 transition-all duration-200 origin-top-right
              ${isProfileOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
          >
            <div className="px-4 py-3 border-b border-slate-50 mb-1">
              <p className="text-sm font-semibold text-slate-900">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            
            <a href="/profile" className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <User className="h-4 w-4 text-slate-400" />
              <span>My Profile</span>
            </a>
            
            <a href="/settings" className="flex w-full items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-slate-400"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>Settings</span>
            </a>
            
            <div className="h-px bg-slate-100 my-1 mx-2"></div>

            <button
              onClick={() => authService.signOut()}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
