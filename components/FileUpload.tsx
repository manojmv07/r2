import React, { useState, useCallback } from 'react';
import { parseFile } from '../services/fileParser';
import Icon from './Icon';

interface FileUploadProps {
    onFileParsed: (text: string, images: string[], name: string) => void;
    updateProgress: (value: number | ((prev: number) => number)) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileParsed, updateProgress }) => {
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);

    const handleFile = useCallback(async (file: File) => {
        if (!file || isParsing) return;
        
        setError(null);
        setIsParsing(true);
        updateProgress(0);

        try {
            updateProgress(10);
            const { text: documentText, images } = await parseFile(file);
            updateProgress(30);

            if (!documentText.trim()) {
                throw new Error("The document appears to be empty or could not be read.");
            }
            onFileParsed(documentText, images, file.name);

        } catch (e: any) {
            setError(e.message || "An unknown error occurred.");
            updateProgress(0);
        } finally {
            setIsParsing(false);
        }

    }, [onFileParsed, updateProgress, isParsing]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, [handleFile]);

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
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
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
                />
                <div className="flex flex-col items-center justify-center space-y-4">
                    <Icon name="upload" className="w-12 h-12 text-brand-cyan" />
                    <p className="text-xl font-semibold text-brand-text">
                        Drag & Drop your paper here
                    </p>
                    <p className="text-md text-brand-text-muted">or <span className="font-medium text-brand-cyan">click to browse</span></p>
                    <p className="text-sm text-brand-subtle">Supports PDF, DOCX, TXT</p>
                </div>
            </div>
            {error && <p className="mt-4 text-center text-red-400">{error}</p>}
        </div>
    );
};

export default FileUpload;