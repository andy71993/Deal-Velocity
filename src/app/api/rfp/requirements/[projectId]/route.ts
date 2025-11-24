import { NextRequest, NextResponse } from 'next/server';
import { getRequirements } from '@/lib/db/rfp-queries';

export async function GET(
    request: NextRequest,
    { params }: { params: { projectId: string } }
) {
    try {
        const requirements = await getRequirements(params.projectId);
        return NextResponse.json(requirements);
    } catch (error) {
        console.error('Error fetching requirements:', error);
        return NextResponse.json(
            { error: 'Failed to fetch requirements' },
            { status: 500 }
        );
    }
}
