'use client';

import { useState, useEffect } from 'react';
import { ClauseAnalysis } from '@/lib/ai/contract-analyzer';

interface FinalDraftViewProps {
    originalText: string;
    analysis: {
        clauses: ClauseAnalysis[];
    } | null;
}

export function FinalDraftView({ originalText, analysis }: FinalDraftViewProps) {
    const [finalText, setFinalText] = useState(originalText);

    useEffect(() => {
        if (!analysis || !originalText) {
            setFinalText(originalText);
            return;
        }

        // Apply accepted changes
        let text = originalText;

        // Sort clauses by length (descending) to avoid partial replacements issues
        // Only process accepted clauses
        const acceptedClauses = analysis.clauses
            .filter(c => c.redline_status === 'accepted' && c.suggested_alternative)
            .sort((a, b) => b.clause_text.length - a.clause_text.length);

        // Simple replacement strategy for MVP
        // Note: This assumes unique clause text. If a clause appears multiple times, 
        // this might replace all occurrences.
        acceptedClauses.forEach(clause => {
            if (text.includes(clause.clause_text)) {
                text = text.replace(clause.clause_text, clause.suggested_alternative);
            }
        });

        setFinalText(text);
    }, [originalText, analysis]);

    return (
        <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Final Draft Preview</h3>
            </div>
            <div className="flex-1 p-0 overflow-hidden">
                <textarea
                    className="w-full h-full p-4 font-mono text-sm text-gray-800 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-0 outline-none"
                    value={finalText}
                    onChange={(e) => setFinalText(e.target.value)}
                    placeholder="Final draft will appear here..."
                />
            </div>
        </div>
    );
}
