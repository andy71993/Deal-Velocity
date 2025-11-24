'use client';

import { EvaluatorSimulation } from '@/types/rfp';
import { RiskMeter } from '@/components/contracts/RiskMeter';

interface EvaluatorScorecardProps {
    simulation: EvaluatorSimulation;
}

export function EvaluatorScorecard({ simulation }: EvaluatorScorecardProps) {
    return (
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="font-bold text-gray-900">Evaluator Simulation</h3>
                    <p className="text-sm text-gray-500 capitalize">
                        Persona: {simulation.evaluator_persona.replace('_', ' ')}
                    </p>
                </div>
                <RiskMeter score={simulation.simulated_score} size="md" />
            </div>

            <div className="space-y-4">
                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Feedback</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                        {simulation.feedback}
                    </p>
                </div>

                <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-1">Suggested Improvements</h4>
                    <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100">
                        {simulation.improvement_suggestions}
                    </p>
                </div>
            </div>
        </div>
    );
}
