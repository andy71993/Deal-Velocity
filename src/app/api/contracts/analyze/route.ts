import { NextRequest, NextResponse } from 'next/server';
import { ContractAnalyzer } from '@/lib/ai/contract-analyzer';
import { saveClauseAnalysis } from '@/lib/db/contract-queries';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
    try {
        const { contractText, contractId } = await request.json();

        if (!contractText || !contractId) {
            return NextResponse.json(
                { error: 'Missing contractText or contractId' },
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

        const analyzer = new ContractAnalyzer(apiKey);
        const results = await analyzer.analyzeContract(contractText);

        // Handle contract creation/saving
        try {
            const supabase = createClient();

            // If placeholder or missing, create a new contract
            let targetContractId = contractId;
            if (!contractId || contractId === '00000000-0000-0000-0000-000000000000') {
                // Get user's org ID
                const { data: orgId, error: orgError } = await supabase.rpc('get_auth_org_id');

                if (orgError || !orgId) {
                    console.error('Error getting org ID:', orgError);
                    // Fallback: Try to get from user metadata if RPC fails
                    const { data: { user } } = await supabase.auth.getUser();
                    // If we still can't get an org, we can't save to DB due to RLS
                    if (!user) {
                        console.warn('No authenticated user, skipping DB save');
                        return NextResponse.json(results);
                    }
                }

                // Create new contract
                const { data: newContract, error: createError } = await supabase
                    .from('contracts')
                    .insert({
                        title: 'Analyzed Contract ' + new Date().toLocaleString(),
                        status: 'draft',
                        vendor_id: orgId, // Assign to user's org
                        // buyer_id: null 
                    })
                    .select()
                    .single();

                if (createError) {
                    console.error('Error creating contract:', createError);
                } else if (newContract) {
                    targetContractId = newContract.id;
                }
            }

            // Save to database if we have a valid contract ID
            if (targetContractId && targetContractId !== '00000000-0000-0000-0000-000000000000') {
                for (const clause of results.clauses) {
                    await saveClauseAnalysis(targetContractId, clause);
                }

                // Return the contract ID so frontend can use it
                return NextResponse.json({
                    ...results,
                    contractId: targetContractId
                });
            }
        } catch (dbError) {
            console.error('Database operation failed:', dbError);
            // Don't fail the request if DB save fails, just return analysis
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error('Error analyzing contract:', error);
        return NextResponse.json(
            { error: 'Failed to analyze contract' },
            { status: 500 }
        );
    }
}
