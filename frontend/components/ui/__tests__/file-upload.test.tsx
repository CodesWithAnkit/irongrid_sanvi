import { render, screen, fireEvent } from '@testing-library/react';
import { FileUpload } from '../file-upload';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('FileUpload Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with label', () => {
    render(<FileUpload label="Upload Files" />);
    expect(screen.getByText('Upload Files')).toBeInTheDocument();
  });

  it('displays error message', () => {
    render(<FileUpload label="Upload" error="File too large" />);
    expect(screen.getByText('File too large')).toBeInTheDocument();
  });

  it('shows upload area with correct text', () => {
    render(<FileUpload />);
    expect(screen.getByText('Click to upload')).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/)).toBeInTheDocument();
  });

  it('handles file selection', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it('validates file size', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload maxSize={1024} onFilesChange={onFilesChange} />);
    
    const largeFile = new File(['x'.repeat(2048)], 'large.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [largeFile],
      writable: false,
    });
    
    fireEvent.change(input);
    expect(onFilesChange).toHaveBeenCalledWith([]);
  });

  it('respects maxFiles limit', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload maxFiles={2} multiple onFilesChange={onFilesChange} />);
    
    const files = [
      new File(['1'], 'file1.txt', { type: 'text/plain' }),
      new File(['2'], 'file2.txt', { type: 'text/plain' }),
      new File(['3'], 'file3.txt', { type: 'text/plain' }),
    ];
    
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: files,
      writable: false,
    });
    
    fireEvent.change(input);
    expect(onFilesChange).toHaveBeenCalledWith([files[0], files[1]]);
  });

  it('handles drag and drop', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} />);
    
    const dropArea = screen.getByRole('button');
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.dragEnter(dropArea);
    expect(dropArea).toHaveClass('border-[var(--color-sanvi-primary-700)]');
    
    fireEvent.drop(dropArea, {
      dataTransfer: {
        files: [file],
      },
    });
    
    expect(onFilesChange).toHaveBeenCalledWith([file]);
  });

  it('shows loading state', () => {
    render(<FileUpload loading />);
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('displays file list after upload', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    expect(screen.getByText('test.txt')).toBeInTheDocument();
  });

  it('allows file removal', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload onFilesChange={onFilesChange} />);
    
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });
    
    fireEvent.change(input);
    
    const removeButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')?.getAttribute('viewBox') === '0 0 24 24'
    );
    
    if (removeButton) {
      fireEvent.click(removeButton);
      expect(onFilesChange).toHaveBeenLastCalledWith([]);
    }
  });

  it('creates preview for image files', () => {
    const onFilesChange = vi.fn();
    render(<FileUpload preview onFilesChange={onFilesChange} />);
    
    const imageFile = new File(['image'], 'image.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    Object.defineProperty(input, 'files', {
      value: [imageFile],
      writable: false,
    });
    
    fireEvent.change(input);
    
    expect(global.URL.createObjectURL).toHaveBeenCalledWith(imageFile);
  });

  it('disables interaction when disabled', () => {
    render(<FileUpload disabled />);
    
    const dropArea = screen.getByRole('button');
    expect(dropArea).toHaveClass('opacity-50', 'cursor-not-allowed');
  });
});