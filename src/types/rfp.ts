export interface RFPRequirement {
    id: string;
    project_id: string;
    req_text: string;
    req_type: 'technical' | 'management' | 'past_performance' | 'compliance';
    priority: 'mandatory' | 'desirable' | 'optional';
    page_ref?: number;
}

export interface ProposalSection {
    id: string;
    project_id: string;
    requirement_id?: string;
    section_title: string;
    content: string;
    status: 'draft' | 'review' | 'approved';
    version: number;
}

export interface EvaluatorSimulation {
    id: string;
    proposal_section_id: string;
    simulated_score: number;
    evaluator_persona: 'technical_lead' | 'contract_officer' | 'executive';
    feedback: string;
    improvement_suggestions: string;
}
