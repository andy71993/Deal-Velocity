import { createClient } from '@/lib/supabase/server';
import { RFPRequirement, ProposalSection, EvaluatorSimulation } from '@/types/rfp';

export async function saveRequirements(requirements: Omit<RFPRequirement, 'id' | 'created_at'>[]) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('rfp_requirements')
        .insert(requirements)
        .select();

    if (error) throw error;
    return data;
}

export async function getRequirements(projectId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('rfp_requirements')
        .select('*')
        .eq('project_id', projectId)
        .order('page_ref', { ascending: true });

    if (error) throw error;
    return data;
}

export async function saveProposalSection(section: Omit<ProposalSection, 'id' | 'created_at' | 'updated_at'>) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('proposal_sections')
        .insert(section)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function saveSimulation(simulation: Omit<EvaluatorSimulation, 'id' | 'created_at'>) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('evaluator_simulations')
        .insert(simulation)
        .select()
        .single();

    if (error) throw error;
    return data;
}
