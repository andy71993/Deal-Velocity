import { NextRequest, NextResponse } from 'next/server';
import { getClauseVariations } from '@/lib/db/contract-queries';

export async function GET(
    request: NextRequest,
    { params }: { params: { clauseId: string } }
) {
    try {
        const variations = await getClauseVariations(params.clauseId);
        return NextResponse.json(variations);
    } catch (error) {
        console.error('Error fetching variations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch variations' },
            { status: 500 }
        );
    }
}
