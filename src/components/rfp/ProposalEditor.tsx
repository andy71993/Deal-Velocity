'use client';

import { useState } from 'react';
import { RFPRequirement, ProposalSection, EvaluatorSimulation } from '@/types/rfp';
import { EvaluatorScorecard } from './EvaluatorScorecard';

interface ProposalEditorProps {
    requirement: RFPRequirement;
    projectId: string;
}

export function ProposalEditor({ requirement, projectId }: ProposalEditorProps) {
    const [content, setContent] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const [sectionId, setSectionId] = useState<string | null>(null);
    const [simulation, setSimulation] = useState<EvaluatorSimulation | null>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('/api/rfp/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requirement: requirement.req_text,
                    projectId,
                    requirementId: requirement.id,
                    sectionTitle: `Response to ${requirement.req_type}`
                }),
            });

            if (!response.ok) throw new Error('Generation failed');

            const section: ProposalSection = await response.json();
            setContent(section.content);
            setSectionId(section.id);
        } catch (error) {
            console.error('Error generating proposal:', error);
            alert('Failed to generate proposal');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSimulate = async () => {
        if (!content || !sectionId) return;

        setIsSimulating(true);
        try {
            const response = await fetch('/api/rfp/simulate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requirement: requirement.req_text,
                    proposalText: content,
                    persona: 'technical_lead',
                    proposalSectionId: sectionId
                }),
            });

            if (!response.ok) throw new Error('Simulation failed');

            const result: EvaluatorSimulation = await response.json();
            setSimulation(result);
        } catch (error) {
            console.error('Error simulating evaluation:', error);
            alert('Failed to simulate evaluation');
        } finally {
            setIsSimulating(false);
        }
    };

    return (
        <div className="flex flex-col h-full gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">Requirement</h3>
                <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{requirement.req_text}</p>
            </div>

            <div className="flex-1 flex gap-4 min-h-0">
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Response Draft</h3>
                        <div className="flex gap-2">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isGenerating ? 'Drafting...' : 'Auto-Draft with AI'}
                            </button>
                            <button
                                onClick={handleSimulate}
                                disabled={isSimulating || !content || !sectionId}
                                className="text-sm px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                            >
                                {isSimulating ? 'Simulating...' : 'Simulate Score'}
                            </button>
                        </div>
                    </div>
                    <textarea
                        className="flex-1 w-full p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Write your response here or generate a draft..."
                    />
                </div>

                {simulation && (
                    <div className="w-80 overflow-y-auto">
                        <EvaluatorScorecard simulation={simulation} />
                    </div>
                )}
            </div>
        </div>
    );
}
