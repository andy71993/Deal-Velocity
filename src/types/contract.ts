export interface ContractClause {
    id: string;
    contract_id: string;
    clause_text: string;
    clause_type: string;
    risk_score: number;
    position_start?: number;
    position_end?: number;
}

export interface RiskAnalysis {
    id: string;
    clause_id: string;
    risk_category: string;
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    risk_description: string;
    impact_description: string;
    suggested_alternative: string;
    gpt_reasoning: Record<string, unknown>;
}

export interface ClauseVariation {
    id: string;
    original_clause_id: string;
    modified_clause_text: string;
    modification_type: 'user_edit' | 'ai_suggestion' | 'negotiation';
    accepted: boolean;
    deal_outcome?: 'won' | 'lost' | 'pending';
}

export interface UserFeedback {
    clause_id: string;
    risk_analysis_id?: string;
    feedback_type: 'accurate' | 'inaccurate' | 'helpful' | 'not_helpful';
    rating: number;
    comment?: string;
}
