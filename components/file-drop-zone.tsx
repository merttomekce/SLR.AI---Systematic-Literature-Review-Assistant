'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFilesDrop: (files: FileList) => void;
  accept?: string;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
  overlayClassName?: string;
  label?: string;
}

export function FileDropZone({
  onFilesDrop,
  accept,
  disabled,
  children,
  className,
  overlayClassName,
  label = "Drop here to load"
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Basic validation if 'accept' is provided
      if (accept) {
        const acceptedTypes = accept.split(',').map(t => t.trim());
        const isValid = Array.from(files).every(file => {
          const extension = '.' + file.name.split('.').pop()?.toLowerCase();
          return acceptedTypes.some(type => {
            if (type.startsWith('.')) return extension === type.toLowerCase();
            if (type.includes('/*')) {
              const baseType = type.split('/')[0];
              return file.type.startsWith(baseType + '/');
            }
            return file.type === type;
          });
        });

        if (!isValid) {
          // We let the parent handle the error message if needed, but we can filter here
          return;
        }
      }
      onFilesDrop(files);
    }
  }, [disabled, accept, onFilesDrop]);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "relative transition-all duration-300", 
        isDragging && "overflow-hidden",
        className
      )}
    >
      {children}
      
      {/* Drop Overlay */}
      <div
        className={cn(
          "absolute inset-0 z-50 flex flex-col items-center justify-center transition-all duration-300 pointer-events-none rounded-[inherit] border-2 border-dashed border-primary/50 bg-background/80 backdrop-blur-xl opacity-0 scale-95",
          isDragging && "opacity-100 scale-100",
          overlayClassName
        )}
      >
        <div className="bg-primary/20 p-4 rounded-full mb-4 animate-bounce shadow-[0_0_20px_rgba(var(--primary),0.3)]">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-foreground drop-shadow-md">
          {label}
        </p>
      </div>
    </div>
  );
}
