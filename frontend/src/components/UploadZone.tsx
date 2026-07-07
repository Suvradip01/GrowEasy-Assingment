'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';
import type { FileRejection } from 'react-dropzone';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  isLoading?: boolean;
  currentFileName?: string | null;
  onClearFile?: () => void;
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default function UploadZone({
  onFileSelected,
  isLoading = false,
  currentFileName,
  onClearFile,
}: UploadZoneProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      setFileError(null);

      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setFileError('File exceeds 10MB limit.');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setFileError('Only CSV files are accepted.');
        } else {
          setFileError('Invalid file. Please upload a .csv file.');
        }
        return;
      }

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelected(file);
      }
    },
    [onFileSelected]
  );

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.csv'] },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    disabled: isLoading,
  });

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFile(null);
    setFileError(null);
    onClearFile?.();
  };

  const hasFile = selectedFile !== null;

  return (
    <div className="flex flex-col gap-2.5">
      <div
        {...getRootProps()}
        className={cn(
          'relative flex min-h-[190px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-border-default bg-bg-elevated px-8 py-10 text-center transition-all duration-250',
          'after:pointer-events-none after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,var(--color-brand-dim),transparent_70%)] after:opacity-0 after:transition-opacity after:duration-250',
          isDragActive && !isDragReject && 'border-brand bg-[rgba(249,115,22,0.04)] after:opacity-100 shadow-[0_0_0_3px_var(--color-brand-dim),var(--shadow-brand)]',
          (isDragReject || fileError) && 'border-error bg-[rgba(239,68,68,0.04)]',
          hasFile && 'cursor-default border-solid border-brand bg-brand-dim',
          isLoading && 'cursor-not-allowed opacity-55',
          !hasFile && !isDragActive && 'hover:border-brand hover:bg-[rgba(249,115,22,0.04)] hover:after:opacity-100'
        )}
      >
        <input {...getInputProps()} />

        <AnimatePresence mode="wait">
          {hasFile ? (
            <motion.div
              key="file-info"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25 }}
              className="relative z-[1] flex w-full max-w-[480px] items-center gap-4"
            >
              <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-[10px] border border-border-brand bg-brand-dim">
                <FileText size={32} className="text-brand" />
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-semibold text-text-primary">{selectedFile.name}</p>
                <p className="mt-0.5 text-xs text-text-muted">{formatBytes(selectedFile.size)}</p>
              </div>
              {!isLoading && (
                <button
                  onClick={handleClear}
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border-default bg-bg-elevated text-text-muted transition-all duration-150 hover:border-error hover:bg-[rgba(239,68,68,0.14)] hover:text-error"
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="relative z-[1] flex flex-col items-center gap-3.5"
            >
              <motion.div
                animate={isDragActive ? { scale: 1.15, y: -8 } : { scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="flex h-[68px] w-[68px] items-center justify-center rounded-2xl border-[1.5px] border-border-default bg-bg-card text-brand"
              >
                <Upload size={40} className="text-brand" />
              </motion.div>
              <div className="flex flex-col gap-1">
                <p className="text-[17px] font-bold tracking-tight text-text-primary">
                  {isDragActive ? 'Drop it here!' : 'Drag & Drop your CSV'}
                </p>
                <p className="text-sm text-text-secondary">
                  or{' '}
                  <span className="text-brand underline decoration-transparent transition-[text-decoration-color] duration-150 group-hover:decoration-brand">
                    browse files
                  </span>
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-full border border-border-brand bg-brand-dim px-2 py-0.5 text-[11px] font-semibold text-brand">
                  CSV
                </span>
                <span className="text-xs text-text-muted">Supported · Max 10MB</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {fileError && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 rounded-[10px] border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.07)] px-3.5 py-2 text-[13px] text-error"
          >
            <AlertCircle size={14} />
            <span>{fileError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
