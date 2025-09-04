"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { FormField } from "./form-field";

export interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  loading?: boolean;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onFilesChange?: (files: File[]) => void;
  onUploadProgress?: (progress: number) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  preview?: boolean;
}

interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  error?: string;
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({ 
    label, 
    error, 
    helperText, 
    loading,
    accept,
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = 5,
    onFilesChange,
    onUploadProgress,
    disabled,
    required,
    className,
    preview = true,
    ...props 
  }, ref) => {
    const [files, setFiles] = React.useState<FileWithPreview[]>([]);
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      }
      return null;
    };

    const processFiles = (fileList: FileList | File[]) => {
      const newFiles: FileWithPreview[] = [];
      const fileArray = Array.from(fileList);

      for (let i = 0; i < fileArray.length; i++) {
        if (!multiple && files.length + newFiles.length >= 1) break;
        if (maxFiles && files.length + newFiles.length >= maxFiles) break;

        const file = fileArray[i] as FileWithPreview;
        const validationError = validateFile(file);
        
        if (validationError) {
          file.error = validationError;
        }

        if (preview && file.type.startsWith('image/')) {
          file.preview = URL.createObjectURL(file);
        }

        newFiles.push(file);
      }

      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles.filter(f => !f.error));
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true);
      } else if (e.type === "dragleave") {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      
      if (disabled || loading) return;
      
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processFiles(e.dataTransfer.files);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (e.target.files && e.target.files[0]) {
        processFiles(e.target.files);
      }
    };

    const removeFile = (index: number) => {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      onFilesChange?.(updatedFiles.filter(f => !f.error));
    };

    const openFileDialog = () => {
      if (!disabled && !loading) {
        inputRef.current?.click();
      }
    };

    React.useEffect(() => {
      return () => {
        // Clean up preview URLs
        files.forEach(file => {
          if (file.preview) {
            URL.revokeObjectURL(file.preview);
          }
        });
      };
    }, [files]);

    return (
      <FormField label={label} error={error} helperText={helperText} required={required}>
        <div ref={ref} className={cn("space-y-4", className)} {...props}>
          <div
            role="button"
            tabIndex={0}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer",
              dragActive && !disabled && !loading && "border-[var(--color-sanvi-primary-700)] bg-blue-50",
              !dragActive && "border-gray-300 hover:border-gray-400",
              disabled && "opacity-50 cursor-not-allowed",
              error && "border-red-300"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openFileDialog();
              }
            }}
          >
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              accept={accept}
              multiple={multiple}
              onChange={handleChange}
              disabled={disabled || loading}
            />
            
            <div className="text-center">
              {loading ? (
                <div className="flex flex-col items-center">
                  <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-[var(--color-sanvi-primary-700)] rounded-full mb-2"></div>
                  <p className="text-sm text-gray-600">Uploading...</p>
                </div>
              ) : (
                <>
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-[var(--color-sanvi-primary-700)]">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {accept ? `Accepted formats: ${accept}` : 'Any file type'}
                      {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div key={index} className={cn(
                  "flex items-center justify-between p-3 bg-gray-50 rounded-lg",
                  file.error && "bg-red-50 border border-red-200"
                )}>
                  <div className="flex items-center space-x-3">
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                        <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      {file.error && <p className="text-xs text-red-600">{file.error}</p>}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormField>
    );
  }
);

FileUpload.displayName = "FileUpload";

export { FileUpload };