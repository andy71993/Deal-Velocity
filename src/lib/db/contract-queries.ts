import { createClient } from '@/lib/supabase/server';
import { ClauseAnalysis } from '@/lib/ai/contract-analyzer';
import { UserFeedback } from '@/types/contract';

export async function saveClauseAnalysis(
    contractId: string,
    analysis: ClauseAnalysis
) {
    const supabase = createClient();

    // Save clause
    const { data: clause, error: clauseError } = await supabase
        .from('contract_clauses')
        .insert({
            contract_id: contractId,
            clause_text: analysis.clause_text,
            clause_type: analysis.clause_type,
            risk_score: analysis.risk_score
        })
        .select()
        .single();

    if (clauseError) {
        console.error('Error saving clause:', clauseError);
        return null;
    }

    // Save risk analysis
    const { error: riskError } = await supabase
        .from('risk_analysis')
        .insert({
            clause_id: clause.id,
            risk_category: analysis.risk_category,
            risk_level: analysis.risk_level,
            risk_description: analysis.risk_description,
            impact_description: analysis.impact_description,
            suggested_alternative: analysis.suggested_alternative,
            gpt_reasoning: { reasoning: analysis.reasoning }
        });

    if (riskError) {
        console.error('Error saving risk analysis:', riskError);
    }

    return clause;
}

export async function getClauseVariations(clauseId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('clause_variations')
        .select('*')
        .eq('original_clause_id', clauseId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching variations:', error);
        return [];
    }

    return data;
}

export async function saveFeedback(feedbackData: UserFeedback) {
    const supabase = createClient();

    const { error } = await supabase
        .from('user_feedback')
        .insert({
            clause_id: feedbackData.clause_id,
            risk_analysis_id: feedbackData.risk_analysis_id,
            feedback_type: feedbackData.feedback_type,
            rating: feedbackData.rating,
            comment: feedbackData.comment,
            user_id: (await supabase.auth.getUser()).data.user?.id
        });

    if (error) {
        console.error('Error saving feedback:', error);
        throw error;
    }
}
