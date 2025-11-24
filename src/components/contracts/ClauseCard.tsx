'use client';

import { ClauseAnalysis } from '@/lib/ai/contract-analyzer';
import { RiskMeter } from './RiskMeter';
import { FeedbackForm } from './FeedbackForm';

interface ClauseCardProps {
    clause: ClauseAnalysis & { id?: string; risk_analysis_id?: string };
    onStatusChange?: (clause: ClauseAnalysis, status: 'accepted' | 'rejected') => void;
    onSuggestionChange?: (clause: ClauseAnalysis, newText: string) => void;
}

export function ClauseCard({ clause, onStatusChange, onSuggestionChange }: ClauseCardProps) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'critical': return 'bg-red-50 border-red-200 text-red-800';
            case 'high': return 'bg-orange-50 border-orange-200 text-orange-800';
            case 'medium': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
            default: return 'bg-green-50 border-green-200 text-green-800';
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{clause.clause_type}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full uppercase font-bold ${getRiskColor(clause.risk_level)}`}>
                            {clause.risk_level} Risk
                        </span>
                    </div>
                    <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded border border-gray-100">
                        &quot;{clause.clause_text}&quot;
                    </p>
                </div>
                <div className="ml-4">
                    <RiskMeter score={clause.risk_score} size="md" />
                </div>
            </div>

            {/* Risk explanation */}
            <div className={`p-3 rounded-md text-sm mb-3 ${getRiskColor(clause.risk_level)}`}>
                <strong>Risk:</strong> {clause.risk_description}
            </div>

            {/* Suggested alternative */}
            {clause.suggested_alternative && (
                <div className="mt-4">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold text-gray-700">Suggested Alternative:</h4>
                        <span className="text-xs text-gray-400 italic">Editable</span>
                    </div>
                    <textarea
                        className="w-full p-3 bg-green-50 border border-green-200 rounded text-sm text-gray-800 focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y font-mono"
                        value={clause.suggested_alternative}
                        onChange={(e) => onSuggestionChange?.(clause, e.target.value)}
                        rows={Math.max(3, Math.min(10, clause.suggested_alternative.split('\n').length))}
                    />
                </div>
            )}

            {/* Accept/Reject Actions */}
            {clause.suggested_alternative && clause.suggested_alternative !== clause.clause_text && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                            Status: <span className={`font-semibold ${clause.redline_status === 'accepted' ? 'text-green-600' :
                                clause.redline_status === 'rejected' ? 'text-red-600' :
                                    'text-gray-500'
                                }`}>
                                {clause.redline_status === 'accepted' ? '✓ Change Accepted' :
                                    clause.redline_status === 'rejected' ? '✗ Keeping Original' :
                                        '⏸ Pending Review'}
                            </span>
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => onStatusChange?.(clause, 'accepted')}
                                disabled={clause.redline_status === 'accepted'}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${clause.redline_status === 'accepted'
                                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                ✓ Accept Change
                            </button>
                            <button
                                onClick={() => onStatusChange?.(clause, 'rejected')}
                                disabled={clause.redline_status === 'rejected'}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${clause.redline_status === 'rejected'
                                    ? 'bg-red-100 text-red-700 cursor-not-allowed'
                                    : 'bg-red-600 text-white hover:bg-red-700'
                                    }`}
                            >
                                ✗ Keep Original
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback buttons */}
            {clause.id && (
                <FeedbackForm clauseId={clause.id} riskAnalysisId={clause.risk_analysis_id} />
            )}
        </div>
    );
}
