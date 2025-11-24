import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { originalText, changes } = body;

        if (!originalText || !changes) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Forward to Python Document Processor Service
        const pythonServiceUrl = process.env.DOCUMENT_PROCESSOR_URL || 'http://localhost:8000';

        const response = await fetch(`${pythonServiceUrl}/redline`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                original_text: originalText,
                changes: changes
            }),
        });

        if (!response.ok) {
            console.error('Redline generator error:', await response.text());
            return NextResponse.json(
                { error: 'Failed to generate redlines' },
                { status: response.status }
            );
        }

        // Return the file stream
        return new NextResponse(response.body, {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition': 'attachment; filename=redlined_contract.docx',
            },
        });

    } catch (error) {
        console.error('Error in redline proxy:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
