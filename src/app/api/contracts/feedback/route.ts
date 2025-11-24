import { NextRequest, NextResponse } from 'next/server';
import { saveFeedback } from '@/lib/db/contract-queries';

export async function POST(request: NextRequest) {
    try {
        const feedbackData = await request.json();
        await saveFeedback(feedbackData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving feedback:', error);
        return NextResponse.json(
            { error: 'Failed to save feedback' },
            { status: 500 }
        );
    }
}
