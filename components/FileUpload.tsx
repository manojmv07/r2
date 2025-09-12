
import React, { useState, useCallback } from 'react';
import { parseFile } from '../services/fileParser';
import Icon from './Icon';
import type { ParsedFile } from '../types';

interface FileUploadProps {
    onFilesParsed: (files: ParsedFile[]) => void;
    updateProgress: (value: number | ((prev: number) => number)) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesParsed, updateProgress }) => {
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    const handleFiles = useCallback(async (files: FileList) => {
        if (!files || files.length === 0 || isParsing) return;
        
        setError(null);
        setIsParsing(true);
        updateProgress(0);

        try {
            updateProgress(10);
            const parsedFilePromises = Array.from(files).map(async (file) => {
                const { text, images } = await parseFile(file);
                return { name: file.name, text, images };
            });

            const parsedFiles = await Promise.all(parsedFilePromises);
            updateProgress(30);

            if (parsedFiles.some(f => !f.text.trim())) {
                throw new Error("One or more documents appear to be empty or could not be read.");
            }
            onFilesParsed(parsedFiles);

        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
            updateProgress(0);
        } finally {
            setIsParsing(false);
        }

    }, [onFilesParsed, updateProgress, isParsing]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files) {
            handleFiles(e.dataTransfer.files);
        }
    }, [handleFiles]);

    const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div
                onDrop={handleDrop}
                onDragEnter={handleDragEvents}
                onDragOver={handleDragEvents}
                onDragLeave={handleDragEvents}
                className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300 backdrop-blur-sm
                    ${isParsing ? 'cursor-not-allowed' : ''}
                    ${isDragging 
                        ? 'border-brand-cyan bg-brand-cyan/20' 
                        : 'border-brand-muted hover:border-brand-cyan/80 bg-brand-surface'}`
                }
            >
                <input
                    type="file"
                    id="file-upload"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                    disabled={isParsing}
                    multiple
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Icon name="upload" className="w-12 h-12 text-brand-cyan" />
                    <p className="text-xl font-semibold text-brand-text">
                        Drag & Drop Your Paper(s) Here
                    </p>
                    <p className="text-md text-brand-text-muted">or <span className="font-medium text-brand-cyan">click to browse</span></p>
                    <p className="text-sm text-brand-subtle">Supports single paper analysis or multi-paper synthesis (PDF, DOCX, TXT)</p>
                </div>
            </div>
            {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        </div>
    );
};

export default FileUpload;
