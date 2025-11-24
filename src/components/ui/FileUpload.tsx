'use client';

import { useState, useRef } from 'react';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    label?: string;
    isLoading?: boolean;
}

export function FileUpload({
    onFileSelect,
    accept = ".pdf,.docx,.txt,.md",
    label = "Upload Contract or RFP",
    isLoading = false
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

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

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const onButtonClick = () => {
        inputRef.current?.click();
    };

    return (
        <div
            className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors ${dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={!isLoading ? onButtonClick : undefined}
        >
            <input
                ref={inputRef}
                className="hidden"
                type="file"
                accept={accept}
                onChange={handleChange}
                disabled={isLoading}
            />

            <div className="text-center">
                {isLoading ? (
                    <p className="text-sm text-gray-500">Processing file...</p>
                ) : (
                    <>
                        <p className="text-sm font-medium text-gray-700">{label}</p>
                        <p className="text-xs text-gray-500 mt-1">Drag & drop or click to browse</p>
                        <p className="text-xs text-gray-400 mt-1">Supports PDF, DOCX, TXT</p>
                    </>
                )}
            </div>
        </div>
    );
}
