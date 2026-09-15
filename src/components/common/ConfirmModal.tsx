import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 animate-in zoom-in-95 duration-200">
        <button
          onClick={onCancel}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="pt-1">
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={onCancel} className="text-slate-600 hover:bg-slate-50">
            {cancelText}
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 focus:ring-red-500 border-none">
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
