import { NextRequest, NextResponse } from 'next/server';
import { RFPParser } from '@/lib/ai/rfp-parser';
import { saveRequirements } from '@/lib/db/rfp-queries';

export async function POST(request: NextRequest) {
    try {
        const { rfpText, projectId } = await request.json();

        if (!rfpText || !projectId) {
            return NextResponse.json(
                { error: 'Missing rfpText or projectId' },
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

        const parser = new RFPParser(apiKey);
        const requirements = await parser.parseRFP(rfpText, projectId);

        const savedRequirements = await saveRequirements(requirements);

        return NextResponse.json(savedRequirements);
    } catch (error) {
        console.error('Error parsing RFP:', error);
        return NextResponse.json(
            { error: 'Failed to parse RFP' },
            { status: 500 }
        );
    }
}
