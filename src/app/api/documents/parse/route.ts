import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        // Forward to Python Document Processor Service
        // Assuming it's running on localhost:8000
        const pythonServiceUrl = process.env.DOCUMENT_PROCESSOR_URL || 'http://localhost:8000';

        const backendFormData = new FormData();
        backendFormData.append('file', file);

        const response = await fetch(`${pythonServiceUrl}/parse`, {
            method: 'POST',
            body: backendFormData,
        });

        if (!response.ok) {
            console.error('Document processor error:', await response.text());
            return NextResponse.json(
                { error: 'Failed to process document' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('Error in document parse proxy:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
