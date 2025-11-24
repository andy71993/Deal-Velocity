'use client';

import { useState } from 'react';
import { ClauseAnalysis } from '@/lib/ai/contract-analyzer';
import { RiskDashboard } from './RiskDashboard';
import { ClauseCard } from './ClauseCard';
import { FinalDraftView } from './FinalDraftView';
import { FileUpload } from '@/components/ui/FileUpload';
import { ChevronLeft, ChevronRight, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from 'lucide-react';

export function ContractAnalyzer() {
    const [contractText, setContractText] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isProcessingFile, setIsProcessingFile] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [analysis, setAnalysis] = useState<{
        clauses: ClauseAnalysis[];
        overall_risk_score: number;
        processing_time: number;
    } | null>(null);

    // Layout state
    const [showOriginal, setShowOriginal] = useState(true);
    const [showFinalDraft, setShowFinalDraft] = useState(true);

    const handleStatusChange = (clause: ClauseAnalysis, status: 'accepted' | 'rejected') => {
        if (!analysis) return;

        setAnalysis({
            ...analysis,
            clauses: analysis.clauses.map(c =>
                c.clause_text === clause.clause_text
                    ? { ...c, redline_status: status }
                    : c
            )
        });
    };

    const handleSuggestionChange = (clause: ClauseAnalysis, newText: string) => {
        if (!analysis) return;

        setAnalysis({
            ...analysis,
            clauses: analysis.clauses.map(c =>
                c.clause_text === clause.clause_text
                    ? { ...c, suggested_alternative: newText }
                    : c
            )
        });
    };

    const handleExportRedlines = async () => {
        if (!analysis || !contractText) return;

        setIsExporting(true);
        try {
            // Only export ACCEPTED changes
            const changes = analysis.clauses
                .filter(c => c.redline_status === 'accepted' &&
                    c.suggested_alternative &&
                    c.suggested_alternative !== c.clause_text &&
                    c.suggested_alternative.trim().length > 0)
                .map(c => ({
                    original: c.clause_text,
                    new: c.suggested_alternative
                }));

            const acceptedCount = analysis.clauses.filter(c => c.redline_status === 'accepted').length;
            const totalChanges = analysis.clauses.filter(c =>
                c.suggested_alternative && c.suggested_alternative !== c.clause_text
            ).length;

            console.log(`Exporting ${changes.length} accepted redlines (${acceptedCount} of ${totalChanges} changes accepted)`);

            if (changes.length === 0) {
                alert('No changes have been accepted yet. Please review and accept the changes you want to export.');
                setIsExporting(false);
                return;
            }

            const response = await fetch('/api/contracts/redline', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalText: contractText,
                    changes: changes
                }),
            });

            if (!response.ok) throw new Error('Export failed');

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'redlined_contract.docx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

        } catch (error) {
            console.error('Error exporting redlines:', error);
            alert('Failed to export redlines.');
        } finally {
            setIsExporting(false);
        }
    };

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
                setContractText(data.full_text);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            alert('Failed to process file. Please try again.');
        } finally {
            setIsProcessingFile(false);
        }
    };

    const handleAnalyze = async () => {
        if (!contractText.trim()) return;

        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/contracts/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contractText,
                    contractId: '00000000-0000-0000-0000-000000000000'
                }),
            });

            if (!response.ok) throw new Error('Analysis failed');

            const result = await response.json();
            setAnalysis(result);
            // Auto-open final draft view on analysis complete
            setShowFinalDraft(true);
        } catch (error) {
            console.error('Error analyzing contract:', error);
            alert('Failed to analyze contract. Please check your API key and try again.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Calculate grid columns based on visibility
    const getGridCols = () => {
        if (showOriginal && showFinalDraft) return 'grid-cols-12'; // 3-col: 3-6-3
        if (showOriginal || showFinalDraft) return 'grid-cols-12'; // 2-col: 5-7 or 7-5
        return 'grid-cols-1'; // 1-col: full width analysis
    };

    return (
        <div className="flex flex-col h-[calc(100vh-100px)]">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4 px-1">
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowOriginal(!showOriginal)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showOriginal ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {showOriginal ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
                        {showOriginal ? 'Hide Original' : 'Show Original'}
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFinalDraft(!showFinalDraft)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showFinalDraft ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {showFinalDraft ? 'Hide Final Draft' : 'Show Final Draft'}
                        {showFinalDraft ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                    </button>
                </div>
            </div>

            <div className={`grid ${getGridCols()} gap-4 h-full overflow-hidden`}>

                {/* Left Panel: Original Contract */}
                {showOriginal && (
                    <div className={`${showFinalDraft ? 'col-span-3' : 'col-span-5'} flex flex-col h-full overflow-hidden transition-all duration-300`}>
                        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex-1 flex flex-col h-full overflow-hidden">
                            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Original Contract</h2>

                            {!analysis && (
                                <div className="mb-4">
                                    <FileUpload
                                        onFileSelect={handleFileSelect}
                                        isLoading={isProcessingFile}
                                        label="Upload Contract"
                                    />
                                </div>
                            )}

                            <textarea
                                className="flex-1 w-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                                placeholder="Paste contract text here..."
                                value={contractText}
                                onChange={(e) => setContractText(e.target.value)}
                                disabled={isAnalyzing || isProcessingFile}
                            />

                            {!analysis && (
                                <div className="mt-4">
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing || isProcessingFile || !contractText.trim()}
                                        className={`w-full px-6 py-2 rounded-lg font-medium text-white transition-colors ${isAnalyzing || isProcessingFile || !contractText.trim()
                                            ? 'bg-blue-300 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                    >
                                        {isAnalyzing ? 'Analyzing...' : 'Analyze Risks'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Middle Panel: Analysis (Always Visible) */}
                <div className={`${!showOriginal && !showFinalDraft ? 'col-span-12' :
                    showOriginal && showFinalDraft ? 'col-span-6' : 'col-span-7'
                    } flex flex-col h-full overflow-hidden transition-all duration-300`}>

                    {analysis ? (
                        <div className="flex flex-col gap-4 h-full overflow-y-auto pr-2 pb-4">
                            <RiskDashboard analysis={analysis} />

                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900">Clause Analysis ({analysis.clauses.length})</h3>
                                <button
                                    onClick={handleExportRedlines}
                                    disabled={isExporting}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    {isExporting ? 'Exporting...' : 'Export Redlines'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {analysis.clauses.map((clause, idx) => (
                                    <ClauseCard
                                        key={idx}
                                        clause={clause}
                                        onStatusChange={handleStatusChange}
                                        onSuggestionChange={handleSuggestionChange}
                                    />
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <p className="text-lg font-medium">AI Risk Analysis</p>
                                <p className="text-sm">Upload a contract to see analysis here</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Panel: Final Draft */}
                {showFinalDraft && (
                    <div className={`${showOriginal ? 'col-span-3' : 'col-span-5'} flex flex-col h-full overflow-hidden transition-all duration-300`}>
                        <FinalDraftView
                            originalText={contractText}
                            analysis={analysis}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
