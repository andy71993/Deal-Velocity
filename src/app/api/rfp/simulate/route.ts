import { NextRequest, NextResponse } from 'next/server';
import { EvaluatorAgent } from '@/lib/ai/evaluator-agent';
import { saveSimulation } from '@/lib/db/rfp-queries';

export async function POST(request: NextRequest) {
    try {
        const { requirement, proposalText, persona, proposalSectionId } = await request.json();

        if (!requirement || !proposalText || !proposalSectionId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        const agent = new EvaluatorAgent(apiKey);
        const simulation = await agent.simulateEvaluation(
            requirement,
            proposalText,
            persona || 'technical_lead'
        );

        const savedSimulation = await saveSimulation({
            proposal_section_id: proposalSectionId,
            ...simulation
        });

        return NextResponse.json(savedSimulation);
    } catch (error) {
        console.error('Error simulating evaluation:', error);
        return NextResponse.json(
            { error: 'Failed to simulate evaluation' },
            { status: 500 }
        );
    }
}
