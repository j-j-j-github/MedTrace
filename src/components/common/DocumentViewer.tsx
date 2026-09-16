import React, { useState, useRef, useEffect } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RefreshCw, 
  ExternalLink, 
  FileText, 
  Image as ImageIcon,
  Move
} from 'lucide-react';

interface DocumentViewerProps {
  url?: string | null;
  fileType?: string | null;
  fileName?: string;
  className?: string;
}

export function DocumentViewer({ url, fileType, fileName, className = '' }: DocumentViewerProps) {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isPdf = React.useMemo(() => {
    if (fileType === 'application/pdf') return true;
    if (!url) return false;
    const clean = url.split('?')[0].toLowerCase();
    return clean.endsWith('.pdf');
  }, [fileType, url]);

  // Reset zoom and position when URL changes
  useEffect(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setImgLoaded(false);
  }, [url]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.25, 0.4));
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.15 : 0.15;
      setScale((prev) => Math.min(Math.max(prev + delta, 0.4), 4));
    }
  };

  const handleDoubleClick = () => {
    if (scale === 1) {
      setScale(1.75);
    } else {
      handleReset();
    }
  };

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center h-full bg-slate-50 text-slate-400 p-6 ${className}`}>
        <FileText className="h-12 w-12 mb-3 text-slate-300 stroke-[1.5]" />
        <p className="text-sm font-medium text-slate-500">Document preview not available</p>
      </div>
    );
  }

  // --- PDF RENDERING ---
  if (isPdf) {
    return (
      <div 
        className={`relative flex flex-col w-full h-full bg-slate-900 ${className}`}
        ref={containerRef}
      >
        {/* PDF Quick-Actions Bar */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 text-slate-200 border-b border-slate-800 text-xs select-none z-10 shrink-0">
          <div className="flex items-center gap-2 font-medium truncate">
            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold tracking-wide">
              PDF
            </span>
            <span className="truncate text-slate-300">{fileName || 'Medical Document'}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors"
              title="Open full PDF in new tab"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Open in new tab</span>
            </a>
          </div>
        </div>
        
        <iframe 
          src={`${url}#toolbar=1&navpanes=0&view=FitH`} 
          className="w-full flex-1 border-0" 
          title={fileName || 'PDF Document Preview'} 
        />
      </div>
    );
  }

  // --- IMAGE RENDERING ---
  return (
    <div 
      className={`relative flex flex-col w-full h-full bg-slate-950 overflow-hidden select-none ${className}`}
      ref={containerRef}
    >
      {/* Top Floating Control Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 text-slate-200 z-20 shadow-md shrink-0">
        
        {/* Left: Document indicator */}
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wide flex items-center gap-1 shrink-0">
            <ImageIcon className="h-2.5 w-2.5" />
            PHOTO
          </span>
          <span className="truncate text-xs font-medium text-slate-300 max-w-[140px] sm:max-w-xs">
            {fileName || 'Scanned Document'}
          </span>
        </div>

        {/* Center: Interactive Viewer Controls */}
        <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 shadow-inner">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.4}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          
          <button
            onClick={handleReset}
            className="px-2 py-0.5 text-xs font-semibold rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors min-w-[52px] text-center"
            title="Click to reset zoom (Fit)"
          >
            {Math.round(scale * 100)}%
          </button>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-700 mx-0.5" />

          <button
            onClick={handleRotate}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Rotate Clockwise 90°"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Fit to Window"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 pl-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-100 text-xs transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Open</span>
          </a>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div 
        className={`relative flex-1 w-full h-full flex items-center justify-center overflow-hidden cursor-${
          isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default'
        } bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onDoubleClick={handleDoubleClick}
      >
        {/* Helper tooltip when zoomed in */}
        {scale > 1 && !isDragging && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900/80 backdrop-blur border border-slate-700/60 rounded-full text-[11px] text-slate-300 flex items-center gap-1.5 pointer-events-none shadow-lg z-10 transition-opacity">
            <Move className="h-3 w-3 text-brand-400" />
            Click and drag to pan &bull; Double click to reset
          </div>
        )}

        {/* Image wrapper with smooth transform */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center p-4"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            transformOrigin: 'center center',
          }}
        >
          {!imgLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand-500 border-t-transparent" />
            </div>
          )}
          <img
            src={url}
            alt={fileName || 'Medical document preview'}
            onLoad={() => setImgLoaded(true)}
            className={`max-w-[90vw] max-h-[70vh] sm:max-w-[85%] sm:max-h-[85%] object-contain rounded-lg shadow-2xl transition-opacity duration-300 pointer-events-none ${
              imgLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </div>

      {/* Bottom Bar status */}
      <div className="flex items-center justify-between px-3 py-1 bg-slate-900/95 border-t border-slate-800/80 text-[11px] text-slate-400 z-20 shrink-0">
        <div>
          {rotation !== 0 && `Rotated ${rotation}° • `}
          {scale !== 1 ? `Zoomed: ${Math.round(scale * 100)}%` : 'Fitted to screen'}
        </div>
        <div className="hidden sm:block text-slate-500">
          Double-click to {scale === 1 ? 'zoom in' : 'reset'}
        </div>
      </div>
    </div>
  );
}
