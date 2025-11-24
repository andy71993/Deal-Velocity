import { NextRequest, NextResponse } from 'next/server';
import { ProposalGenerator } from '@/lib/ai/proposal-generator';
import { saveProposalSection } from '@/lib/db/rfp-queries';

export async function POST(request: NextRequest) {
    try {
        const { requirement, projectId, requirementId, sectionTitle } = await request.json();

        if (!requirement || !projectId) {
            return NextResponse.json(
                { error: 'Missing requirement or projectId' },
                { status: 400 }
            );
        }

        const apiKey = process.env.OPENAI_API_KEY;
        const pineconeKey = process.env.PINECONE_API_KEY;

        if (!apiKey || !pineconeKey) {
            return NextResponse.json(
                { error: 'API keys not configured' },
                { status: 500 }
            );
        }

        const generator = new ProposalGenerator(apiKey, 'http://localhost:8001', pineconeKey);
        const content = await generator.generateDraft(requirement);

        const savedSection = await saveProposalSection({
            project_id: projectId,
            requirement_id: requirementId,
            section_title: sectionTitle || 'Draft Section',
            content: content,
            status: 'draft',
            version: 1
        });

        return NextResponse.json(savedSection);
    } catch (error) {
        console.error('Error generating proposal:', error);
        return NextResponse.json(
            { error: 'Failed to generate proposal' },
            { status: 500 }
        );
    }
}
