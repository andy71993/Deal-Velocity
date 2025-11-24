'use client';

import { useState } from 'react';
import { RFPRequirement } from '@/types/rfp';
import { RequirementList } from './RequirementList';
import { ProposalEditor } from './ProposalEditor';

import { FileUpload } from '@/components/ui/FileUpload';

export function RFPResponder() {
    const [rfpText, setRfpText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [requirements, setRequirements] = useState<RFPRequirement[]>([]);
    const [selectedReq, setSelectedReq] = useState<RFPRequirement | null>(null);

    // Placeholder project ID for now
    const projectId = '00000000-0000-0000-0000-000000000000';

    const handleFileSelect = async (file: File) => {
        setIsProcessingFile(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/documents/parse', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) throw new Error('Failed to process file');

            const data = await response.json();
            if (data.full_text) {
                setRfpText(data.full_text);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Failed to process file. Please try again.');
        } finally {
            setIsProcessingFile(false);
        }
    };

    const handleParse = async () => {
        if (!rfpText.trim()) return;

        setIsParsing(true);
        try {
            const response = await fetch('/api/rfp/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    rfpText,
                    projectId
                }),
            });

            if (!response.ok) throw new Error('Parsing failed');

            const result = await response.json();
            setRequirements(result);
            if (result.length > 0) setSelectedReq(result[0]);
        } catch (error) {
            console.error('Error parsing RFP:', error);
            alert('Failed to parse RFP');
        } finally {
            setIsParsing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-100px)]">
            {/* Left: RFP Input & Requirements */}
            <div className="lg:col-span-4 flex flex-col gap-4 h-full">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-[300px]">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">RFP Document</h2>

                    <div className="mb-2">
                        <FileUpload
                            onFileSelect={handleFileSelect}
                            isLoading={isProcessingFile}
                            label="Upload RFP (PDF/DOCX)"
                        />
                    </div>

                    <textarea
                        className="flex-1 w-full p-3 border border-gray-300 rounded-lg text-xs resize-none mb-2"
                        placeholder="Or paste RFP text here..."
                        value={rfpText}
                        onChange={(e) => setRfpText(e.target.value)}
                        disabled={isParsing || isProcessingFile}
                    />
                    <button
                        onClick={handleParse}
                        disabled={isParsing || isProcessingFile || !rfpText.trim()}
                        className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                    >
                        {isParsing ? 'Extracting Requirements...' : 'Parse RFP'}
                    </button>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col min-h-0">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Requirements ({requirements.length})</h2>
                    <div className="flex-1 overflow-y-auto pr-2">
                        {requirements.length > 0 ? (
                            <RequirementList
                                requirements={requirements}
                                onSelect={setSelectedReq}
                                selectedId={selectedReq?.id}
                            />
                        ) : (
                            <div className="text-center text-gray-400 mt-10 text-sm">
                                No requirements extracted yet.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Right: Proposal Editor */}
            <div className="lg:col-span-8 h-full">
                {selectedReq ? (
                    <ProposalEditor requirement={selectedReq} projectId={projectId} />
                ) : (
                    <div className="h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <p className="text-lg font-medium">Select a Requirement</p>
                            <p className="text-sm">Choose a requirement from the list to start drafting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
