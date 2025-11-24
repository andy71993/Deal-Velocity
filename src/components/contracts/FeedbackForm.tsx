'use client';

import { useState } from 'react';
import { UserFeedback } from '@/types/contract';

interface FeedbackFormProps {
    clauseId: string;
    riskAnalysisId?: string;
}

export function FeedbackForm({ clauseId, riskAnalysisId }: FeedbackFormProps) {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const submitFeedback = async (type: UserFeedback['feedback_type']) => {
        setLoading(true);
        try {
            const rating = type === 'accurate' || type === 'helpful' ? 5 : 1;

            const feedback: UserFeedback = {
                clause_id: clauseId,
                risk_analysis_id: riskAnalysisId,
                feedback_type: type,
                rating,
            };

            await fetch('/api/contracts/feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(feedback),
            });

            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting feedback:', error);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return <div className="text-xs text-green-600 mt-2">Thanks for your feedback!</div>;
    }

    return (
        <div className="flex gap-2 mt-3">
            <button
                onClick={() => submitFeedback('accurate')}
                disabled={loading}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
                👍 Accurate
            </button>
            <button
                onClick={() => submitFeedback('helpful')}
                disabled={loading}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
                ✓ Helpful
            </button>
            <button
                onClick={() => submitFeedback('not_helpful')}
                disabled={loading}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            >
                ✗ Not Helpful
            </button>
        </div>
    );
}
